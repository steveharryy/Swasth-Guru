'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Search,
  Video,
  Phone,
  User,
  Clock,
  Calendar,
  Filter,
  Plus,
  Stethoscope,
  MessageCircle,
  CreditCard
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  doctorId?: number;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  type: 'video' | 'phone';
  status: 'upcoming' | 'completed' | 'cancelled' | 'confirmed' | 'pending';
  symptoms?: string[];
  avatar?: string;
  consultationFee?: number;
  paymentStatus?: 'pending' | 'completed' | 'failed';
}

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isDoctor } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      router.push('/');
    } else {
      const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const userAppointments = storedAppointments.filter((apt: Appointment) =>
        apt.patientId === user?.id
      );
      setAppointments(userAppointments);
    }
  }, [isAuthenticated, isDoctor, router, user]);

  const filterAppointments = (status?: string) => {
    let filtered = appointments;

    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctorSpecialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (apt.symptoms && apt.symptoms.some(symptom =>
          symptom.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    const today = new Date().toISOString().split('T')[0];

    switch (status) {
      case 'upcoming':
        filtered = filtered.filter(apt =>
          apt.date >= today && (apt.status === 'upcoming' || apt.status === 'confirmed' || apt.status === 'pending')
        );
        break;
      case 'completed':
        filtered = filtered.filter(apt => apt.status === 'completed');
        break;
      case 'cancelled':
        filtered = filtered.filter(apt => apt.status === 'cancelled');
        break;
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'confirmed': return 'default';
      case 'pending': return 'outline';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Payment Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleJoinConsultation = (appointmentId: string) => {
    router.push(`/patient/consultation/${appointmentId}`);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    const updatedAppointments = appointments.map(apt =>
      apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
    );
    setAppointments(updatedAppointments);
    
    // Update localStorage
    const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updatedAllAppointments = allAppointments.map((apt: Appointment) =>
      apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
    );
    localStorage.setItem('appointments', JSON.stringify(updatedAllAppointments));
  };

  const handleRescheduleAppointment = (appointmentId: string) => {
    // In a real app, this would open a reschedule dialog
    console.log('Reschedule appointment:', appointmentId);
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/patient/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">{t('myAppointments')}</h1>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => router.push('/patient/appointments/book')}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book New
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
            </div>
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
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {filterAppointments('upcoming').length}
              </div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">
                {filterAppointments('completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">
                {filterAppointments('cancelled').length}
              </div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {filterAppointments('upcoming').map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment}
                onJoin={handleJoinConsultation}
                onCancel={handleCancelAppointment}
                onReschedule={handleRescheduleAppointment}
              />
            ))}
            {filterAppointments('upcoming').length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                  <Button onClick={() => router.push('/patient/appointments/book')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterAppointments('completed').map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment}
                onJoin={handleJoinConsultation}
                onCancel={handleCancelAppointment}
                onReschedule={handleRescheduleAppointment}
              />
            ))}
            {filterAppointments('completed').length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed appointments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {filterAppointments('cancelled').map((appointment) => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment}
                onJoin={handleJoinConsultation}
                onCancel={handleCancelAppointment}
                onReschedule={handleRescheduleAppointment}
              />
            ))}
            {filterAppointments('cancelled').length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No cancelled appointments</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AppointmentCard({
  appointment,
  onJoin,
  onCancel,
  onReschedule
}: {
  appointment: Appointment;
  onJoin: (id: string) => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
}) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'confirmed': return 'default';
      case 'pending': return 'outline';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Payment Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const isUpcoming = appointment.status === 'upcoming' || appointment.status === 'confirmed';
  const isPending = appointment.status === 'pending';
  const isToday = appointment.date === new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Avatar>
              <AvatarImage src={appointment.avatar} />
              <AvatarFallback>
                <Stethoscope className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium truncate">{appointment.doctorName}</h3>
                <Badge variant={getStatusColor(appointment.status)}>
                  {getStatusText(appointment.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{appointment.doctorSpecialization}</p>
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
              {appointment.symptoms && appointment.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {appointment.symptoms.map((symptom, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              )}
              {appointment.consultationFee && (
                <p className="text-sm text-muted-foreground">
                  Consultation Fee: ₹{appointment.consultationFee}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col space-y-2 ml-4">
            {isPending && (
              <>
                <Button size="sm" onClick={() => router.push(`/patient/payment/${appointment.id}`)}>
                  <CreditCard className="w-4 h-4 mr-1" />
                  Pay Now
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onCancel(appointment.id)}>
                  Cancel
                </Button>
              </>
            )}
            {isUpcoming && isToday && (
              <Button size="sm" onClick={() => onJoin(appointment.id)}>
                <Video className="w-4 h-4 mr-1" />
                Join
              </Button>
            )}
            {isUpcoming && !isToday && (
              <>
                <Button size="sm" variant="outline" onClick={() => onReschedule(appointment.id)}>
                  Reschedule
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onCancel(appointment.id)}>
                  Cancel
                </Button>
              </>
            )}
            {appointment.status === 'completed' && (
              <Button size="sm" variant="outline">
                <MessageCircle className="w-4 h-4 mr-1" />
                Chat
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}