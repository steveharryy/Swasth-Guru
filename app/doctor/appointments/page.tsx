'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  ArrowLeft, 
  Video, 
  Phone, 
  User, 
  Clock, 
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  type: 'video' | 'phone';
  status: 'upcoming' | 'completed' | 'cancelled' | 'in-progress';
  symptoms: string[];
  avatar?: string;
  duration?: number;
}

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isDoctor } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('today');

  useEffect(() => {
    if (!isAuthenticated || !isDoctor) {
      router.push('/');
    }
  }, [isAuthenticated, isDoctor, router]);

  // Mock appointments data
  const appointments: Appointment[] = [
    {
      id: '1',
      patientName: 'Rahul Singh',
      patientPhone: '+91 98765 43210',
      date: '2024-01-20',
      time: '10:00 AM',
      type: 'video',
      status: 'upcoming',
      symptoms: ['Fever', 'Cough', 'Headache'],
      avatar: '/avatars/patient-1.jpg',
      duration: 30
    },
    {
      id: '2',
      patientName: 'Priya Sharma',
      patientPhone: '+91 87654 32109',
      date: '2024-01-20',
      time: '11:30 AM',
      type: 'video',
      status: 'in-progress',
      symptoms: ['Headache', 'Nausea'],
      avatar: '/avatars/patient-2.jpg',
      duration: 30
    },
    {
      id: '3',
      patientName: 'Amit Kumar',
      patientPhone: '+91 76543 21098',
      date: '2024-01-20',
      time: '2:00 PM',
      type: 'phone',
      status: 'completed',
      symptoms: ['Back pain', 'Joint pain'],
      avatar: '/avatars/patient-3.jpg',
      duration: 25
    },
    {
      id: '4',
      patientName: 'Sunita Devi',
      patientPhone: '+91 65432 10987',
      date: '2024-01-21',
      time: '9:00 AM',
      type: 'video',
      status: 'upcoming',
      symptoms: ['Diabetes checkup'],
      avatar: '/avatars/patient-4.jpg',
      duration: 30
    },
    {
      id: '5',
      patientName: 'Ravi Patel',
      patientPhone: '+91 54321 09876',
      date: '2024-01-19',
      time: '3:30 PM',
      type: 'video',
      status: 'cancelled',
      symptoms: ['Skin rash'],
      avatar: '/avatars/patient-5.jpg',
      duration: 30
    }
  ];

  const filterAppointments = (status?: string, dateFilter?: string) => {
    let filtered = appointments;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(apt => 
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.symptoms.some(symptom => symptom.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by date
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(apt => apt.date === today);
        break;
      case 'tomorrow':
        filtered = filtered.filter(apt => apt.date === tomorrow);
        break;
      case 'upcoming':
        filtered = filtered.filter(apt => apt.date >= today && apt.status === 'upcoming');
        break;
      case 'completed':
        filtered = filtered.filter(apt => apt.status === 'completed');
        break;
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'in-progress': return 'destructive';
      case 'completed': return 'secondary';
      case 'cancelled': return 'outline';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress': return 'In Progress';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleJoinConsultation = (appointmentId: string) => {
    router.push(`/doctor/consultation/${appointmentId}`);
  };

  const handleViewPatient = (appointmentId: string) => {
    router.push(`/doctor/patients/${appointmentId}`);
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
              <h1 className="text-xl font-bold">Appointments</h1>
            </div>
            <Button variant="ghost" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {filterAppointments('', 'today').map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment}
                onJoin={handleJoinConsultation}
                onView={handleViewPatient}
              />
            ))}
            {filterAppointments('', 'today').length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No appointments scheduled for today</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {filterAppointments('', 'upcoming').map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment}
                onJoin={handleJoinConsultation}
                onView={handleViewPatient}
              />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterAppointments('', 'completed').map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment}
                onJoin={handleJoinConsultation}
                onView={handleViewPatient}
              />
            ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {filterAppointments().map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment}
                onJoin={handleJoinConsultation}
                onView={handleViewPatient}
              />
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AppointmentCard({ 
  appointment, 
  onJoin, 
  onView 
}: { 
  appointment: Appointment;
  onJoin: (id: string) => void;
  onView: (id: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'in-progress': return 'destructive';
      case 'completed': return 'secondary';
      case 'cancelled': return 'outline';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress': return 'In Progress';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Avatar>
              <AvatarImage src={appointment.avatar} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium truncate">{appointment.patientName}</h3>
                <Badge variant={getStatusColor(appointment.status)}>
                  {getStatusText(appointment.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{appointment.patientPhone}</p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(appointment.date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {appointment.time}
                </div>
                <div className="flex items-center">
                  {appointment.type === 'video' ? (
                    <Video className="w-4 h-4 mr-1" />
                  ) : (
                    <Phone className="w-4 h-4 mr-1" />
                  )}
                  {appointment.type === 'video' ? 'Video Call' : 'Phone Call'}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {appointment.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2 ml-4">
            {appointment.status === 'upcoming' && (
              <Button size="sm" onClick={() => onJoin(appointment.id)}>
                <Video className="w-4 h-4 mr-1" />
                Join
              </Button>
            )}
            {appointment.status === 'in-progress' && (
              <Button size="sm" variant="destructive" onClick={() => onJoin(appointment.id)}>
                <Video className="w-4 h-4 mr-1" />
                Resume
              </Button>
            )}
            {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
              <Button size="sm" variant="outline" onClick={() => onView(appointment.id)}>
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}