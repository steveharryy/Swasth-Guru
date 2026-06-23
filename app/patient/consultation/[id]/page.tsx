'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useNotification } from '@/contexts/notification-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Clock,
  MessageCircle,
  Camera,
  User,
  Calendar,
  Paperclip,
  Download,
  Loader2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { getAppointmentTimeStatus, cn, getApiUrl } from '@/lib/utils';

import {
  createPeerConnection,
  handleOffer,
  handleAnswer,
  addIceCandidate,
  closePeerConnection
} from '@/utils/webrtc';

export default function PatientConsultationPage() {
  const router = useRouter();
  const params = useParams();
  const socket = getSocket();
  const appointmentId = params.id as string;
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const { showNotification } = useNotification();
  const { language, t } = useLanguage();

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [timeStatus, setTimeStatus] = useState<'early' | 'ready' | 'over'>('early');
  const [connectionStatus, setConnectionStatus] = useState<string>('new');

  const isCallActiveRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [isSendingFile, setIsSendingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Button loading states
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const [isEndLoading, setIsEndLoading] = useState(false);
  const [isReconnectLoading, setIsReconnectLoading] = useState(false);

  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      if (isLoaded) router.push('/');
      return;
    }

    const initCamera = async () => {
      setIsJoinLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        createPeerConnection(stream, setRemoteStream, (candidate) => {
          socket.emit('ice-candidate', { roomId: appointmentId, candidate });
        }, (state) => {
          setConnectionStatus(state);
          if (state === 'failed' || state === 'disconnected') {
            showNotification('Disconnected / संपर्क टूटा', 'warning');
          }
        });
        setIsCallActive(true);
      } catch (err) {
        console.error('Error auto-starting camera:', err);
        showNotification('Camera access denied / कैमरा अनुमति नहीं मिली', 'error');
      } finally {
        setIsJoinLoading(false);
      }
    };

    // Load real appointment data
    const loadAppointment = async () => {
      let currentApt = null;
      const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      currentApt = storedAppointments.find((apt: any) => apt.id === appointmentId);

      if (!currentApt) {
        try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/appointments/${appointmentId}`);
          if (res.ok) {
            const data = await res.json();
            currentApt = {
              ...data,
              patientId: data.patient_id,
              doctorId: data.doctor_id,
              patientName: data.patient_name || 'Patient',
              doctorName: data.doctor_name,
              doctorSpecialization: data.doctor_specialization
            };
          }
        } catch (error) {
          console.error('Error fetching appointment from API:', error);
        }
      }

      if (!currentApt) {
        showNotification('Appointment not found', 'error');
        router.push('/patient/appointments');
        return;
      }

      setAppointment(currentApt);
      const status = getAppointmentTimeStatus(currentApt.date, currentApt.time);
      setTimeStatus(status);

      // Auto-start camera for demo
      if (!localStreamRef.current) {
        initCamera();
      }
    };

    loadAppointment();
  }, [isAuthenticated, isDoctor, router, isLoaded, appointmentId]);

  // Separate Socket signaling logic
  useEffect(() => {
    if (!socket || !appointmentId) return;

    const handleReconnect = () => {
      console.log('Socket reconnected, joining room...');
      socket.emit('join-room', { roomId: appointmentId, userId: user?.id, role: 'patient' });
    };

    socket.on('user-connected', (userId: string) => {
      console.log('User connected to room:', userId);
    });

    socket.on('offer', async (data: any) => {
      try {
        const offerData = data.offer || data.sdp || data;
        const answer = await handleOffer(offerData);
        socket.emit('answer', { roomId: appointmentId, answer });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    socket.on('answer', async (data: any) => {
      try {
        const answerData = data.answer || data.sdp || data;
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

    socket.on('chat-message', (data: any) => {
      setChatMessages(prev => [...prev, data.message]);
    });

    socket.emit('join-room', { roomId: appointmentId, userId: user?.id, role: 'patient' });
    socket.on('connect', handleReconnect);

    const handleCallEnded = () => {
      showNotification('Call ended / कॉल समाप्त', 'info');
      
      setIsCallActive(false);
      setCallDuration(0);
      closePeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setLocalStream(null);
      setRemoteStream(null);
      router.push('/patient/appointments');
    };

    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('chat-message');
      socket.off('connect', handleReconnect);
      socket.off('call-ended', handleCallEnded);
      
      closePeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket, appointmentId, user]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const startCall = async () => {
    if (localStream) return;
    setIsJoinLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      createPeerConnection(stream, setRemoteStream, (candidate) => {
        socket.emit('ice-candidate', { roomId: appointmentId, candidate });
      }, (state) => {
        setConnectionStatus(state);
        if (state === 'failed' || state === 'disconnected') {
          showNotification('Disconnected / संपर्क टूटा', 'warning');
        }
      });
      setIsCallActive(true);
    } catch (err) {
      console.error('Error starting call:', err);
      showNotification('Camera access denied / कैमरा अनुमति नहीं मिली', 'error');
    } finally {
      setIsJoinLoading(false);
    }
  };

  const handleReconnectCall = async () => {
    if (!localStream) return;
    setIsReconnectLoading(true);
    showNotification('Reconnecting video call / कॉल फिर जोड़ रहे हैं...', 'info');
    try {
      createPeerConnection(localStream, setRemoteStream, (candidate) => {
        socket.emit('ice-candidate', { roomId: appointmentId, candidate });
      }, (state) => setConnectionStatus(state));
      socket.emit('join-room', { roomId: appointmentId, userId: user?.id, role: 'patient' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsReconnectLoading(false);
    }
  };

  const handleToggleVideo = () => {
    if (!localStream) return;
    const newState = !isVideoOn;
    localStream.getVideoTracks().forEach(track => track.enabled = newState);
    setIsVideoOn(newState);
  };

  const handleToggleMic = () => {
    if (!localStream) return;
    const newState = !isMicOn;
    localStream.getAudioTracks().forEach(track => track.enabled = newState);
    setIsMicOn(newState);
  };

  const handleEndCall = async () => {
    setIsEndLoading(true);
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
    } catch (error) {
      console.error('Error marking appointment as completed:', error);
    }

    socket.emit('call-ended', { roomId: appointmentId });
    setIsCallActive(false);
    setCallDuration(0);
    closePeerConnection();
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setIsEndLoading(false);
    router.push('/patient/appointments');
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        sender: 'patient',
        message: chatMessage,
        timestamp: new Date(),
      };
      socket.emit('chat-message', { roomId: appointmentId, message: newMessage });
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showNotification("File is too large. Maximum allowed size is 5MB.", "error");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsSendingFile(true);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        
        const newMessage = {
          id: Date.now().toString(),
          sender: 'patient',
          message: `Sent a file: ${file.name}`,
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data
          },
          timestamp: new Date(),
        };

        socket.emit('chat-message', { roomId: appointmentId, message: newMessage });
        setChatMessages(prev => [...prev, newMessage]);
        setIsSendingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      
      reader.onerror = () => {
        showNotification("Failed to read file.", "error");
        setIsSendingFile(false);
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error("Error sending file:", error);
      showNotification("Failed to send file.", "error");
      setIsSendingFile(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isLoaded || !isAuthenticated || !user || isDoctor || !appointment) {
    return <div className="p-8 font-black text-xl text-center">Loading consultation details... / विवरण लोड हो रहा है...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Swasth Guru Logo" className="h-16 w-auto object-contain" />
              <h1 className="text-xl font-black logo-text tracking-tight hidden md:block">Consultation / डॉक्टर से परामर्श</h1>
              {isCallActive && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="h-8 px-4 rounded-full text-sm font-bold animate-pulse shadow-sm bg-red-600 text-white border-transparent">
                    <Clock className="w-4 h-4 mr-2" />
                    {formatDuration(callDuration)}
                  </Badge>
                  <Badge
                    className={cn(
                      "h-8 px-4 rounded-full text-xs font-black border",
                      connectionStatus === 'connected' || connectionStatus === 'completed'
                        ? "bg-green-500 text-white border-transparent"
                        : "bg-orange-500 text-white border-transparent"
                    )}
                  >
                    {connectionStatus === 'connected' || connectionStatus === 'completed'
                      ? '● Live / चालू है'
                      : '⚡ Connecting / जुड़ रहा है'}
                  </Badge>
                  {(connectionStatus === 'failed' || connectionStatus === 'disconnected') && (
                    <Button
                      onClick={handleReconnectCall}
                      loading={isReconnectLoading}
                      variant="outline"
                      className="h-8 px-3 text-xs font-bold rounded-lg border-red-500 text-red-500 hover:bg-red-50/10"
                    >
                      Reconnect / फिर जोड़ें
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                variant={showChat ? "default" : "outline"}
                className="h-12 px-5 text-sm font-black rounded-xl"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat / चैट
              </Button>
              <ThemeToggle />
              <Button
                variant="destructive"
                className="h-12 px-5 text-sm font-black rounded-xl shadow-sm disabled:opacity-30 flex items-center"
                onClick={handleEndCall}
                disabled={!isCallActive}
                loading={isEndLoading}
              >
                <PhoneOff className="w-5 h-5 mr-2 text-white" />
                End Call / कॉल समाप्त
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={cn("space-y-6 transition-all duration-500", showChat ? "lg:col-span-8" : "lg:col-span-12")}>
            {/* Video Area */}
            <Card className="border shadow-2xl rounded-3xl overflow-hidden bg-muted aspect-video relative group">
              <div className="w-full h-full bg-black relative">
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover animate-in fade-in duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/60 flex-col space-y-4">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                      <Video className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <p className="text-xl font-black text-center px-4">
                      {isCallActive 
                        ? 'Connecting to Doctor... / डॉक्टर से जुड़ रहे हैं...' 
                        : 'Call status: Ready / कॉल के लिए तैयार'}
                    </p>
                  </div>
                )}
              </div>

              {/* Local PiP */}
              {localStream && (
                <div className="absolute bottom-6 right-6 w-36 h-28 rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-black transition-all group-hover:scale-105">
                  <video
                    ref={localVideoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                </div>
              )}

              {/* Floating Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 bg-black/55 backdrop-blur-xl rounded-2xl border border-white/10 opacity-100 transition-all">
                {!isCallActive ? (
                  <Button
                    onClick={startCall}
                    loading={isJoinLoading}
                    className="h-14 px-8 text-base font-black rounded-xl bg-primary text-white shadow-xl hover:scale-105 transition-all"
                  >
                    <Video className="w-6 h-6 mr-2 shrink-0 text-white" />
                    Join Call / कॉल से जुड़ें
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={isVideoOn ? "secondary" : "destructive"}
                      className={cn(
                        "h-12 w-12 rounded-xl transition-all flex items-center justify-center",
                        isVideoOn ? "bg-white text-slate-800" : "bg-red-600 text-white"
                      )}
                      onClick={handleToggleVideo}
                    >
                      {isVideoOn ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant={isMicOn ? "secondary" : "destructive"}
                      className={cn(
                        "h-12 w-12 rounded-xl transition-all flex items-center justify-center",
                        isMicOn ? "bg-white text-slate-800" : "bg-red-600 text-white"
                      )}
                      onClick={handleToggleMic}
                    >
                      {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Details Card */}
            <Card className="border shadow-none rounded-3xl p-6 bg-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border rounded-2xl">
                    <AvatarImage src={appointment.avatar} />
                    <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground">
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Doctor / डॉक्टर
                    </p>
                    <p className="text-xl font-bold text-foreground mb-0.5">{appointment.doctorName}</p>
                    <p className="text-sm font-semibold text-primary italic">{appointment.doctorSpecialization}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-muted rounded-xl border">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <p className="text-sm font-bold text-foreground">
                        {appointment.date === 'hackathon' ? 'Demo Mode / डेमो मोड' : new Date(appointment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <p className="text-sm font-bold text-foreground">{appointment.time}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">Symptoms / लक्षण</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(appointment.symptoms || []).length > 0 ? (
                        appointment.symptoms.map((symptom: string, index: number) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1 text-xs font-bold rounded-lg border">
                            {symptom}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm font-bold text-muted-foreground italic">No symptoms / कोई लक्षण नहीं</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div className="lg:col-span-4 h-full min-h-[500px] animate-in slide-in-from-right-4 duration-300">
              <Card className="h-full border shadow-none rounded-3xl bg-card flex flex-col overflow-hidden">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-base font-black text-foreground">Doctor Chat / बातचीत</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col flex-1">
                  <ScrollArea className="flex-1 px-4 py-4 h-[350px]">
                    <div className="space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-12">
                           <MessageCircle className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-sm font-bold text-muted-foreground/50">Start typing to talk / यहाँ से बातचीत शुरू करें</p>
                        </div>
                      ) : (
                        chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={cn("flex", message.sender === 'patient' ? "justify-end" : "justify-start")}
                          >
                            <div className={cn(
                                "max-w-[85%] p-3 rounded-xl shadow-sm text-sm font-bold",
                                message.sender === 'patient'
                                  ? "bg-primary text-white rounded-tr-none"
                                  : "bg-muted text-foreground rounded-tl-none border"
                            )}>
                              {message.file ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    {message.file.type.startsWith('image/') ? (
                                      <ImageIcon className="h-4 w-4 flex-shrink-0 text-current" />
                                    ) : (
                                      <FileText className="h-4 w-4 flex-shrink-0 text-current" />
                                    )}
                                    <span className="font-semibold truncate max-w-[150px] text-xs">{message.file.name}</span>
                                  </div>
                                  <div className="text-[10px] opacity-80">
                                    {(message.file.size / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                  {message.file.type.startsWith('image/') && message.file.data && (
                                    <div className="relative max-h-32 rounded overflow-hidden mt-1 border border-white/10 bg-black/25">
                                      <img src={message.file.data} alt={message.file.name} className="max-h-32 w-full object-contain" />
                                    </div>
                                  )}
                                  <a
                                    href={message.file.data}
                                    download={message.file.name}
                                    className="mt-2 text-xs flex items-center justify-center gap-1 bg-black/20 hover:bg-black/45 py-1.5 px-3 rounded font-medium border border-white/5 transition-all text-white cursor-pointer"
                                  >
                                    <Download className="h-3.5 w-3.5" /> Download
                                  </a>
                                </div>
                              ) : (
                                <p className="leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t bg-muted/20">
                    <div className="flex gap-2 items-center">
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
                        className="h-12 w-12 rounded-xl border bg-background hover:bg-muted/80 flex-shrink-0 flex items-center justify-center text-muted-foreground"
                      >
                        {isSendingFile ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <Paperclip className="h-5 w-5" />
                        )}
                      </Button>
                      <Input
                        placeholder="Write message / यहाँ लिखें..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="h-12 px-4 text-sm font-semibold rounded-xl border bg-background shadow-none focus:bg-background transition-all flex-1 min-w-0"
                      />
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim() && !isSendingFile}
                        className="h-12 w-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all shrink-0"
                      >
                        <Send className="w-5 h-5 text-white" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
