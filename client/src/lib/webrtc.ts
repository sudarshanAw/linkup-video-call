type CallStatus = "connecting" | "waiting" | "connected" | "disconnected" | "error";

interface WebRTCConfig {
  roomId: string;
  userName: string;
  onStatusChange: (status: CallStatus) => void;
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (stream: MediaStream) => void;
}

export interface WebRTCConnection { connect: () => void; disconnect: () => void; }

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function createWebRTCConnection(config: WebRTCConfig): WebRTCConnection {
  const { roomId, userName, onStatusChange, onLocalStream, onRemoteStream } = config;
  let ws: WebSocket | null = null;
  let pc: RTCPeerConnection | null = null;
  let localStream: MediaStream | null = null;
  let isInitiator = false;
  let disconnected = false;

  function getWsUrl() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }

  async function connect() {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      onLocalStream(localStream);
      ws = new WebSocket(getWsUrl());
      ws.onopen = () => { if (!disconnected) ws!.send(JSON.stringify({ type: "join", roomId, userName })); };
      ws.onmessage = async (event) => { await handleMessage(JSON.parse(event.data)); };
      ws.onerror = () => onStatusChange("error");
      ws.onclose = () => { if (!disconnected) onStatusChange("disconnected"); };
    } catch (err) {
      console.error("Failed to connect:", err);
      onStatusChange("error");
    }
  }

  async function handleMessage(message: any) {
    switch (message.type) {
      case "room-full": onStatusChange("error"); break;
      case "room-ready": isInitiator = message.participants.length === 1; onStatusChange("waiting"); break;
      case "user-joined": onStatusChange("connected"); if (isInitiator) await createOffer(); break;
      case "user-left": onStatusChange("disconnected"); cleanupPeer(); break;
      case "offer": if (!isInitiator) { onStatusChange("connected"); await handleOffer(message.sdp); } break;
      case "answer": if (pc) await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: message.sdp })); break;
      case "ice-candidate": if (pc && message.candidate) await pc.addIceCandidate(new RTCIceCandidate(message.candidate)); break;
    }
  }

  function createPeerConnection() {
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    if (localStream) localStream.getTracks().forEach(track => pc!.addTrack(track, localStream!));
    pc.ontrack = (event) => onRemoteStream(event.streams[0]);
    pc.onicecandidate = (event) => {
      if (event.candidate && ws?.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
    };
    return pc;
  }

  async function createOffer() {
    const peer = createPeerConnection();
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    ws?.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
  }

  async function handleOffer(sdp: string) {
    const peer = createPeerConnection();
    await peer.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    ws?.send(JSON.stringify({ type: "answer", sdp: answer.sdp }));
  }

  function cleanupPeer() { if (pc) { pc.close(); pc = null; } }

  function disconnect() {
    disconnected = true;
    cleanupPeer();
    if (ws) { ws.close(); ws = null; }
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
  }

  return { connect, disconnect };
}
