'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ThemeToggle } from '@/components/theme-toggle';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  FileText,
  Pill,
  Activity,
  Heart,
  Download,
  Edit,
  Video,
  MessageCircle
} from 'lucide-react';

interface PatientRecord {
  id: string;
  date: string;
  type: 'consultation' | 'prescription' | 'lab-report' | 'follow-up';
  title: string;
  description: string;
  doctor: string;
  attachments?: string[];
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';

  useEffect(() => {
    if (!isAuthenticated || !isDoctor) {
      router.push('/');
    }
  }, [isAuthenticated, isDoctor, router]);

  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !isDoctor || !params.id) return;

    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';

        // Fetch patient profile
        const res = await fetch(`${apiUrl}/users/patient/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        }

        // Fetch patient appointments
        const aptRes = await fetch(`${apiUrl}/appointments/patient/${params.id}`);
        if (aptRes.ok) {
          const aptData = await aptRes.json();
          setAppointments(aptData);
        }
      } catch (err) {
        console.error("Error fetching patient details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [isAuthenticated, isDoctor, params.id]);

  if (!isAuthenticated || !user || !isDoctor) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Patient not found</h2>
        <Button onClick={() => router.push('/doctor/patients')}>Back to Patients</Button>
      </div>
    );
  }

  const medicalRecords = appointments.map(apt => ({
    id: apt.id,
    date: apt.date,
    type: apt.status === 'completed' ? 'consultation' : 'follow-up',
    title: apt.status === 'completed' ? 'Completed Consultation' : 'Scheduled Visit',
    description: Array.isArray(apt.symptoms) ? apt.symptoms.join(', ') : (apt.symptoms || 'General Visit'),
    doctor: apt.doctor_name || 'Dr. Ashna',
    attachments: []
  }));

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <Video className="w-4 h-4" />;
      case 'prescription': return <Pill className="w-4 h-4" />;
      case 'lab-report': return <Activity className="w-4 h-4" />;
      case 'follow-up': return <MessageCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getRecordColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-primary/10 text-primary';
      case 'prescription': return 'bg-secondary/10 text-secondary';
      case 'lab-report': return 'bg-accent/10 text-accent';
      case 'follow-up': return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!isAuthenticated || !user || !isDoctor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push('/doctor/patients')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-bold">Patient Details</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
              <Button size="sm" className="h-8 text-xs">
                <Video className="w-3.5 h-3.5 mr-1.5" />
                Start Consultation
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-6xl">
        {/* Patient Header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
                <AvatarImage src={patient.avatar} />
                <AvatarFallback>
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold">{patient.name}</h2>
                  <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0 h-5">ID: {patient.id}</Badge>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground">Age</p>
                    <p className="font-bold">{patient.age}y</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-bold">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Blood</p>
                    <p className="font-bold text-red-500">{patient.bloodGroup}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Visits</p>
                    <p className="font-bold">{patient.totalVisits}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-3 text-[11px] text-muted-foreground font-medium">
                  <div className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-primary" />
                    {patient.phone}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-primary" />
                    Joined: {new Date(patient.created_at || new Date()).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-9 p-1">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="records" className="text-xs">Records</TabsTrigger>
            <TabsTrigger value="medications" className="text-xs">Meds</TabsTrigger>
            <TabsTrigger value="vitals" className="text-xs">Vitals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-sm">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{patient.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Address</p>
                    <p className="text-sm font-medium leading-tight">{patient.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Height</p>
                      <p className="text-sm font-medium">{patient.height}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Weight</p>
                      <p className="text-sm font-medium">{patient.weight}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Conditions */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-sm">Medical Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Conditions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.conditions && Array.isArray(patient.conditions) ? (
                        patient.conditions.map((condition: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-[10px] font-bold">
                            {condition}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No records</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Allergies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.allergies && Array.isArray(patient.allergies) ? (
                        patient.allergies.map((allergy: string, index: number) => (
                          <Badge key={index} variant="destructive" className="text-[10px] font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-none border-none">
                            {allergy}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No known allergies</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            {medicalRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${getRecordColor(record.type)}`}>
                        {getRecordIcon(record.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium">{record.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{record.description}</p>
                        <p className="text-xs text-muted-foreground">By: {record.doctor}</p>
                        {record.attachments && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {record.attachments.map((attachment, index) => (
                              <Button key={index} variant="outline" size="sm">
                                <Download className="w-3 h-3 mr-1" />
                                {attachment}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="medications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Medications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.current_medications && Array.isArray(patient.current_medications) ? (
                  patient.current_medications.map((medication: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{medication.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {medication.dosage} • {medication.frequency}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No current medications listed</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  Latest Vital Signs
                  <span className="text-[10px] font-bold text-muted-foreground">
                    AS OF {new Date(patient.vitalSigns.lastUpdated).toLocaleDateString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 border rounded-xl bg-muted/20">
                    <div className="w-9 h-9 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Heart className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Blood Pressure</p>
                    <p className="text-sm font-black">{patient.vitalSigns.bloodPressure}</p>
                  </div>
                  <div className="text-center p-3 border rounded-xl bg-muted/20">
                    <div className="w-9 h-9 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Activity className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Heart Rate</p>
                    <p className="text-sm font-black">{patient.vitalSigns.heartRate}</p>
                  </div>
                  <div className="text-center p-3 border rounded-xl bg-muted/20">
                    <div className="w-9 h-9 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Activity className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Temperature</p>
                    <p className="text-sm font-black">{patient.vitalSigns.temperature}</p>
                  </div>
                  <div className="text-center p-3 border rounded-xl bg-muted/20">
                    <div className="w-9 h-9 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Activity className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Oxygen (SpO2)</p>
                    <p className="text-sm font-black">{patient.vitalSigns.oxygenSaturation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
