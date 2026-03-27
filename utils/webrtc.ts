let peerConnection: RTCPeerConnection | null = null;
let iceCandidateQueue: RTCIceCandidateInit[] = [];

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function createPeerConnection(
  localStream: MediaStream,
  setRemoteStream: (stream: MediaStream) => void,
  onIceCandidate: (candidate: RTCIceCandidate) => void
): RTCPeerConnection {
  // Close existing connection if any
  closePeerConnection();

  const pc = new RTCPeerConnection(ICE_SERVERS);
  iceCandidateQueue = [];

  console.log('RTCPeerConnection created');

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('New ICE candidate generated');
      onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      console.log('Remote track received');
      setRemoteStream(event.streams[0]);
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log('ICE Connection State:', pc.iceConnectionState);
  };

  pc.onsignalingstatechange = () => {
    console.log('Signaling State:', pc.signalingState);
    if (pc.signalingState === 'stable') {
      processQueuedIceCandidates();
    }
  };

  peerConnection = pc;
  return pc;
}

async function processQueuedIceCandidates() {
  if (!peerConnection || peerConnection.remoteDescription === null) return;

  console.log(`Processing ${iceCandidateQueue.length} queued ICE candidates`);
  while (iceCandidateQueue.length > 0) {
    const candidate = iceCandidateQueue.shift();
    if (candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding queued ICE candidate', e);
      }
    }
  }
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

  // Try to process any candidates that arrived before the offer was set
  processQueuedIceCandidates();

  return answer;
}

export async function handleAnswer(
  answer: RTCSessionDescriptionInit
): Promise<void> {
  if (!peerConnection) {
    throw new Error('Peer connection not initialized');
  }
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

  // Try to process any candidates that arrived before the answer was set
  processQueuedIceCandidates();
}

export async function addIceCandidate(
  candidate: RTCIceCandidateInit
): Promise<void> {
  if (!peerConnection) {
    // If pc is not ready, we can't even queue correctly if it's not and won't be initialized
    // But in our flow, pc is initialized before joining room.
    return;
  }

  if (peerConnection.remoteDescription) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('Error adding ICE candidate directly', e);
    }
  } else {
    console.log('Remote description not set yet, queuing ICE candidate');
    iceCandidateQueue.push(candidate);
  }
}

export function closePeerConnection(): void {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    iceCandidateQueue = [];
    console.log('RTCPeerConnection closed');
  }
}
