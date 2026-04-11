'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
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
import { getAppointmentTimeStatus, cn } from '@/lib/utils';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  type: 'video' | 'phone';
  status: 'upcoming' | 'completed' | 'cancelled' | 'in-progress' | 'confirmed' | 'pending';
  symptoms: string[];
  avatar?: string;
  duration?: number;
}
export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('today');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !isDoctor) {
      router.push('/');
    } else {
      fetchDoctorAppointments();
    }
  }, [isAuthenticated, isDoctor, router, user]);

  const fetchDoctorAppointments = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';

      // First get numeric doctor ID
      let numericId: number | null = null;
      const docRes = await fetch(`${apiUrl}/users/doctor/${user?.id}`);
      if (docRes.ok) {
        const dbDoctor = await docRes.json();
        numericId = dbDoctor.id;
      }

      // Then fetch appointments
      const res = await fetch(`${apiUrl}/appointments/doctor/${user?.id}`);
      if (res.ok) {
        const remoteAppointments = await res.json();
        const uniqueAppointments = remoteAppointments.reduce((acc: any[], current: any) => {
          const x = acc.find(item => (item.id === current.id) || (item.appointment_id === current.appointment_id && current.appointment_id));
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        const mapped = uniqueAppointments.map((apt: any) => ({
          ...apt,
          id: apt.id.toString(),
          patientId: apt.patient_id || apt.patientId,
          patientName: apt.patient?.name || apt.patient_name || apt.patientName || 'Unknown Patient',
          status: apt.status?.toLowerCase() || 'pending',
          symptoms: apt.symptoms || []
        }));
        setAppointments(mapped);
        localStorage.setItem('appointments', JSON.stringify(mapped));
      } else {
        const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const doctorAppointments = storedAppointments.filter((apt: any) =>
          apt.doctorId === user?.id || (numericId && apt.doctor_id?.toString() === numericId.toString())
        );
        setAppointments(doctorAppointments);
      }
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    }
  };


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

    // Better helper for date comparison
    const normalizeDate = (d: string) => {
      if (!d) return '';
      // If it's an ISO string (2026-03-05T...), take only the date part
      if (d.includes('T')) return d.split('T')[0];

      // If it's DD/MM/YYYY, convert to YYYY-MM-DD
      if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }
      return d;
    };

    const todayStr = normalizeDate(today);

    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(apt => {
          const isToday = normalizeDate(apt.date) === todayStr;
          const isOver = getAppointmentTimeStatus(apt.date, apt.time) === 'over';
          // Today shows active today or completed today
          return isToday && (apt.status !== 'completed' && !isOver);
        });
        break;
      case 'tomorrow':
        filtered = filtered.filter(apt => normalizeDate(apt.date) === normalizeDate(tomorrow));
        break;
      case 'upcoming':
        // Strictly after today
        filtered = filtered.filter(apt => normalizeDate(apt.date) > todayStr && (apt.status === 'upcoming' || apt.status === 'confirmed'));
        break;
      case 'completed':
        filtered = filtered.filter(apt => {
          const isOver = getAppointmentTimeStatus(apt.date, apt.time) === 'over';
          const isToday = normalizeDate(apt.date) === todayStr;
          const isPast = normalizeDate(apt.date) < todayStr;

          return apt.status === 'completed' || isOver || (isPast && (apt.status === 'upcoming' || apt.status === 'confirmed'));
        });
        break;
      case 'all':
        // No filtering, keep all
        break;
    }

    return filtered;
  };

  const getStatusColor = (status: string, date: string, time: string) => {
    const timeStatus = getAppointmentTimeStatus(date, time);
    if (timeStatus === 'over' || status === 'cancelled') return 'destructive';
    switch (status) {
      case 'upcoming': return 'default';
      case 'confirmed': return 'default';
      case 'in-progress': return 'destructive';
      case 'completed': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusText = (status: string, date: string, time: string) => {
    const timeStatus = getAppointmentTimeStatus(date, time);
    if (timeStatus === 'over') return 'Completed';
    switch (status) {
      case 'in-progress': return 'In Progress';
      case 'upcoming': return 'Upcoming';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api';
      const res = await fetch(`${apiUrl}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setAppointments(prev => prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status: status as any } : apt
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
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
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
                onClick={() => router.push('/doctor/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold logo-text">कार्यसूची (Schedule)</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-4xl">
        {/* Search */}
        <div className="mb-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Search patients or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-4 text-sm font-medium rounded-xl border bg-muted/30 focus:bg-background focus:border-primary/20 transition-all shadow-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-10 p-1 bg-muted rounded-xl border">
            <TabsTrigger value="today" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all uppercase tracking-wider">Today</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all uppercase tracking-wider">Upcoming</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all uppercase tracking-wider">Completed</TabsTrigger>
            <TabsTrigger value="all" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all uppercase tracking-wider">All</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {filterAppointments('', 'today').map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onJoin={handleJoinConsultation}
                onView={handleViewPatient}
                onStatusUpdate={handleUpdateStatus}
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
                onStatusUpdate={handleUpdateStatus}
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
                onStatusUpdate={handleUpdateStatus}
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
  onView,
  onStatusUpdate
}: {
  appointment: Appointment;
  onJoin: (id: string) => void;
  onView: (id: string) => void;
  onStatusUpdate?: (id: string, status: string) => void;
}) {
  const getStatusColor = (status: string) => {
    const timeStatus = getAppointmentTimeStatus(appointment.date, appointment.time);
    if (timeStatus === 'over' || status === 'cancelled' || status === 'completed') {
      return 'destructive';
    }
    switch (status) {
      case 'upcoming': return 'default';
      case 'confirmed': return 'default';
      case 'in-progress': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    const timeStatus = getAppointmentTimeStatus(appointment.date, appointment.time);
    if (timeStatus === 'over' || status === 'completed') {
      return 'Completed';
    }
    switch (status) {
      case 'in-progress': return 'In Progress';
      case 'upcoming': return 'Upcoming';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <Card className="border shadow-none overflow-hidden transition-all hover:shadow-md hover:translate-y-[-1px] group bg-card">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="w-14 h-14 border rounded-xl shadow-sm">
                <AvatarImage src={appointment.avatar} />
                <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">
                  <User className="h-7 w-7" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-background border rounded-lg flex items-center justify-center shadow-sm">
                {appointment.type === 'video' ? (
                  <Video className="w-3 h-3 text-primary" />
                ) : (
                  <Phone className="w-3 h-3 text-secondary" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-foreground tracking-tight">{appointment.patientName}</h3>
                <Badge variant={getStatusColor(appointment.status)} className={cn(
                  "px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-widest border",
                  (appointment.status === 'completed' || getAppointmentTimeStatus(appointment.date, appointment.time) === 'over') ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400" :
                    appointment.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10" :
                      "bg-primary/5 text-primary border-primary/10 dark:bg-primary/10"
                )}>
                  {getStatusText(appointment.status)}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-muted-foreground tabular-nums">
                {appointment.patientPhone}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center px-3 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground border">
                  <Calendar className="w-3 h-3 mr-2 text-primary" />
                  {new Date(appointment.date).toLocaleDateString()}
                </div>
                <div className="flex items-center px-3 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground border">
                  <Clock className="w-3 h-3 mr-2 text-primary" />
                  {appointment.time}
                </div>
              </div>

              {appointment.symptoms && appointment.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {appointment.symptoms.map((symptom, index) => (
                    <Badge key={index} variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex lg:flex-col items-center lg:items-end justify-between gap-4 lg:min-w-[160px] pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-6">
            <div className="flex flex-wrap lg:flex-col gap-2 w-full sm:w-auto lg:w-full">
              {(appointment.status === 'upcoming' || appointment.status === 'confirmed') && (
                <>
                  {getAppointmentTimeStatus(appointment.date, appointment.time) === 'ready' && (
                    <Button
                      variant="premium"
                      className="flex-1 h-11 text-base font-bold rounded-xl shadow-lg border-2 border-primary/20"
                      onClick={() => onJoin(appointment.id)}
                    >
                      <Video className="w-5 h-5 mr-3 text-primary" />
                      Start Visit
                    </Button>
                  )}
                  {getAppointmentTimeStatus(appointment.date, appointment.time) === 'early' && (
                    <div className="bg-primary/5 border rounded-xl p-2 text-center w-full">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Starts Soon</p>
                      <p className="text-[10px] font-medium text-muted-foreground mt-0.5 italic">Join 10 min before</p>
                    </div>
                  )}
                </>
              )}
              {appointment.status === 'in-progress' && (
                <Button
                  className="flex-1 h-10 text-sm font-bold rounded-xl bg-gradient-to-r from-destructive to-red-400 text-white border-none hover:scale-105 transition-all shadow-lg shadow-destructive/20"
                  onClick={() => onJoin(appointment.id)}
                >
                  <Video className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              )}
              {(appointment.status === 'upcoming' || appointment.status === 'confirmed' || appointment.status === 'in-progress') &&
                getAppointmentTimeStatus(appointment.date, appointment.time) !== 'over' && (
                  <Button
                    variant="outline"
                    className="flex-1 h-10 text-sm font-bold rounded-xl border-green-500/30 text-green-500 hover:bg-green-500/10 transition-colors"
                    onClick={() => onStatusUpdate?.(appointment.id, 'completed')}
                  >
                    Complete
                  </Button>
                )}
              <Button
                variant="ghost"
                className="flex-1 h-10 text-xs font-bold rounded-xl"
                onClick={() => onView(appointment.patientId)}
              >
                View Patient
              </Button>
              {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                <Button
                  variant="premium"
                  className="flex-1 h-10 text-xs font-bold rounded-xl"
                  onClick={() => onView(appointment.patientId)}
                >
                  Patient Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
