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

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isInitiatorRef = useRef(role === "CLIENT");

  // Initialize media devices
  const initMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err: any) {
      console.error("Camera/Mic permission error:", err);
      setConnectionState("PERMISSION_DENIED");
      setErrorMessage(
        "Camera or microphone permission was denied. Please allow access in browser settings to continue."
      );
      throw err;
    }
  }, []);

  // Initialize WebRTC and Socket.IO
  useEffect(() => {
    // Only request media and connect socket once authorized with valid user and session
    if (enabled === false || !userId || !sessionCode) {
      return;
    }

    let isMounted = true;

    async function start() {
      try {
        const stream = await initMedia();
        if (!isMounted) return;

        // Initialize Socket.io signaling
        const socket = io({
          transports: ["websocket", "polling"],
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
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
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
          if (onRecordingWarning) onRecordingWarning(warning);
        });

        socket.on("peer-disconnected", ({ graceSeconds }) => {
          setConnectionState("PEER_DISCONNECTED");
        });

        socket.on("call-ended", ({ endedByRole }) => {
          setConnectionState("ENDED");
          if (onCallEnded) onCallEnded(endedByRole);
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
      // Cleanup tracks & peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionCode, userId, role, initMedia, onCallEnded]);

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
    if (onCallEnded) onCallEnded(role);
  }, [sessionCode, role, onCallEnded]);

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
    toggleAudio,
    toggleVideo,
    endCall,
    notifyDeviceDetected,
  };
}
