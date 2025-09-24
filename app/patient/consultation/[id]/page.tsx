'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useNotification } from '@/contexts/notification-context';
import { startCamera, stopCamera, toggleAudio, toggleVideo, requestCameraPermission } from '@/lib/camera-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ThemeToggle } from '@/components/theme-toggle';
 import {  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  User, 
  Send,
  Clock,
  Stethoscope,
  MessageCircle,
  Camera,
  Upload,
  AlertCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  message: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

export default function PatientConsultationPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isDoctor } = useAuth();
  const { showNotification } = useNotification();
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      router.push('/');
    }
  }, [isAuthenticated, isDoctor, router]);

  // Initialize camera when component mounts
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          setCameraError('Camera permission denied. Please allow camera access to join the consultation.');
          return;
        }

        const videoElement = document.getElementById('patient-video') as HTMLVideoElement;
        if (videoElement) {
          const stream = await startCamera(videoElement);
          setMediaStream(stream);
        }
      } catch (error) {
        setCameraError('Unable to access camera. Please check your camera settings.');
        console.error('Camera initialization error:', error);
      }
    };

    initializeCamera();

    // Cleanup on unmount
    return () => {
      if (mediaStream) {
        stopCamera(mediaStream);
      }
    };
  }, []);

  // Mock appointment data - in real app, fetch by ID
  const appointment = {
    id: params.id,
    doctorName: 'Dr. Priya Sharma',
    doctorSpecialization: 'General Physician',
    patientName: user?.name || 'Patient',
    date: '2024-01-20',
    time: '10:00 AM',
    symptoms: ['Fever', 'Cough', 'Headache'],
    avatar: '/avatars/doctor-1.jpg',
    consultationFee: 11
  };

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

  // Mock chat messages
  useEffect(() => {
    setChatMessages([
      {
        id: '1',
        sender: 'doctor',
        message: 'Hello! I can see you\'re experiencing fever and cough. How long have you been having these symptoms?',
        timestamp: new Date(Date.now() - 300000),
        type: 'text'
      },
      {
        id: '2',
        sender: 'patient',
        message: 'It started about 3 days ago. The fever comes and goes.',
        timestamp: new Date(Date.now() - 240000),
        type: 'text'
      },
      {
        id: '3',
        sender: 'doctor',
        message: 'I see. Any difficulty in breathing or chest pain?',
        timestamp: new Date(Date.now() - 180000),
        type: 'text'
      }
    ]);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    setIsCallActive(true);
    if (mediaStream) {
      toggleVideo(mediaStream, isVideoOn);
      toggleAudio(mediaStream, isMicOn);
    }
    showNotification('Consultation started', 'success');
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallDuration(0);
    if (mediaStream) {
      stopCamera(mediaStream);
      setMediaStream(null);
    }
    showNotification('Consultation ended', 'info');
    router.push('/patient/appointments');
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

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'patient',
        message: chatMessage,
        timestamp: new Date(),
        type: 'text'
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
      
      // Simulate doctor response after 2 seconds
      setTimeout(() => {
        const doctorResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'doctor',
          message: 'Thank you for the information. I\'ll review this and provide my recommendations.',
          timestamp: new Date(),
          type: 'text'
        };
        setChatMessages(prev => [...prev, doctorResponse]);
      }, 2000);
    }
  };

  if (!isAuthenticated || !user || isDoctor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold">Consultation</h1>
              {isCallActive && (
                <Badge variant="destructive" className="animate-pulse">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(callDuration)}
                </Badge>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant={showChat ? "default" : "outline"}
                size="sm"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <ThemeToggle />
              <Button 
                variant="destructive" 
                onClick={handleEndCall}
                disabled={!isCallActive}
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Call
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Call Section */}
          <div className={`${showChat ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
            {/* Video Area */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {/* Doctor Video */}
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    {isCallActive ? (
                      <div className="text-center text-white">
                        <Avatar className="w-24 h-24 mx-auto mb-4">
                          <AvatarImage src={appointment.avatar} />
                          <AvatarFallback>
                            <Stethoscope className="w-12 h-12" />
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-lg font-medium">{appointment.doctorName}</p>
                        <p className="text-sm opacity-80">Connected</p>
                      </div>
                    ) : (
                      <div className="text-center text-white">
                        <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Waiting for doctor to join</p>
                      </div>
                    )}
                  </div>

                  {/* Patient Video (Picture-in-Picture) */}
                  <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white">
                    <video
                      id="patient-video"
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    {cameraError && (
                      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>

                  {/* Controls Overlay */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    {!isCallActive ? (
                      <Button onClick={handleStartCall} size="lg" className="rounded-full">
                        <Video className="w-5 h-5 mr-2" />
                        Join Call
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant={isVideoOn ? "secondary" : "destructive"}
                          size="icon"
                          className="rounded-full"
                          onClick={handleToggleVideo}
                        >
                          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </Button>
                        <Button
                          variant={isMicOn ? "secondary" : "destructive"}
                          size="icon"
                          className="rounded-full"
                          onClick={handleToggleMic}
                        >
                          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                        >
                          <Camera className="w-5 h-5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Doctor</p>
                    <p className="font-medium">{appointment.doctorName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.doctorSpecialization}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">{appointment.time}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Symptoms</p>
                  <div className="flex flex-wrap gap-1">
                    {appointment.symptoms.map((symptom, index) => (
                      <Badge key={index} variant="outline">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consultation Fee</p>
                  <p className="text-lg font-bold text-primary">₹{appointment.consultationFee}</p>
                </div>
              </CardContent>
            </Card>

            {/* Camera Error Alert */}
            {cameraError && (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <p className="text-sm text-orange-800 dark:text-orange-200">{cameraError}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat Section */}
          {showChat && (
            <div className="space-y-4">
              <Card className="h-96">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Chat with Doctor</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-full">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.sender === 'patient'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button size="icon" onClick={handleSendMessage}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <Button variant="outline" size="sm">
                        <Camera className="w-4 h-4 mr-1" />
                        Photo
                      </Button>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-1" />
                        File
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
