import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check } from "lucide-react";
import { useVideoCall } from "@/hooks/use-video-call";

export default function Room() {
  const { roomId } = useParams();
  const [, navigate] = useLocation();
  const userName = new URLSearchParams(window.location.search).get("name") || "Guest";
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);

  const { status, isMuted, isVideoOff, toggleMute, toggleVideo, localStream, remoteStream } =
    useVideoCall({ roomId: roomId!, userName });

  useEffect(() => { if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream; }, [localStream]);
  useEffect(() => { if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream; }, [remoteStream]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabel: Record<string, string> = {
    connecting: "Connecting...", waiting: "Waiting for someone", connected: "Connected",
    disconnected: "Disconnected", error: "Error",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">LinkUp</h1>
          <Badge variant="secondary" className="text-xs">{statusLabel[status] ?? status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{roomId}</code>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyRoomId}>
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden bg-zinc-950">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <Video className="w-7 h-7 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm">Share the room ID to invite someone</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-4 right-4 w-32 sm:w-40 aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
          {isVideoOff ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <VideoOff className="w-5 h-5 text-zinc-500" />
            </div>
          ) : (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          )}
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 py-4 border-t border-border bg-card">
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-full" onClick={toggleMute}>
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={() => navigate("/")}>
          <PhoneOff className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-full" onClick={toggleVideo}>
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
