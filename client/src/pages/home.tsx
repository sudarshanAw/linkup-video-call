import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Users, Zap } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  const generateRoomId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
  };

  const handleJoin = () => {
    if (!userName.trim()) { setError("Please enter your name"); return; }
    if (!roomId.trim()) { setError("Please enter or generate a room ID"); return; }
    setError("");
    navigate(`/room/${roomId.trim()}?name=${encodeURIComponent(userName.trim())}`);
  };

  const handleCreateRoom = () => {
    if (!userName.trim()) { setError("Please enter your name first"); return; }
    setError("");
    navigate(`/room/${generateRoomId()}?name=${encodeURIComponent(userName.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">LinkUp</h1>
          </div>
          <p className="text-muted-foreground text-sm">Simple 1-to-1 video calls. No sign-up needed.</p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input id="name" placeholder="Enter your name" value={userName}
              onChange={e => { setUserName(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleJoin()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room">Room ID</Label>
            <div className="flex gap-2">
              <Input id="room" placeholder="Enter room ID" value={roomId}
                onChange={e => { setRoomId(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleJoin()} />
              <Button variant="outline" onClick={() => setRoomId(generateRoomId())} className="shrink-0 text-xs">Generate</Button>
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleJoin} className="flex-1">Join Room</Button>
            <Button onClick={handleCreateRoom} variant="outline" className="flex-1">Create Room</Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{ icon: Video, label: "HD Video" }, { icon: Users, label: "1-to-1 Calls" }, { icon: Zap, label: "No Sign-up" }].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-card border border-card-border rounded-lg p-3 flex flex-col items-center gap-1.5">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
