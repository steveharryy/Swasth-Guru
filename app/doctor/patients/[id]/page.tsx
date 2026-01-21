'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ThemeToggle } from '@/components/theme-toggle';
  import {ArrowLeft, 
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
  const { user, isAuthenticated, isDoctor } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !isDoctor) {
      router.push('/');
    }
  }, [isAuthenticated, isDoctor, router]);

  // Mock patient data
  const patient = {
    id: params.id,
    name: 'Rahul Singh',
    age: 32,
    gender: 'Male',
    phone: '+91 98765 43210',
    email: 'rahul.singh@email.com',
    address: 'Village Rampur, District Nabha, Punjab 147201',
    bloodGroup: 'O+',
    height: '175 cm',
    weight: '70 kg',
    avatar: '/avatars/patient-1.jpg',
    registrationDate: '2023-06-15',
    lastVisit: '2024-01-20',
    totalVisits: 5,
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin', 'Shellfish'],
    currentMedications: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
      { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily' }
    ],
    vitalSigns: {
      bloodPressure: '130/85 mmHg',
      heartRate: '72 bpm',
      temperature: '98.6°F',
      oxygenSaturation: '98%',
      lastUpdated: '2024-01-20'
    }
  };

  const medicalRecords: PatientRecord[] = [
    {
      id: '1',
      date: '2024-01-20',
      type: 'consultation',
      title: 'Regular Checkup',
      description: 'Patient reported feeling well. Blood pressure slightly elevated. Adjusted medication dosage.',
      doctor: 'Dr. Priya Sharma',
      attachments: ['prescription-20240120.pdf']
    },
    {
      id: '2',
      date: '2024-01-15',
      type: 'lab-report',
      title: 'Blood Test Results',
      description: 'HbA1c: 7.2%, Fasting glucose: 140 mg/dL, Cholesterol: 180 mg/dL',
      doctor: 'Lab Technician',
      attachments: ['lab-report-20240115.pdf']
    },
    {
      id: '3',
      date: '2024-01-10',
      type: 'prescription',
      title: 'Medication Adjustment',
      description: 'Increased Metformin dosage due to elevated glucose levels.',
      doctor: 'Dr. Priya Sharma',
      attachments: ['prescription-20240110.pdf']
    },
    {
      id: '4',
      date: '2023-12-20',
      type: 'follow-up',
      title: 'Diabetes Follow-up',
      description: 'Patient showing good compliance with medication. Weight stable.',
      doctor: 'Dr. Priya Sharma'
    }
  ];

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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/doctor/patients')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Patient Details</h1>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button size="sm">
                <Video className="w-4 h-4 mr-2" />
                Start Consultation
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-6xl">
        {/* Patient Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={patient.avatar} />
                <AvatarFallback>
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">{patient.name}</h2>
                  <Badge variant="secondary">Patient ID: {patient.id}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Age</p>
                    <p className="font-medium">{patient.age} years</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-medium">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Blood Group</p>
                    <p className="font-medium">{patient.bloodGroup}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Visits</p>
                    <p className="font-medium">{patient.totalVisits}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {patient.phone}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Medical Records</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{patient.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{patient.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Date</p>
                    <p className="font-medium">{new Date(patient.registrationDate).toLocaleDateString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Height</p>
                      <p className="font-medium">{patient.height}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-medium">{patient.weight}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle>Medical Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Current Conditions</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.conditions.map((condition, index) => (
                        <Badge key={index} variant="outline">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Allergies</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive">
                          {allergy}
                        </Badge>
                      ))}
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
                {patient.currentMedications.map((medication, index) => (
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
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Latest Vital Signs
                  <Badge variant="outline">
                    {new Date(patient.vitalSigns.lastUpdated).toLocaleDateString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Heart className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">Blood Pressure</p>
                    <p className="text-lg font-bold">{patient.vitalSigns.bloodPressure}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Activity className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">Heart Rate</p>
                    <p className="text-lg font-bold">{patient.vitalSigns.heartRate}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Activity className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="text-lg font-bold">{patient.vitalSigns.temperature}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Activity className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">Oxygen Saturation</p>
                    <p className="text-lg font-bold">{patient.vitalSigns.oxygenSaturation}</p>
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