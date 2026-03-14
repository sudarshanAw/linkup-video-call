import { useEffect, useRef, useState, useCallback } from "react";
import { createWebRTCConnection, type WebRTCConnection } from "@/lib/webrtc";

type CallStatus = "connecting" | "waiting" | "connected" | "disconnected" | "error";

interface UseVideoCallProps { roomId: string; userName: string; }

export function useVideoCall({ roomId, userName }: UseVideoCallProps) {
  const [status, setStatus] = useState<CallStatus>("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const connRef = useRef<WebRTCConnection | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const conn = createWebRTCConnection({
      roomId, userName,
      onStatusChange: s => { if (mountedRef.current) setStatus(s); },
      onLocalStream: s => { if (mountedRef.current) setLocalStream(s); },
      onRemoteStream: s => { if (mountedRef.current) setRemoteStream(s); },
    });
    connRef.current = conn;
    conn.connect();
    return () => { mountedRef.current = false; conn.disconnect(); };
  }, [roomId, userName]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(v => !v);
  }, [localStream]);

  return { status, isMuted, isVideoOff, toggleMute, toggleVideo, localStream, remoteStream };
}
