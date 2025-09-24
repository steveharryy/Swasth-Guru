'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
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
  const { user, isAuthenticated, isDoctor } = useAuth();
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/doctor/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">My Patients</h1>
            </div>
            <Button variant="ghost" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients or conditions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All ({patients.length})
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Active ({patients.filter(p => p.status === 'active').length})
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('inactive')}
            >
              Inactive ({patients.filter(p => p.status === 'inactive').length})
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
              <Card key={patient.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Avatar>
                        <AvatarImage src={patient.avatar} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium truncate">{patient.name}</h3>
                          <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                            {patient.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <span>Age: {patient.age}</span>
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {patient.phone}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                          </div>
                          <span>Total visits: {patient.totalVisits}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {patient.conditions.map((condition, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        size="sm" 
                        onClick={() => handleViewPatient(patient.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
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
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{patients.length}</div>
              <div className="text-sm text-muted-foreground">Total Patients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">
                {patients.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active Patients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">
                {Math.round(patients.reduce((sum, p) => sum + p.totalVisits, 0) / patients.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Visits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {patients.filter(p => {
                  const lastVisit = new Date(p.lastVisit);
                  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                  return lastVisit >= thirtyDaysAgo;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Recent Visits</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}