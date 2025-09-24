export interface CameraConstraints {
  video: {
    width: { ideal: number };
    height: { ideal: number };
    facingMode: 'user' | 'environment';
  };
  audio: boolean;
}

export const defaultCameraConstraints: CameraConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  },
  audio: true
};

export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(defaultCameraConstraints);
    // Stop the stream immediately as we just wanted to check permissions
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
}

export async function startCamera(
  videoElement: HTMLVideoElement,
  constraints: CameraConstraints = defaultCameraConstraints
): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    await videoElement.play();
    return stream;
  } catch (error) {
    console.error('Error starting camera:', error);
    throw error;
  }
}

export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}

export async function switchCamera(
  currentStream: MediaStream,
  videoElement: HTMLVideoElement,
  facingMode: 'user' | 'environment'
): Promise<MediaStream> {
  // Stop current stream
  stopCamera(currentStream);
  
  // Start new stream with different facing mode
  const newConstraints: CameraConstraints = {
    ...defaultCameraConstraints,
    video: {
      ...defaultCameraConstraints.video,
      facingMode
    }
  };
  
  return startCamera(videoElement, newConstraints);
}

export function toggleAudio(stream: MediaStream, enabled: boolean): void {
  const audioTracks = stream.getAudioTracks();
  audioTracks.forEach(track => {
    track.enabled = enabled;
  });
}

export function toggleVideo(stream: MediaStream, enabled: boolean): void {
  const videoTracks = stream.getVideoTracks();
  videoTracks.forEach(track => {
    track.enabled = enabled;
  });
}