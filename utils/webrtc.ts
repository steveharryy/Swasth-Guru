let peerConnection: RTCPeerConnection | null = null;

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function createPeerConnection(
  localStream: MediaStream,
  setRemoteStream: (stream: MediaStream) => void,
  onIceCandidate: (candidate: RTCIceCandidate) => void
): RTCPeerConnection {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      setRemoteStream(event.streams[0]);
    }
  };

  peerConnection = pc;
  return pc;
}

export async function createOffer(): Promise<RTCSessionDescriptionInit> {
  if (!peerConnection) {
    throw new Error('Peer connection not initialized');
  }
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
}

export async function handleOffer(
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  if (!peerConnection) {
    throw new Error('Peer connection not initialized');
  }
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
}

export async function handleAnswer(
  answer: RTCSessionDescriptionInit
): Promise<void> {
  if (!peerConnection) {
    throw new Error('Peer connection not initialized');
  }
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

export async function addIceCandidate(
  candidate: RTCIceCandidateInit
): Promise<void> {
  if (!peerConnection) {
    throw new Error('Peer connection not initialized');
  }
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

export function closePeerConnection(): void {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
}
