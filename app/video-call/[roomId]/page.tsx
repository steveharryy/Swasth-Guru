'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { getSocket } from '@/lib/socket';
import {
    createPeerConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    closePeerConnection
} from '@/utils/webrtc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getAppointmentTimeStatus, getApiUrl } from '@/lib/utils';

export default function VideoCallPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [appointment, setAppointment] = useState<any>(null);
    const [timeStatus, setTimeStatus] = useState<'early' | 'ready' | 'over' | 'loading'>('loading');

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const socket = getSocket();

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            router.push('/');
            return;
        }

        // Fetch appointment for window validation
        const fetchAppointment = async () => {
            let currentApt = null;

            // Try localStorage first for speed
            const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            currentApt = storedAppointments.find((apt: any) => apt.id === roomId);

            if (!currentApt) {
                try {
                    const apiUrl = getApiUrl();
                    const res = await fetch(`${apiUrl}/appointments/${roomId}`);
                    if (res.ok) {
                        currentApt = await res.json();
                        // Map keys if needed
                        currentApt = {
                            ...currentApt,
                            patientId: currentApt.patient_id || currentApt.patientId,
                            doctorId: currentApt.doctor_id || currentApt.doctorId
                        };
                    }
                } catch (error) {
                    console.error('Error fetching appointment from API:', error);
                }
            }

            if (!currentApt) {
                // If appointment not found even in API, we default to ready for testing
                // but real apps should handle this better
                setTimeStatus('ready');
                return;
            }

            setAppointment(currentApt);
            const status = getAppointmentTimeStatus(currentApt.date, currentApt.time);
            setTimeStatus(status);

            if (status === 'ready') {
                initCall();
            }
        };

        const initCall = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                createPeerConnection(stream, setRemoteStream, (candidate) => {
                    socket.emit('ice-candidate', { roomId, candidate });
                });

                if (user?.id) {
                    socket.emit('join-room', roomId, user.id);
                }
            } catch (err) {
                console.error('Error accessing media devices:', err);
                toast.error('Could not access camera/microphone');
            }
        };

        fetchAppointment();

        // Socket Event Listeners
        socket.on('user-connected', async (userId) => {
            console.log('Remote user connected:', userId);
            try {
                const offer = await createOffer();
                socket.emit('offer', { roomId, offer });
            } catch (err) {
                console.error('Error creating offer:', err);
            }
        });

        socket.on('offer', async (data: any) => {
            try {
                const offerData = data.offer || data.sdp;
                const answer = await handleOffer(offerData);
                socket.emit('answer', { roomId, answer });
            } catch (err) {
                console.error('Error handling offer:', err);
            }
        });

        socket.on('answer', async (data: any) => {
            try {
                const answerData = data.answer || data.sdp;
                await handleAnswer(answerData);
            } catch (err) {
                console.error('Error handling answer:', err);
            }
        });

        socket.on('ice-candidate', async (data: any) => {
            if (data.candidate) {
                await addIceCandidate(data.candidate);
            }
        });

        return () => {
            socket.off('user-connected');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            closePeerConnection();
            localStream?.getTracks().forEach(track => track.stop());
        };
    }, [roomId, user, isLoaded, socket]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => {
                track.enabled = !micOn;
            });
            setMicOn(!micOn);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => {
                track.enabled = !cameraOn;
            });
            setCameraOn(!cameraOn);
        }
    };

    const endCall = () => {
        router.back();
    };

    if (timeStatus === 'loading') {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    if (timeStatus === 'early') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center bg-gray-900 border-gray-800 text-white">
                    <CardHeader>
                        <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                        <CardTitle className="text-2xl">Too Early</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-400 mb-6">
                            This call is scheduled for {appointment?.time} on {appointment?.date}.
                            <br /><br />
                            You can join 10 minutes before the start time.
                        </p>
                        <Button onClick={() => router.back()} className="w-full">
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (timeStatus === 'over') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center bg-gray-900 border-gray-800 text-white">
                    <CardHeader>
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <CardTitle className="text-2xl">Session Expired</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-400 mb-6">
                            The window to join this consultation has closed.
                            <br /><br />
                            The join link expires 15 minutes after the scheduled start time.
                        </p>
                        <Button onClick={() => router.back()} variant="outline" className="w-full text-white border-gray-700 hover:bg-gray-800">
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">
            <div className="absolute top-4 left-4 z-10">
                <h1 className="text-white text-xl font-bold">Video Consultation</h1>
                <p className="text-gray-400 text-sm">Room ID: {roomId}</p>
            </div>

            <div className="flex-1 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                        You {micOn ? '' : '(Muted)'}
                    </div>
                </div>

                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                    {remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center flex-col text-gray-500">
                            <div className="w-16 h-16 border-4 border-t-primary border-gray-700 rounded-full animate-spin mb-4"></div>
                            Waiting for others to join...
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                        Remote User
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center space-x-4">
                <Button
                    variant={micOn ? 'secondary' : 'destructive'}
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={toggleMic}
                >
                    {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
                    onClick={endCall}
                >
                    <PhoneOff className="h-8 w-8 text-white" />
                </Button>

                <Button
                    variant={cameraOn ? 'secondary' : 'destructive'}
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={toggleCamera}
                >
                    {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
}
