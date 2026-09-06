"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ShieldAlert,
  Clock,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Volume2,
  AlertTriangle,
} from "lucide-react";
import { useWebRTC, ConnectionState } from "@/hooks/useWebRTC";
import { usePrivacyShield } from "@/hooks/usePrivacyShield";
import { DeviceDetector } from "@/lib/security/deviceDetector";
import ForensicWatermark from "@/components/calling/ForensicWatermark";
import ReportModal from "@/components/safety/ReportModal";
import ListenerPreCallModal from "@/components/calling/ListenerPreCallModal";
import SpeakerRatingCard from "@/components/calling/SpeakerRatingCard";
import Link from "next/link";

export default function CallPage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.sessionId as string;

  const [sessionInfo, setSessionInfo] = useState<{
    role: "CLIENT" | "LISTENER";
    peerNickname: string;
    callStartedAt: string;
    durationMinutes: number;
    isAlreadyEnded: boolean;
    callToken?: string;
    minListenerEarningInr?: number;
    maxListenerEarningInr?: number;
    speakerRating?: number | null;
    isRated?: boolean;
  } | null>(null);

  const [listenerAcceptedNotice, setListenerAcceptedNotice] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [callEndedInfo, setCallEndedInfo] = useState<{
    ended: boolean;
    endedByRole?: string;
    isEarningEligible?: boolean;
  }>({ ended: false });

  // Anti-Recording Privacy Shield (Detects screenshots, window blur, capture tools)
  const privacyShield = usePrivacyShield();

  // Spying / Phone Camera Warning State
  const [recordingDeviceAlert, setRecordingDeviceAlert] = useState<{
    deviceType: string;
    timestamp: number;
  } | null>(null);

  const handleRecordingWarning = (warning: { deviceType: string; timestamp: number }) => {
    setRecordingDeviceAlert(warning);
  };

  // Fetch session details securely
  useEffect(() => {
    async function loadInfo() {
      try {
        const res = await fetch(`/api/calls/session-info?sessionCode=${sessionCode}`);
        if (!res.ok) {
          throw new Error("Could not load session.");
        }
        const data = await res.json();
        setSessionInfo(data);
        if (data.isAlreadyEnded) {
          setCallEndedInfo({ ended: true });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInfo(false);
      }
    }
    if (session) {
      loadInfo();
    }
  }, [sessionCode, session]);

  // Handle server call completion
  const handleCallEndedCallback = async (endedByRole: string) => {
    setCallEndedInfo({ ended: true, endedByRole });
    try {
      const res = await fetch("/api/calls/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionCode, endedByRole }),
      });
      if (res.ok) {
        const d = await res.json();
        setCallEndedInfo((prev) => ({
          ...prev,
          isEarningEligible: d.isEarningEligible,
        }));
      }
    } catch (e) {
      console.error("Failed to complete call on server:", e);
    }
  };

  const userId = session?.user?.id || "";
  const role = sessionInfo?.role || "CLIENT";

  const {
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
  } = useWebRTC({
    sessionCode,
    userId,
    role,
    callToken: sessionInfo?.callToken,
    enabled: Boolean(
      session?.user?.id &&
      sessionInfo?.callToken &&
      !sessionInfo?.isAlreadyEnded &&
      (sessionInfo?.role === "CLIENT" || listenerAcceptedNotice)
    ),
    onCallEnded: handleCallEndedCallback,
    onRecordingWarning: handleRecordingWarning,
  });

  // Client-side AI / Computer Vision device detector scanning remote peer's camera feed
  useEffect(() => {
    if (connectionState === "CONNECTED" && remoteVideoRef.current) {
      const detector = new DeviceDetector();
      detector.start(remoteVideoRef.current, (result) => {
        // Dispatches real-time alert through WebSocket to the other user
        notifyDeviceDetected(result.deviceType);
      }, 1500);

      return () => {
        detector.stop();
      };
    }
  }, [connectionState, notifyDeviceDetected, remoteVideoRef]);

  // Authoritative 30-minute countdown timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(30 * 60);

  useEffect(() => {
    if (!sessionInfo?.callStartedAt || callEndedInfo.ended) return;

    const startedTime = new Date(sessionInfo.callStartedAt).getTime();
    const totalDurationMs = (sessionInfo.durationMinutes || 30) * 60 * 1000;

    const timer = setInterval(() => {
      const elapsedMs = Date.now() - startedTime;
      const remainingSecs = Math.max(0, Math.floor((totalDurationMs - elapsedMs) / 1000));
      setTimeLeftSeconds(remainingSecs);

      if (remainingSecs <= 0) {
        clearInterval(timer);
        endCall();
        handleCallEndedCallback("TIMEOUT");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionInfo, callEndedInfo.ended, endCall]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeLeftSeconds / 60);
    const secs = timeLeftSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [timeLeftSeconds]);

  if (authStatus === "loading" || loadingInfo) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-300 text-sm">
        <Loader2 className="w-6 h-6 animate-spin mr-3 text-primary-400" />
        <span>Connecting to secure session room...</span>
      </div>
    );
  }

  if (!session || !sessionInfo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-surface">
        <AlertCircle className="w-10 h-10 text-amber-600 mb-3" />
        <h2 className="text-xl font-medium text-slate-900 mb-2">Session Unavailable</h2>
        <p className="text-xs text-slate-600 max-w-sm mb-6">
          This call room does not exist, has expired, or you do not have permission to join.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-primary-700 text-white text-xs font-semibold"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // If call has ended, show clean summary screen with earnings / reflection
  if (callEndedInfo.ended) {
    const isListener = sessionInfo.role === "LISTENER";
    const earned = callEndedInfo.isEarningEligible;

    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-warm-50">
        <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-serif text-slate-900 font-normal">Conversation Ended</h2>
            <p className="text-xs text-slate-500">
              Thank you for participating with {sessionInfo.peerNickname}.
            </p>
          </div>

          {/* Earnings card for listener */}
          {isListener && (
            <div className="p-5 rounded-2xl bg-surface-muted border border-border space-y-2 text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Listener Session Summary
              </span>
              <div className="text-2xl font-bold text-slate-900">
                {earned ? (
                  <span className="text-emerald-700">
                    ₹{sessionInfo.minListenerEarningInr || 8} - ₹{sessionInfo.maxListenerEarningInr || 14} Payout
                  </span>
                ) : (
                  <span className="text-slate-600">₹0 (Call left before client)</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {earned
                  ? "Your final earnings for this session will be calculated from the speaker's rating evaluation of your attentiveness and video presence."
                  : "Under platform rules, leaving a conversation before the client ends it forfeits earnings for this session."}
              </p>
            </div>
          )}

          {/* Experience evaluation for speaker */}
          {!isListener && (
            <SpeakerRatingCard
              sessionCode={sessionCode}
              peerNickname={sessionInfo.peerNickname}
              minEarningInr={sessionInfo.minListenerEarningInr || 8}
              maxEarningInr={sessionInfo.maxListenerEarningInr || 14}
              baseEarningInr={10}
            />
          )}

          {/* Safety report option */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="text-xs text-slate-500 hover:text-red-600 flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report an issue with this call</span>
            </button>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-center gap-3">
            <Link
              href={isListener ? "/listen" : "/talk"}
              className="w-full py-3 px-4 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold transition-colors"
            >
              {isListener ? "Back to Listener Dashboard" : "Start Another Conversation"}
            </Link>
          </div>
        </div>

        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          sessionCode={sessionCode}
          reportedRoleName={sessionInfo.peerNickname}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white relative select-none overflow-hidden min-h-[calc(100vh-4rem)]">
      {/* Top Header Overlay */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center font-semibold text-primary-400 text-sm">
            {sessionInfo.peerNickname.charAt(0)}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
              {sessionInfo.peerNickname}
            </h2>
            <span className="text-[11px] text-slate-300 block">
              Anonymous Peer Conversation
            </span>
          </div>
        </div>

        {/* Server CountDown Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-slate-700/80 text-xs font-mono font-medium text-emerald-400 backdrop-blur-md">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-900/60 border border-slate-700/80 text-slate-300 hover:text-white transition-colors"
            title="Report participant"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video Arena */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-950">
        {/* Dynamic Forensic Watermark (Deters phone photographs / screen recordings) */}
        <ForensicWatermark sessionCode={sessionCode} peerNickname={sessionInfo.peerNickname} />

        {/* Real-time Phone Camera / Spying Warning Alert Modal */}
        {recordingDeviceAlert && (
          <div className="absolute top-20 inset-x-4 z-40 max-w-md mx-auto bg-red-950/95 border-2 border-red-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-800 text-white shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-100">
                  Warning: Potential Recording Device Detected!
                </h3>
                <p className="text-xs text-red-200/90 leading-relaxed">
                  Our security shield detected a mobile phone or recording device in your peer&apos;s camera view. For your safety, do not disclose personal details.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-red-800/60">
              <button
                type="button"
                onClick={() => {
                  toggleVideo();
                  setRecordingDeviceAlert(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Turn Off My Camera
              </button>
              <button
                type="button"
                onClick={() => {
                  endCall();
                  setIsReportModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                End & Report
              </button>
              <button
                type="button"
                onClick={() => setRecordingDeviceAlert(null)}
                className="px-2.5 py-1.5 text-xs text-red-300 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Anti-Screen-Recording Privacy Shield Overlay */}
        {privacyShield.isShieldActive && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-xl text-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">Privacy Shield Active</h4>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              {privacyShield.shieldReason || "Video is protected against screen capture and recording tools."}
            </p>
          </div>
        )}

        {/* Remote Video (Fills Viewport) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover transition-all duration-300 ${
            privacyShield.isShieldActive ? "filter blur-3xl opacity-10" : ""
          } ${
            connectionState === "CONNECTED" && !peerMediaState.isVideoOff ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Remote Video Fallback/Avatar when remote video is off or connecting */}
        {(connectionState !== "CONNECTED" || peerMediaState.isVideoOff) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl font-semibold text-primary-300 shadow-xl">
              {sessionInfo.peerNickname.charAt(0)}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-slate-200">
                {sessionInfo.peerNickname}
              </h3>
              <p className="text-xs text-slate-400">
                {connectionState === "WAITING_FOR_PEER" && "Waiting for peer to connect..."}
                {connectionState === "CONNECTING" && "Establishing encrypted WebRTC connection..."}
                {connectionState === "CONNECTED" && peerMediaState.isVideoOff && "Peer has turned camera off (Audio only)"}
                {connectionState === "RECONNECTING" && "Reconnecting signal..."}
                {connectionState === "PEER_DISCONNECTED" && "Peer disconnected. Waiting 15s for reconnection..."}
                {connectionState === "PERMISSION_DENIED" && errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Local Video Picture-in-Picture (Desktop: bottom right, Mobile: top right / overlay) */}
        <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-8 z-20 w-28 sm:w-44 aspect-video rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 shadow-2xl transition-all">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-[10px] text-slate-400">
              <VideoOff className="w-4 h-4 mb-1 text-slate-500" />
              <span>Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 text-[10px] font-medium bg-black/60 px-1.5 py-0.5 rounded text-slate-200">
            You
          </div>
        </div>

        {/* Status Indicator Banner */}
        <div className="absolute top-20 inset-x-0 z-20 flex justify-center pointer-events-none px-4">
          {connectionState === "CONNECTING" && (
            <div className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 backdrop-blur-md">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting...</span>
            </div>
          )}
          {connectionState === "POOR_CONNECTION" && (
            <div className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 backdrop-blur-md">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Poor connection detected</span>
            </div>
          )}
          {connectionState === "PEER_DISCONNECTED" && (
            <div className="px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 backdrop-blur-md animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Peer disconnected. Waiting for recovery...</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Privacy Reminder & Control Bar */}
      <div className="absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col items-center gap-3">
        {/* Subtle Privacy Reminder (Section 6 & 32) */}
        <p className="text-[11px] text-slate-400 text-center max-w-md px-2">
          Remember: Please do not share your real name, phone number, address, email, or passwords.
        </p>

        {/* Controls Container */}
        <div className="flex items-center gap-4 sm:gap-6 bg-slate-900/90 border border-slate-700/80 px-6 py-3 rounded-full backdrop-blur-md shadow-2xl">
          {/* Mute/Unmute Audio */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`p-3.5 rounded-full transition-all ${
              isAudioMuted
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
            title={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
            aria-label={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera On/Off: Locked ON for listener, toggleable for speaker */}
          {sessionInfo.role === "LISTENER" ? (
            <div
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium cursor-default shadow-xs"
              title="Camera is mandatory for listeners to maintain genuine presence"
            >
              <Video className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] hidden sm:inline font-semibold">Camera Required</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-3.5 rounded-full transition-all ${
                isVideoOff
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
              title={isVideoOff ? "Turn camera on" : "Turn camera off"}
              aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* End Call */}
          <button
            type="button"
            onClick={endCall}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all shadow-lg active:scale-95"
            title="End Conversation"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </div>

      {/* Listener Mandatory Pre-Call Notice Modal */}
      {sessionInfo.role === "LISTENER" && !listenerAcceptedNotice && (
        <ListenerPreCallModal
          isOpen={!listenerAcceptedNotice}
          onAccept={() => setListenerAcceptedNotice(true)}
          minEarningInr={sessionInfo.minListenerEarningInr}
          maxEarningInr={sessionInfo.maxListenerEarningInr}
        />
      )}

      {/* Safety Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        sessionCode={sessionCode}
        reportedRoleName={sessionInfo.peerNickname}
      />
    </div>
  );
}
