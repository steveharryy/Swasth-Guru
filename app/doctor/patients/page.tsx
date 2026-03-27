'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

import { ThemeToggle } from '@/components/theme-toggle';
import {
  ArrowLeft,
  Search,
  User,
  Phone,
  Calendar,
  FileText,
  Filter,
  Eye
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  lastVisit: string;
  totalVisits: number;
  conditions: string[];
  avatar?: string;
  status: 'active' | 'inactive';
}

export default function DoctorPatientsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (!isAuthenticated || !isDoctor) {
      router.push('/');
    }
  }, [isAuthenticated, isDoctor, router]);

  // Mock patients data
  const patients: Patient[] = [
    {
      id: '1',
      name: 'Rahul Singh',
      age: 32,
      phone: '+91 98765 43210',
      lastVisit: '2024-01-20',
      totalVisits: 5,
      conditions: ['Hypertension', 'Diabetes'],
      avatar: '/avatars/patient-1.jpg',
      status: 'active'
    },
    {
      id: '2',
      name: 'Priya Sharma',
      age: 28,
      phone: '+91 87654 32109',
      lastVisit: '2024-01-18',
      totalVisits: 3,
      conditions: ['Migraine'],
      avatar: '/avatars/patient-2.jpg',
      status: 'active'
    },
    {
      id: '3',
      name: 'Amit Kumar',
      age: 45,
      phone: '+91 76543 21098',
      lastVisit: '2024-01-15',
      totalVisits: 8,
      conditions: ['Back pain', 'Arthritis'],
      avatar: '/avatars/patient-3.jpg',
      status: 'active'
    },
    {
      id: '4',
      name: 'Sunita Devi',
      age: 55,
      phone: '+91 65432 10987',
      lastVisit: '2024-01-10',
      totalVisits: 12,
      conditions: ['Diabetes', 'High cholesterol'],
      avatar: '/avatars/patient-4.jpg',
      status: 'active'
    },
    {
      id: '5',
      name: 'Ravi Patel',
      age: 38,
      phone: '+91 54321 09876',
      lastVisit: '2023-12-20',
      totalVisits: 2,
      conditions: ['Skin allergy'],
      avatar: '/avatars/patient-5.jpg',
      status: 'inactive'
    }
  ];

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchQuery === '' ||
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.conditions.some(condition =>
        condition.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleViewPatient = (patientId: string) => {
    router.push(`/doctor/patients/${patientId}`);
  };

  if (!isAuthenticated || !user || !isDoctor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => router.push('/doctor/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">My Patients</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-4xl">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients or conditions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border rounded-xl bg-muted/20 shadow-none focus-visible:ring-1"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className="h-8 text-[11px] font-bold rounded-lg px-3"
            >
              ALL ({patients.length})
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('active')}
              className="h-8 text-[11px] font-bold rounded-lg px-3"
            >
              ACTIVE ({patients.filter(p => p.status === 'active').length})
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('inactive')}
              className="h-8 text-[11px] font-bold rounded-lg px-3"
            >
              INACTIVE ({patients.filter(p => p.status === 'inactive').length})
            </Button>
          </div>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {filteredPatients.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No patients found</p>
              </CardContent>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id} className="cursor-pointer shadow-none border bg-card hover:bg-muted/5 transition-colors overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 p-0.5">
                      <AvatarImage src={patient.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <h3 className="font-bold text-foreground truncate">{patient.name}</h3>
                        <Badge variant={patient.status === 'active' ? 'default' : 'secondary'} className="text-[10px] font-bold h-5 px-2 w-fit">
                          {patient.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                        <div className="flex items-center">
                          <User className="w-3.5 h-3.5 mr-1.5 text-primary" />
                          Age: {patient.age}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3.5 h-3.5 mr-1.5 text-primary" />
                          {patient.phone}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary" />
                          Last: {new Date(patient.lastVisit).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-3.5 h-3.5 mr-1.5 text-primary" />
                          Visits: {patient.totalVisits}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {patient.conditions.map((condition, index) => (
                          <Badge key={index} variant="secondary" className="text-[9px] font-bold bg-muted/50 border-none px-2 h-4">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => handleViewPatient(patient.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card className="shadow-none border bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-primary">{patients.length}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Patients</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-secondary">
                {patients.filter(p => p.status === 'active').length}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-accent">
                {Math.round(patients.reduce((sum, p) => sum + p.totalVisits, 0) / patients.length)}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Visits</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-green-600">
                {patients.filter(p => {
                  const lastVisit = new Date(p.lastVisit);
                  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                  return lastVisit >= thirtyDaysAgo;
                }).length}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent (30d)</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}