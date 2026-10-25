"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { RTC_CONFIGURATION } from "@/lib/webrtc/config";

export type ConnectionState =
  | "INITIALIZING"
  | "WAITING_FOR_PEER"
  | "CONNECTING"
  | "CONNECTED"
  | "POOR_CONNECTION"
  | "RECONNECTING"
  | "PEER_DISCONNECTED"
  | "PERMISSION_DENIED"
  | "ENDED"
  | "ERROR";

interface UseWebRTCOptions {
  sessionCode: string;
  userId: string;
  role: "CLIENT" | "LISTENER";
  callToken?: string;
  enabled?: boolean;
  onCallEnded?: (endedByRole: string) => void;
  onRecordingWarning?: (warning: { deviceType: string; timestamp: number }) => void;
}

export function useWebRTC({
  sessionCode,
  userId,
  role,
  callToken,
  enabled = true,
  onCallEnded,
  onRecordingWarning,
}: UseWebRTCOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("INITIALIZING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerMediaState, setPeerMediaState] = useState({ isAudioMuted: false, isVideoOff: false });

  // Stream state to trigger reactive DOM bindings without re-render cascades
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isInitiatorRef = useRef(role === "CLIENT");

  // Stable callback refs so consumer re-renders NEVER cause socket or camera disconnects
  const onCallEndedRef = useRef(onCallEnded);
  onCallEndedRef.current = onCallEnded;

  const onRecordingWarningRef = useRef(onRecordingWarning);
  onRecordingWarningRef.current = onRecordingWarning;

  // Callback ref for local video: mounts stream immediately as soon as DOM element exists
  const setLocalVideoNode = useCallback((node: HTMLVideoElement | null) => {
    localVideoRef.current = node;
    if (node && localStreamRef.current) {
      if (node.srcObject !== localStreamRef.current) {
        node.srcObject = localStreamRef.current;
      }
    }
  }, []);

  // Callback ref for remote video: mounts stream immediately as soon as DOM element exists
  const setRemoteVideoNode = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoRef.current = node;
    if (node && remoteStreamRef.current) {
      if (node.srcObject !== remoteStreamRef.current) {
        node.srcObject = remoteStreamRef.current;
      }
    }
  }, []);

  // Sync streams to video elements when state changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream]);

  // Initialize media devices with resilient fallback (reuses active stream to prevent blinking)
  const initMedia = useCallback(async () => {
    if (localStreamRef.current && localStreamRef.current.active) {
      return localStreamRef.current;
    }

    try {
      // 1. Try standard user-facing video + audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (videoErr: any) {
      console.warn("Standard camera/mic access failed or denied, trying fallback:", videoErr);
      try {
        // 2. Fallback to basic audio only
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        setIsVideoOff(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        return audioStream;
      } catch (audioErr: any) {
        console.warn("All media devices denied or absent, proceeding in signaling mode:", audioErr);
        // 3. Fallback to dummy silent/black stream so socket signaling and connection state succeed
        const emptyStream = new MediaStream();
        localStreamRef.current = emptyStream;
        setLocalStream(emptyStream);
        setIsVideoOff(true);
        setIsAudioMuted(true);
        setErrorMessage(
          "Camera/microphone not detected or permission denied. Joined in signaling/test mode."
        );
        return emptyStream;
      }
    }
  }, []);

  // Initialize WebRTC and Socket.IO (runs ONLY when connection credentials change, NOT on parent re-renders)
  useEffect(() => {
    if (enabled === false || !userId || !sessionCode) {
      return;
    }

    let isMounted = true;

    async function start() {
      try {
        const stream = await initMedia();
        if (!isMounted) return;

        // Disconnect existing socket if any
        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        // Initialize Socket.io signaling
        const socket = io({
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        const pc = new RTCPeerConnection(RTC_CONFIGURATION);
        peerConnectionRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle incoming remote tracks
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            remoteStreamRef.current = event.streams[0];
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && socket.connected) {
            socket.emit("ice-candidate", {
              sessionCode,
              candidate: event.candidate,
            });
          }
        };

        // Monitor connection state
        pc.onconnectionstatechange = () => {
          switch (pc.connectionState) {
            case "connecting":
              setConnectionState("CONNECTING");
              break;
            case "connected":
              setConnectionState("CONNECTED");
              break;
            case "disconnected":
              setConnectionState("RECONNECTING");
              break;
            case "failed":
              setConnectionState("POOR_CONNECTION");
              break;
            case "closed":
              setConnectionState("ENDED");
              break;
          }
        };

        // Socket signaling listeners
        socket.on("connect", () => {
          socket.emit("join-room", { sessionCode, callToken, userId, role });
          setConnectionState("WAITING_FOR_PEER");
        });

        socket.on("room-joined", ({ participantCount }) => {
          if (participantCount < 2) {
            setConnectionState("WAITING_FOR_PEER");
          }
        });

        socket.on("peer-joined", async () => {
          setConnectionState("CONNECTING");
          // If initiator (Client), create offer
          if (isInitiatorRef.current) {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit("offer", { sessionCode, sdp: offer });
            } catch (e) {
              console.error("Failed to create offer:", e);
            }
          }
        });

        socket.on("offer", async ({ sdp }) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { sessionCode, sdp: answer });
          } catch (e) {
            console.error("Failed to handle offer:", e);
          }
        });

        socket.on("answer", async ({ sdp }) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          } catch (e) {
            console.error("Failed to handle answer:", e);
          }
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          try {
            if (candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (e) {
            console.error("Failed to add ICE candidate:", e);
          }
        });

        socket.on("peer-media-state", (state) => {
          setPeerMediaState(state);
        });

        socket.on("recording-device-warning", (warning) => {
          onRecordingWarningRef.current?.(warning);
        });

        socket.on("peer-disconnected", () => {
          setConnectionState("PEER_DISCONNECTED");
        });

        socket.on("call-ended", ({ endedByRole }) => {
          setConnectionState("ENDED");
          onCallEndedRef.current?.(endedByRole);
        });

        socket.on("connect_error", (err) => {
          console.error("Socket signaling connection error:", err.message);
          setErrorMessage(`Signaling connection error: ${err.message}`);
        });

        socket.on("reconnect", () => {
          socket.emit("join-room", { sessionCode, callToken, userId, role });
        });

        socket.on("error-message", ({ message }) => {
          setConnectionState("ERROR");
          setErrorMessage(message);
        });
      } catch (err) {
        console.error("WebRTC initialization error:", err);
      }
    }

    start();

    return () => {
      isMounted = false;
      // Cleanup tracks & peer connection only when unmounting or parameters genuinely change
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [enabled, sessionCode, userId, role, callToken, initMedia]);

  // Toggle audio track (mute/unmute)
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const muted = !audioTrack.enabled;
        setIsAudioMuted(muted);
        socketRef.current?.emit("media-state", {
          sessionCode,
          isAudioMuted: muted,
          isVideoOff,
        });
      }
    }
  }, [sessionCode, isVideoOff]);

  // Toggle video track (camera on/off)
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const off = !videoTrack.enabled;
        setIsVideoOff(off);
        socketRef.current?.emit("media-state", {
          sessionCode,
          isAudioMuted,
          isVideoOff: off,
        });
      }
    }
  }, [sessionCode, isAudioMuted]);

  // Terminate call gracefully
  const endCall = useCallback(() => {
    socketRef.current?.emit("end-call", { sessionCode, endedByRole: role });
    setConnectionState("ENDED");
    onCallEndedRef.current?.(role);
  }, [sessionCode, role]);

  // Dispatch recording device detection alert to other peer
  const notifyDeviceDetected = useCallback(
    (deviceType: string) => {
      socketRef.current?.emit("recording-device-alert", {
        sessionCode,
        deviceType,
      });
    },
    [sessionCode]
  );

  return {
    connectionState,
    errorMessage,
    isAudioMuted,
    isVideoOff,
    peerMediaState,
    localVideoRef,
    remoteVideoRef,
    setLocalVideoNode,
    setRemoteVideoNode,
    toggleAudio,
    toggleVideo,
    endCall,
    notifyDeviceDetected,
  };
}
