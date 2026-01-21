'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useNotification } from '@/contexts/notification-context';
import { startCamera, stopCamera, toggleAudio, toggleVideo, requestCameraPermission } from '@/lib/camera-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from "lucide-react";

import { ThemeToggle } from '@/components/theme-toggle';
import { Input } from '@/components/ui/input';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  User,
  FileText,
  Camera,
  Upload,
  Send,
  Clock,
  Stethoscope
} from 'lucide-react';

export default function DoctorConsultationPage() {
  const router = useRouter();
  const params = useParams();
 const { user, isAuthenticated, isDoctor, isLoading } = useAuth();

  const { showNotification } = useNotification();

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);


  const appointmentId = params.id as string;

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current?.postMessage({
          type: 'ice',
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerRef.current = pc;
    return pc;
  };

useEffect(() => {
  const initializeCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setCameraError(
          'Camera permission denied. Please allow camera access to start the consultation.'
        );
        return;
      }

      if (!localVideoRef.current) return;

      const stream = await startCamera(localVideoRef.current);
      setMediaStream(stream);

      const pc = createPeerConnection();

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    } catch (error) {
      setCameraError(
        'Unable to access camera. Please check your camera settings.'
      );
      console.error('Camera initialization error:', error);
    }
  };

  initializeCamera();

  return () => {
    if (mediaStream) {
      stopCamera(mediaStream);
    }
  };
}, []);

  // Mock patient data
  const patient = {
    id: params.id,
    name: 'Rahul Singh',
    age: 32,
    phone: '+91 98765 43210',
    symptoms: ['Fever', 'Cough', 'Headache'],
    medicalHistory: ['Hypertension', 'Diabetes'],
    currentMedications: ['Metformin 500mg', 'Lisinopril 10mg'],
    avatar: '/avatars/patient-1.jpg',
    appointmentTime: '10:00 AM',
    appointmentType: 'Video Consultation'
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
  useEffect(() => {
    channelRef.current = new BroadcastChannel(`consultation-${appointmentId}`);

    channelRef.current.onmessage = async (event) => {
      const pc = peerRef.current;
      if (!pc) return;

      const data = event.data;

      if (data.type === 'offer') {
        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channelRef.current?.postMessage({
          type: 'answer',
          answer
        });
      }

      if (data.type === 'answer') {
        await pc.setRemoteDescription(data.answer);
      }

      if (data.type === 'ice') {
        await pc.addIceCandidate(data.candidate);
      }
    };

    return () => {
      channelRef.current?.close();
    };
  }, [appointmentId]);


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    if (!mediaStream) return;

    const pc = peerRef.current ?? createPeerConnection();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    channelRef.current?.postMessage({
      type: 'offer',
      offer
    });

    setIsCallActive(true);
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
      showNotification('Prescription submitted successfully', 'success');
      setPrescription('');
    }
  };

  const handleSaveNotes = () => {
    if (consultationNotes.trim()) {
      showNotification('Notes saved successfully', 'success');
    }
  };

 

if (isLoading) {
  return <div className="p-8">Checking authentication…</div>;
}

if (!isAuthenticated || !isDoctor) {
  router.replace('/doctor/dashboard');
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
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Call Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Area */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {/* Patient Video */}
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    {isCallActive ? (
                      <div className="text-center text-white">
                        <Avatar className="w-24 h-24 mx-auto mb-4">
                          <AvatarImage src={patient.avatar} />
                          <AvatarFallback>
                            <User className="w-12 h-12" />
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-lg font-medium">{patient.name}</p>
                        <p className="text-sm opacity-80">Connected</p>
                      </div>
                    ) : (
                      <div className="text-center text-white">
                        <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Waiting to start consultation</p>
                      </div>
                    )}
                  </div>

                  {/* Doctor Video (Picture-in-Picture) */}
                  <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white">


                    {/* REMOTE VIDEO (PATIENT) */}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* LOCAL VIDEO (DOCTOR PIP) */}
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="absolute bottom-4 right-4 w-32 h-24 object-cover border-2 border-white rounded"
                    />



                    {cameraError && (
                      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                        <Avatar className="w-8 h-8">
                         <AvatarImage src={user?.avatar} />

                          <AvatarFallback>
                            <Stethoscope className="w-4 h-4" />
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
                        Start Call
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
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consultation Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Consultation Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Write your consultation notes here..."
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  rows={6}
                />
                <Button onClick={handleSaveNotes} disabled={!consultationNotes.trim()}>
                  Save Notes
                </Button>
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
            <ThemeToggle />

            {/* Prescription */}
            <Card>
              <CardHeader>
                <CardTitle>Write Prescription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Write prescription details..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows={4}
                />
                <div className="flex space-x-2">
                  <Button onClick={handleSubmitPrescription} disabled={!prescription.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Prescription
                  </Button>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Information Sidebar */}
          <div className="space-y-6">
            {/* Patient Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Patient Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={patient.avatar} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">Age: {patient.age}</p>
                    <p className="text-sm text-muted-foreground">{patient.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Appointment Details:</p>
                  <p className="text-sm text-muted-foreground">{patient.appointmentType}</p>
                  <p className="text-sm text-muted-foreground">{patient.appointmentTime}</p>
                </div>
              </CardContent>
            </Card>

            {/* Current Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle>Current Symptoms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {patient.symptoms.map((symptom, index) => (
                    <Badge key={index} variant="outline">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patient.medicalHistory.map((condition, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      {condition}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Medications */}
            <Card>
              <CardHeader>
                <CardTitle>Current Medications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patient.currentMedications.map((medication, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      {medication}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  View History
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}