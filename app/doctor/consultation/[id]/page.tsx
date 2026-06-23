"use client";

import { getSocket } from "@/lib/socket";
import {
  createPeerConnection,
  createOffer,
  handleOffer,
  handleAnswer,
  addIceCandidate,
  closePeerConnection
} from "@/utils/webrtc";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useNotification } from '@/contexts/notification-context';
import { useLanguage } from '@/contexts/language-context';
import { startCamera, stopCamera, toggleAudio, toggleVideo, requestCameraPermission } from '@/lib/camera-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from "lucide-react";

import { ThemeToggle } from '@/components/theme-toggle';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  User,
  FileText,
  Camera,
  Upload,
  Send,
  Clock,
  Stethoscope,
  MessageCircle,
  Paperclip,
  Download,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAppointmentTimeStatus, cn, getApiUrl } from '@/lib/utils';

export default function DoctorConsultationPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const isLoading = !isLoaded;

  const { showNotification } = useNotification();
  const { language, t } = useLanguage();

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [timeStatus, setTimeStatus] = useState<'early' | 'ready' | 'over'>('early');
  const [connectionStatus, setConnectionStatus] = useState<string>('new');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const isCallActiveRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isSendingFile, setIsSendingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Button loading states
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const [isReconnectLoading, setIsReconnectLoading] = useState(false);
  const [isEndLoading, setIsEndLoading] = useState(false);
  const [isSaveNotesLoading, setIsSaveNotesLoading] = useState(false);
  const [isPrescriptionLoading, setIsPrescriptionLoading] = useState(false);

  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  const socket = getSocket();
  const appointmentId = params.id as string;

  useEffect(() => {
    if (!isAuthenticated || !isDoctor) {
      if (isLoaded) router.replace('/doctor/dashboard');
      return;
    }

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
        router.replace('/doctor/dashboard');
        return;
      }

      setAppointment(currentApt);
      const status = getAppointmentTimeStatus(currentApt.date, currentApt.time);
      setTimeStatus(status);

      // Auto-start camera for demo
      if (!mediaStreamRef.current) {
        initializeCamera();
      }
    };

    const initializeCamera = async () => {
      if (mediaStreamRef.current) return;
      setIsJoinLoading(true);
      try {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          setCameraError(t('camera_denied'));
          return;
        }

        if (!localVideoRef.current) return;

        const stream = await startCamera(localVideoRef.current);
        setMediaStream(stream);
        
        createPeerConnection(stream, setRemoteStream, (candidate) => {
          socket.emit('ice-candidate', { roomId: appointmentId, candidate });
        }, (state) => {
          setConnectionStatus(state);
          if (state === 'failed' || state === 'disconnected') {
            showNotification('Disconnected / संपर्क टूटा', 'warning');
          }
        });
        setIsCallActive(true);
      } catch (error) {
        setCameraError(t('camera_error'));
        console.error('Camera initialization error:', error);
      } finally {
        setIsJoinLoading(false);
      }
    };

    loadAppointment();
  }, [isAuthenticated, isDoctor, router, isLoaded, appointmentId]);

  // Separate Socket signaling logic
  useEffect(() => {
    if (!socket || !appointmentId) return;

    const handleReconnect = () => {
      console.log('Socket reconnected, joining room...');
      socket.emit('join-room', { roomId: appointmentId, userId: user?.id, role: 'doctor' });
    };

    socket.on('user-connected', async (userId: string) => {
      console.log('Remote user connected:', userId);
      if (isCallActiveRef.current) {
        try {
          const offer = await createOffer();
          socket.emit("offer", { roomId: appointmentId, offer });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      }
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

    socket.emit('join-room', { roomId: appointmentId, userId: user?.id, role: 'doctor' });
    socket.on('connect', handleReconnect);

    const autoOfferTimer = setTimeout(async () => {
      if (isCallActiveRef.current) {
        try {
          const offer = await createOffer();
          socket.emit('offer', { roomId: appointmentId, offer });
        } catch (err) {
          console.log('Delayed offer skipped:', err);
        }
      }
    }, 3000);

    const handleCallEnded = () => {
      showNotification('Call ended / कॉल समाप्त', 'info');
      
      setIsCallActive(false);
      setCallDuration(0);
      closePeerConnection();
      if (mediaStreamRef.current) {
        stopCamera(mediaStreamRef.current);
      }
      setMediaStream(null);
      setRemoteStream(null);
      router.push('/doctor/appointments');
    };

    socket.on('call-ended', handleCallEnded);

    return () => {
      clearTimeout(autoOfferTimer);
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('chat-message');
      socket.off('connect', handleReconnect);
      socket.off('call-ended', handleCallEnded);
      
      closePeerConnection();
      if (mediaStreamRef.current) {
        stopCamera(mediaStreamRef.current);
      }
    };
  }, [socket, appointmentId, user]);

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    if (!mediaStream) return;
    setIsJoinLoading(true);
    try {
      createPeerConnection(mediaStream, setRemoteStream, (candidate) => {
        socket.emit('ice-candidate', { roomId: appointmentId, candidate });
      }, (state) => {
        setConnectionStatus(state);
        if (state === 'failed' || state === 'disconnected') {
          showNotification('Disconnected / संपर्क टूटा', 'warning');
        }
      });

      socket.emit('start-video-session', appointmentId);
      setIsCallActive(true);
      showNotification('Connecting / जुड़ रहा है...', 'info');
    } catch (err) {
      console.error('Error initializing call:', err);
      showNotification('Camera error / कैमरा समस्या', 'error');
    } finally {
      setIsJoinLoading(false);
    }
  };

  const handleReconnectCall = async () => {
    if (!mediaStream) return;
    setIsReconnectLoading(true);
    showNotification('Reconnecting video call / कॉल फिर जोड़ रहे हैं...', 'info');
    try {
      createPeerConnection(mediaStream, setRemoteStream, (candidate) => {
        socket.emit('ice-candidate', { roomId: appointmentId, candidate });
      }, (state) => setConnectionStatus(state));
      socket.emit('join-room', { roomId: appointmentId, userId: user?.id, role: 'doctor' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsReconnectLoading(false);
    }
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
    if (mediaStream) {
      stopCamera(mediaStream);
      setMediaStream(null);
    }
    setRemoteStream(null);
    setIsEndLoading(false);
    showNotification('Consultation ended / परामर्श समाप्त', 'info');
    router.push('/doctor/appointments');
  };

  const handleToggleVideo = () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    if (mediaStream) {
      toggleVideo(mediaStream, newVideoState);
    }
  };

  const handleToggleMic = () => {
    const newMicState = !isMicOn;
    setIsMicOn(newMicState);
    if (mediaStream) {
      toggleAudio(mediaStream, newMicState);
    }
  };

  const handleSubmitPrescription = () => {
    if (prescription.trim()) {
      setIsPrescriptionLoading(true);
      setTimeout(() => {
        showNotification('Prescription sent / दवा पर्ची भेजी गई', 'success');
        setPrescription('');
        setIsPrescriptionLoading(false);
      }, 1000);
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        sender: 'doctor',
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
          sender: 'doctor',
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

  const handleSaveNotes = () => {
    if (consultationNotes.trim()) {
      setIsSaveNotesLoading(true);
      setTimeout(() => {
        showNotification('Notes saved / नोट्स सहेजे गए', 'success');
        setIsSaveNotesLoading(false);
      }, 1000);
    }
  };

  if (isLoading || !appointment) return <div className="p-8 font-black text-xl text-center">Loading details... / विवरण लोड हो रहा है...</div>;
  if (!isAuthenticated || !isDoctor) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Swasth Guru Logo" className="h-16 w-auto object-contain" />
              <h1 className="text-xl font-black logo-text tracking-tight hidden md:block">Consultation / डॉक्टर परामर्श</h1>
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
                  <div className="flex items-center justify-center h-full text-white/50 flex-col space-y-4">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                      <Video className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <p className="text-xl font-black text-center px-4">
                      {isCallActive ? 'Connecting to Patient... / मरीज से जुड़ रहे हैं...' : 'Ready / तैयार'}
                    </p>
                  </div>
                )}
              </div>

              {/* Local PiP */}
              <div className="absolute bottom-6 right-6 w-36 h-28 rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-black transition-all group-hover:scale-105">
                <video
                  ref={localVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
              </div>

              {/* Floating Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 bg-black/55 backdrop-blur-xl rounded-2xl border border-white/10 opacity-100 transition-all">
                {!isCallActive ? (
                  <Button
                    onClick={handleStartCall}
                    loading={isJoinLoading}
                    className="h-14 px-8 text-base font-black rounded-xl bg-primary text-white shadow-xl hover:scale-105 transition-all"
                  >
                    <Video className="w-6 h-6 mr-2 shrink-0 text-white" />
                    Start Call / कॉल शुरू करें
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

            {/* Consultation Notes */}
            <Card className="border shadow-none rounded-3xl p-6 bg-card">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-lg font-black text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  Consultation Notes / परामर्श नोट्स
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 space-y-4">
                <Textarea
                  placeholder="Write your consultation notes here... / यहाँ मरीज के परामर्श नोट्स लिखें..."
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  className="min-h-[150px] p-4 text-base font-medium rounded-xl border bg-muted/30 focus:bg-muted/50 transition-all resize-none"
                />
                <Button
                  onClick={handleSaveNotes}
                  disabled={!consultationNotes.trim()}
                  loading={isSaveNotesLoading}
                  className="h-12 px-6 text-sm font-black rounded-xl bg-primary text-white shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Save Notes / नोट्स सहेजें
                </Button>
              </CardContent>
            </Card>

            {cameraError && (
              <Card className="border-4 border-white bg-orange-50/50 shadow-xl rounded-[2rem] p-6">
                <div className="flex items-center gap-4 text-orange-600">
                  <AlertCircle className="w-8 h-8" />
                  <p className="text-lg font-black">{cameraError}</p>
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Patient Details */}
            <Card className="border shadow-none rounded-3xl p-6 bg-card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-3xl -mr-6 -mt-6" />
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Patient Details / मरीज की जानकारी
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border rounded-xl shadow-sm">
                    <AvatarImage src={appointment.avatar} />
                    <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">
                      {appointment.patientName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-bold text-foreground mb-0.5">{appointment.patientName}</p>
                    <p className="text-sm font-medium text-muted-foreground">{appointment.patientPhone}</p>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-xl border space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Status</p>
                    <Badge variant="secondary" className="px-3 py-0.5 text-xs font-bold rounded-full border">
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Date</p>
                    <p className="text-sm font-bold text-foreground">
                      {appointment.date === 'hackathon' ? 'Demo Mode' : new Date(appointment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Time</p>
                    <p className="text-sm font-bold text-foreground">{appointment.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Symptoms */}
            <Card className="border shadow-none rounded-3xl p-6 bg-card">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-sm font-black text-foreground">Symptoms / लक्षण</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 flex flex-wrap gap-2">
                {(appointment.symptoms || []).length > 0 ? (
                  appointment.symptoms.map((symptom: string, index: number) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 text-xs font-bold rounded-lg border">
                      {symptom}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm font-bold text-muted-foreground italic">No symptoms / कोई लक्षण नहीं</p>
                )}
              </CardContent>
            </Card>

            {/* Prescription */}
            <Card className="border shadow-2xl rounded-3xl p-6 bg-slate-900 text-white dark:bg-card">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-primary" />
                  </div>
                  Prescription / दवा पर्ची
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 space-y-4">
                <Textarea
                  placeholder="Write medicines and advice... / दवाइयों के नाम और सलाह यहाँ लिखें..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  className="min-h-[120px] p-4 text-base font-medium rounded-xl border border-white/10 bg-white/5 focus:border-primary/40 transition-all resize-none text-white placeholder:text-white/20"
                />
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleSubmitPrescription}
                    disabled={!prescription.trim()}
                    loading={isPrescriptionLoading}
                    className="h-12 text-sm font-black rounded-xl bg-primary text-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Send Prescription / पर्ची भेजें
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 bg-white/5 border-white/10 text-white/60 text-xs font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Report / रिपोर्ट अपलोड करें
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div className="lg:col-span-4 h-full min-h-[500px] animate-in slide-in-from-right-4 duration-300">
              <Card className="h-full border shadow-none rounded-3xl bg-card flex flex-col overflow-hidden">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-base font-black text-foreground">Patient Chat / मरीज से बातचीत</CardTitle>
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
                            className={cn("flex", message.sender === 'doctor' ? "justify-end" : "justify-start")}
                          >
                            <div className={cn(
                              "max-w-[85%] p-3 rounded-xl shadow-sm text-sm font-bold",
                              message.sender === 'doctor'
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatMessage(e.target.value)}
                        onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSendMessage()}
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
