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
import { PhoneOff, Mic, MicOff, Video, VideoOff, Clock, AlertCircle, MessageSquare, Send, Paperclip, X, FileText, Image as ImageIcon, Download, Loader2, FolderOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

    const [messages, setMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSendingFile, setIsSendingFile] = useState(false);
    const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
    const [isRecordsListOpen, setIsRecordsListOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const isChatOpenRef = useRef(false);
    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
    }, [isChatOpen]);

    const scrollToChatBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isChatOpen) {
            scrollToChatBottom();
        }
    }, [messages, isChatOpen]);

    useEffect(() => {
        if (!user || user.unsafeMetadata?.role === 'doctor') return;

        const fetchPatientRecords = async () => {
            try {
                const apiUrl = getApiUrl();
                const res = await fetch(`${apiUrl}/records/${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setMedicalRecords(data);
                }
            } catch (err) {
                console.error('Error fetching patient records:', err);
            }
        };

        fetchPatientRecords();
    }, [user]);

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
                    const role = user.unsafeMetadata?.role === 'doctor' ? 'doctor' : 'patient';
                    socket.emit('join-room', { roomId, userId: user.id, role });
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

        socket.on('user-reconnected', async (data: any) => {
            const userId = typeof data === 'object' ? data.userId : data;
            console.log('Remote user reconnected:', userId);
            try {
                const offer = await createOffer();
                socket.emit('offer', { roomId, offer });
            } catch (err) {
                console.error('Error creating offer on reconnect:', err);
            }
        });

        socket.on('chat-message', (msg: any) => {
            console.log('Received chat message:', msg);
            setMessages((prev) => [...prev, msg]);
            if (!isChatOpenRef.current) {
                setUnreadCount((c) => c + 1);
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
            socket.off('user-reconnected');
            socket.off('chat-message');
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

    const handleSendMedicalRecord = (record: any) => {
        const messageObj = {
            roomId,
            senderId: user?.id,
            senderName: user?.fullName || 'User',
            senderRole: user?.unsafeMetadata?.role === 'doctor' ? 'doctor' : 'patient',
            text: `Sent a medical record: ${record.title}`,
            file: {
                name: record.file_name || record.title,
                type: record.file_name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                size: 1024 * 1024 * 1.5,
                data: record.file_url
            },
            timestamp: Date.now()
        };

        socket.emit('chat-message', messageObj);
        setMessages((prev) => [...prev, messageObj]);
    };

    const handleSend = () => {
        if (!chatInput.trim()) return;

        const messageObj = {
            roomId,
            senderId: user?.id,
            senderName: user?.fullName || 'User',
            senderRole: user?.unsafeMetadata?.role === 'doctor' ? 'doctor' : 'patient',
            text: chatInput.trim(),
            timestamp: Date.now()
        };

        socket.emit('chat-message', messageObj);
        setMessages((prev) => [...prev, messageObj]);
        setChatInput('');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSizeBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            toast.error("File is too large. Maximum allowed size is 5MB.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsSendingFile(true);

        try {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Data = reader.result as string;
                
                const messageObj = {
                    roomId,
                    senderId: user?.id,
                    senderName: user?.fullName || 'User',
                    senderRole: user?.unsafeMetadata?.role === 'doctor' ? 'doctor' : 'patient',
                    text: `Sent a file: ${file.name}`,
                    file: {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: base64Data
                    },
                    timestamp: Date.now()
                };

                socket.emit('chat-message', messageObj);
                setMessages((prev) => [...prev, messageObj]);
                setIsSendingFile(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            
            reader.onerror = () => {
                toast.error("Failed to read file.");
                setIsSendingFile(false);
            };

            reader.readAsDataURL(file);

        } catch (error) {
            console.error("Error sending file:", error);
            toast.error("Failed to send file.");
            setIsSendingFile(false);
        }
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
        <div className="min-h-screen bg-black flex flex-col text-white relative h-screen overflow-hidden">
            {/* Top Header */}
            <div className="px-6 py-4 border-b border-gray-850 flex justify-between items-center bg-gray-950/80 backdrop-blur z-20">
                <div className="flex items-center space-x-3">
                    <img src="/logo.png" alt="Swasth Guru Logo" className="h-16 w-auto object-contain" />
                    <div>
                        <h1 className="text-white text-lg font-bold flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse animate-duration-1000"></span>
                            Video Consultation
                        </h1>
                        <p className="text-gray-400 text-xs mt-0.5">Room ID: {roomId}</p>
                    </div>
                </div>
                
                <Button
                    variant="outline"
                    onClick={() => {
                        setIsChatOpen(!isChatOpen);
                        setUnreadCount(0);
                    }}
                    className="relative bg-gray-900 border-gray-800 hover:bg-gray-800 text-white hover:text-white transition-all flex items-center gap-2"
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold border-2 border-black animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Video Streams */}
                <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto min-h-0 bg-gradient-to-b from-gray-950 to-black">
                    <div className="flex-1 flex items-center justify-center w-full">
                        <div className={`w-full max-w-5xl grid grid-cols-1 ${remoteStream ? 'md:grid-cols-2' : 'max-w-xl'} gap-6 items-center justify-center`}>
                            {/* Local video */}
                            <div className="relative aspect-video bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800 shadow-xl backdrop-blur-sm">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-white text-xs font-medium border border-white/5">
                                    You {micOn ? '' : '(Muted)'}
                                </div>
                            </div>

                            {/* Remote video */}
                            <div className="relative aspect-video bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800 shadow-xl backdrop-blur-sm">
                                {remoteStream ? (
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center flex-col text-gray-500">
                                        <div className="w-12 h-12 border-4 border-t-primary border-gray-800 rounded-full animate-spin mb-4"></div>
                                        <p className="text-sm">Waiting for others to join...</p>
                                    </div>
                                )}
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-white text-xs font-medium border border-white/5">
                                    Remote Participant
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="mt-6 flex items-center justify-center space-x-6 z-10">
                        <Button
                            variant={micOn ? 'secondary' : 'destructive'}
                            size="icon"
                            className="rounded-full w-12 h-12 transition-all hover:scale-105"
                            onClick={toggleMic}
                        >
                            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                        </Button>

                        <Button
                            variant="destructive"
                            size="icon"
                            className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 transition-all hover:scale-105"
                            onClick={endCall}
                        >
                            <PhoneOff className="h-6 w-6 text-white" />
                        </Button>

                        <Button
                            variant={cameraOn ? 'secondary' : 'destructive'}
                            size="icon"
                            className="rounded-full w-12 h-12 transition-all hover:scale-105"
                            onClick={toggleCamera}
                        >
                            {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Chat Panel Sidebar */}
                {isChatOpen && (
                    <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-gray-850 flex flex-col bg-gray-950/90 backdrop-blur h-[450px] md:h-full z-10 shadow-2xl transition-all">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-850 flex justify-between items-center bg-gray-900/50">
                            <span className="font-semibold text-sm tracking-wide">Consultation Chat</span>
                            <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-8 w-8 text-gray-400 hover:text-white rounded-full hover:bg-gray-800">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm gap-2">
                                    <MessageSquare className="h-8 w-8 opacity-20" />
                                    <p className="text-gray-450">No messages yet in this session.</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={msg.id || msg.messageId || idx} className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}>
                                        <div className="text-[10px] text-gray-400 mb-1 px-1 flex gap-1 items-center">
                                            <span className="font-semibold">
                                                {msg.senderId === user?.id ? 'You' : (msg.senderRole === 'doctor' ? 'Doctor' : 'Patient')}
                                            </span>
                                            <span className="text-[8px] opacity-60">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm shadow-md ${
                                            msg.senderId === user?.id 
                                                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                                : 'bg-gray-855 text-white rounded-tl-none border border-gray-800'
                                        }`}>
                                            {msg.file ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {msg.file.type.startsWith('image/') ? (
                                                            <ImageIcon className="h-4 w-4 flex-shrink-0 text-white/80" />
                                                        ) : (
                                                            <FileText className="h-4 w-4 flex-shrink-0 text-white/80" />
                                                        )}
                                                        <span className="font-medium truncate max-w-[150px] text-xs">{msg.file.name}</span>
                                                    </div>
                                                    <div className="text-[9px] opacity-80">
                                                        {(msg.file.size / 1024 / 1024).toFixed(2)} MB
                                                    </div>
                                                    {msg.file.type.startsWith('image/') && msg.file.data && (
                                                        <div className="relative max-h-32 rounded overflow-hidden mt-1 border border-white/10 bg-black/25">
                                                            <img src={msg.file.data} alt={msg.file.name} className="max-h-32 w-full object-contain" />
                                                        </div>
                                                    )}
                                                    <a
                                                        href={msg.file.data}
                                                        download={msg.file.name}
                                                        className="mt-2 text-xs flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 py-2 px-3 rounded-lg font-medium border border-white/5 transition-colors cursor-pointer text-white"
                                                    >
                                                        <Download className="h-3 w-3" /> Download
                                                    </a>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-gray-855 bg-gray-900/40">
                            <form 
                                onSubmit={(e) => { 
                                    e.preventDefault(); 
                                    handleSend(); 
                                }} 
                                className="flex gap-2 items-center"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={isSendingFile}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-10 w-10 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 flex-shrink-0"
                                    title="Upload from Device"
                                >
                                    {isSendingFile ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    ) : (
                                        <Paperclip className="h-4 w-4" />
                                    )}
                                </Button>

                                {user?.unsafeMetadata?.role !== 'doctor' && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsRecordsListOpen(true)}
                                        className="h-10 w-10 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 flex-shrink-0"
                                        title="Attach from Medical Records"
                                    >
                                        <FolderOpen className="h-4 w-4" />
                                    </Button>
                                )}
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-white placeholder-gray-500 min-w-0"
                                />
                                <Button 
                                    type="submit" 
                                    size="icon" 
                                    className="h-10 w-10 rounded-xl flex-shrink-0" 
                                    disabled={!chatInput.trim() && !isSendingFile}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            {/* Medical Records Dialog */}
            <Dialog open={isRecordsListOpen} onOpenChange={setIsRecordsListOpen}>
                <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center text-white">
                            <FileText className="w-5 h-5 mr-2 text-primary" />
                            Select from Medical Records
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Choose a file from your saved medical records to send to the consultation chat.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-60 overflow-y-auto space-y-2 mt-4 pr-1">
                        {medicalRecords.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 text-sm">
                                No medical records found.
                            </div>
                        ) : (
                            medicalRecords.map((record: any) => (
                                <div
                                    key={record.id}
                                    onClick={() => {
                                        handleSendMedicalRecord(record);
                                        setIsRecordsListOpen(false);
                                        toast.success(`Sent record: ${record.title}`);
                                    }}
                                    className="p-3 bg-gray-950 hover:bg-gray-800 border border-gray-800 hover:border-primary/55 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                                        <div className="text-left min-w-0">
                                            <p className="font-extrabold text-sm text-gray-100 truncate">{record.title}</p>
                                            <p className="text-xs text-gray-550 capitalize">{record.category} • {new Date(record.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="ghost" onClick={() => setIsRecordsListOpen(false)} className="rounded-xl text-gray-400 hover:text-white hover:bg-gray-800">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
