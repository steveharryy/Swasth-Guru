'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useNotification } from '@/contexts/notification-context';
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
  Upload,
  User,
  Calendar,
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { getAppointmentTimeStatus, cn } from '@/lib/utils';

import {
  createPeerConnection,
  createOffer,
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

  const isCallActiveRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);

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

    // Load real appointment data
    const loadAppointment = async () => {
      let currentApt = null;
      const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      currentApt = storedAppointments.find((apt: any) => apt.id === appointmentId);

      if (!currentApt) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
          const res = await fetch(`${apiUrl}/appointments/${appointmentId}`);
          if (res.ok) {
            const data = await res.json();
            // Map snake_case from Supabase to camelCase
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
    };

    loadAppointment();
  }, [isAuthenticated, isDoctor, router, isLoaded, appointmentId]);

  // Separate Socket signaling logic
  useEffect(() => {
    if (!socket || !appointmentId) return;

    // Socket listeners
    socket.on('user-connected', async (userId: string) => {
      console.log('User connected to room:', userId);
      if (isCallActiveRef.current) {
        try {
          const offer = await createOffer();
          socket.emit('offer', { roomId: appointmentId, offer });
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
      console.log('Received chat message from doctor:', data);
      setChatMessages(prev => [...prev, data.message]);
    });

    // Auto-join room for chat availability on mount
    socket.emit('join-room', appointmentId, user?.id);

    socket.on('call-ended', () => {
      console.log('Call ended by remote user');
      showNotification('Consultation ended by doctor', 'info');
      
      // Local cleanup
      setIsCallActive(false);
      setCallDuration(0);
      closePeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setLocalStream(null);
      setRemoteStream(null);
      
      router.push('/patient/appointments');
    });


    return () => {
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('chat-message');
      
      // Cleanup peer connection only on unmount
      closePeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket, appointmentId]);

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

  // Timer effect for call duration
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);

      createPeerConnection(stream, setRemoteStream, (candidate) => {
        socket.emit('ice-candidate', { roomId: appointmentId, candidate });
      });

      socket.emit('start-video-session', appointmentId);
      setIsCallActive(true);
      showNotification('Waiting for doctor to join...', 'info');
    } catch (err) {
      console.error('Error starting call:', err);
      showNotification('Could not access camera/mic', 'error');
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
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
      await fetch(`${apiUrl}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      console.log('Appointment marked as completed');
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
      
      // Emit to socket
      socket.emit('chat-message', { roomId: appointmentId, message: newMessage });
      
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
    }
  };

  if (!isLoaded || !isAuthenticated || !user || isDoctor || !appointment) {
    return <div className="p-8">Loading consultation details...</div>;
  }

  if (timeStatus === 'early') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>Too Early to Join</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Your consultation with <strong>{appointment.doctorName}</strong> is scheduled for <strong>{appointment.time}</strong> on <strong>{appointment.date}</strong>.
              <br /><br />
              You can join up to 10 minutes before the scheduled time.
            </p>
            <Button onClick={() => router.push('/patient/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (timeStatus === 'over') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Appointment Window Over</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              The join window for your consultation with <strong>{appointment.doctorName}</strong> has expired.
              <br /><br />
              Consultations can be joined up to 15 minutes after the scheduled start time.
            </p>
            <Button onClick={() => router.push('/patient/dashboard')} variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold logo-text tracking-tight">परामर्श (Consultation)</h1>
              {isCallActive && (
                <Badge variant="destructive" className="h-8 px-4 rounded-full text-sm font-bold animate-pulse shadow-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatDuration(callDuration)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showChat ? "default" : "outline"}
                className="h-9 px-4 text-sm font-bold rounded-xl"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <ThemeToggle />
              <Button
                variant="destructive"
                className="h-9 px-4 text-sm font-bold rounded-xl shadow-sm disabled:opacity-30"
                onClick={handleEndCall}
                disabled={!isCallActive}
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End visit
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={cn("space-y-6 transition-all duration-500", showChat ? "lg:col-span-8" : "lg:col-span-12")}>
            {/* Video Area */}
            <Card className="border shadow-2xl rounded-2xl overflow-hidden bg-muted aspect-video relative group">
              <div className="w-full h-full bg-black relative">
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/50 flex-col space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Video className="w-8 h-8" />
                    </div>
                    <p className="text-xl font-bold tracking-tight">
                      {isCallActive ? 'Connecting to doctor...' : 'Ready to join consultation'}
                    </p>
                  </div>
                )}
              </div>

              {/* Local PiP */}
              <div className="absolute bottom-6 right-6 w-32 h-24 rounded-xl overflow-hidden border-2 border-white shadow-xl bg-black transition-all group-hover:scale-105">
                <video
                  ref={localVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
              </div>

              {/* Floating Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                {!isCallActive ? (
                  <Button
                    onClick={startCall}
                    className="h-11 px-8 text-lg font-bold rounded-xl bg-primary text-black shadow-xl hover:scale-105 transition-all"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Join Visit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={isVideoOn ? "secondary" : "destructive"}
                      className={cn(
                        "h-10 w-10 rounded-lg transition-all",
                        isVideoOn ? "bg-white text-slate-800" : "bg-red-500 text-white"
                      )}
                      onClick={handleToggleVideo}
                    >
                      {isVideoOn ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant={isMicOn ? "secondary" : "destructive"}
                      className={cn(
                        "h-10 w-10 rounded-lg transition-all",
                        isMicOn ? "bg-white text-slate-800" : "bg-red-500 text-white"
                      )}
                      onClick={handleToggleMic}
                    >
                      {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Details Card */}
            <Card className="border shadow-none rounded-2xl p-6 bg-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border rounded-xl">
                    <AvatarImage src={appointment.avatar} />
                    <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground">
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Doctor</p>
                    <p className="text-xl font-bold text-foreground mb-0.5">{appointment.doctorName}</p>
                    <p className="text-sm font-semibold text-primary italic">{appointment.doctorSpecialization}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-xl border">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <p className="text-sm font-bold text-foreground">
                        {appointment.date === 'hackathon' ? 'Demo Mode' : new Date(appointment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <p className="text-sm font-bold text-foreground">{appointment.time}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">Current Symptoms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(appointment.symptoms || []).length > 0 ? (
                        appointment.symptoms.map((symptom: string, index: number) => (
                          <Badge key={index} variant="secondary" className="px-3 py-0.5 text-[10px] font-bold rounded-lg border">
                            {symptom}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm font-bold text-muted-foreground italic">No symptoms recorded</p>
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
              <Card className="h-full border shadow-none rounded-2xl bg-card flex flex-col overflow-hidden">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-lg font-bold text-foreground">Chat with Doctor</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col flex-1">
                  <ScrollArea className="flex-1 px-4 py-4">
                    <div className="space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageCircle className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-sm font-medium text-muted-foreground/50">Start conversation...</p>
                        </div>
                      ) : (
                        chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={cn("flex", message.sender === 'patient' ? "justify-end" : "justify-start")}
                          >
                            <div className={cn(
                              "max-w-[85%] p-3 rounded-xl shadow-sm",
                              message.sender === 'patient'
                                ? "bg-primary text-black rounded-tr-none"
                                : "bg-muted text-foreground rounded-tl-none border"
                            )}>
                              <p className="text-sm font-medium leading-relaxed">{message.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t bg-muted/20">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="h-10 px-4 text-sm font-medium rounded-xl border bg-background shadow-none focus:bg-background transition-all"
                      />
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        className="h-10 w-10 rounded-xl bg-primary text-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                      >
                        <Send className="w-4 h-4" />
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

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
