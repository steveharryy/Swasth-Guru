'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, getApiUrl, getAppointmentTimeStatus } from '@/lib/utils';
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
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isAuthenticated || isDoctor) {
      router.push('/');
    } else {
      fetchAppointments();
    }
  }, [isLoaded, isAuthenticated, isDoctor, router, user]);

  const fetchAppointments = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/appointments/patient/${user?.id}`);
      if (res.ok) {
        const remoteAppointments = await res.json();
        const mapped = remoteAppointments.map((apt: any) => ({
          ...apt,
          id: apt.id.toString(),
          patientId: apt.patient_id || apt.patientId,
          doctorId: apt.doctor_id || apt.doctorId,
          doctorName: apt.doctor_name || apt.doctorName,
          doctorSpecialization: apt.doctor_specialization || apt.doctorSpecialization,
          consultationFee: apt.consultation_fee || apt.consultationFee,
          status: apt.status?.toLowerCase() || 'pending',
          paymentStatus: (apt.status?.toLowerCase() === 'pending' || apt.payment_status?.toLowerCase() === 'pending') ? 'pending' : 'completed'
        }));
        setAppointments(mapped);
        localStorage.setItem('appointments', JSON.stringify(mapped));
      } else {
        const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const userAppointments = storedAppointments.filter((apt: any) =>
          (apt.patientId === user?.id || apt.patient_id === user?.id)
        ).map((apt: any) => ({
          ...apt,
          status: apt.status?.toLowerCase() || 'pending'
        }));
        setAppointments(userAppointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      setAppointments(storedAppointments.filter((apt: any) => (apt.patientId === user?.id || apt.patient_id === user?.id)));
    }
  };

  const filterAppointments = (status?: string) => {
    let filtered = [...appointments];

    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctorSpecialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (apt.symptoms && apt.symptoms.some(symptom =>
          symptom.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    const normalizeDate = (d: string) => {
      if (!d) return '';
      if (d.includes('T')) return d.split('T')[0];
      if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }
      return d;
    };

    const today = new Date().toISOString().split('T')[0];
    const todayStr = normalizeDate(today);
    const targetStatus = status?.toLowerCase();

    switch (targetStatus) {
      case 'upcoming':
        filtered = filtered.filter(apt => {
          const isHackathon = apt.date === 'hackathon' || apt.doctorName?.toLowerCase().includes("gajraj pandey");
          const isStatusUpcoming = apt.status === 'upcoming' || apt.status === 'confirmed' || apt.status === 'pending';
          return isHackathon || (normalizeDate(apt.date) >= todayStr && isStatusUpcoming);
        });
        break;
      case 'completed':
        filtered = filtered.filter(apt => {
          const isPast = normalizeDate(apt.date) < todayStr;
          const isConfirmed = apt.status === 'confirmed' || apt.status === 'upcoming';
          return apt.status === 'completed' || (isPast && isConfirmed);
        });
        break;
      case 'cancelled':
        filtered = filtered.filter(apt => apt.status === 'cancelled');
        break;
    }

    console.log(`Filtered appointments for ${status}:`, filtered.length);
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'upcoming': return 'default';
      case 'confirmed': return 'default';
      case 'pending': return 'outline';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (res.ok) {
        const updatedAppointments = appointments.map(apt =>
          apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        );
        setAppointments(updatedAppointments);

        // Update localStorage
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const updatedAllAppointments = allAppointments.map((apt: any) =>
          apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
        );
        localStorage.setItem('appointments', JSON.stringify(updatedAllAppointments));
        console.log('Appointment cancelled successfully in backend');
      } else {
        const errorData = await res.json();
        console.error('Failed to cancel appointment in backend:', errorData);
        alert('Failed to cancel appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Network error. Could not cancel appointment.');
    }
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
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
                onClick={() => router.push('/patient/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold logo-text">अपॉइंटमेंट (Appointments)</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push('/patient/appointments/book')}
                variant="premium"
                className="h-10 px-6 rounded-2xl font-bold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Book New
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 pb-28 max-w-4xl">
        {/* Search */}
        <div className="mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Search by doctor or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-11 pr-4 text-sm font-medium rounded-xl border bg-muted/30 focus:bg-background focus:border-primary/20 transition-all shadow-none"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Upcoming', count: filterAppointments('upcoming').length, color: 'text-primary' },
            { label: 'Completed', count: filterAppointments('completed').length, color: 'text-green-600' },
            { label: 'Cancelled', count: filterAppointments('cancelled').length, color: 'text-red-500' }
          ].map((stat) => (
            <Card key={stat.label} className="border shadow-none bg-card">
              <CardContent className="p-4 text-center space-y-0.5">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="flex w-full h-11 p-1 bg-muted rounded-xl border">
            {['upcoming', 'completed', 'cancelled'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex-1 h-full text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all uppercase tracking-wider"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 outline-none">
            {filterAppointments('upcoming').length > 0 ? (
              filterAppointments('upcoming').map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onJoin={handleJoinConsultation}
                  onCancel={handleCancelAppointment}
                  onReschedule={handleRescheduleAppointment}
                />
              ))
            ) : (
              <Card className="border border-dashed bg-muted/20">
                <CardContent className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Calendar className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-muted-foreground/50">No Upcoming Appointments</p>
                    <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Book your first doctor visit today</p>
                  </div>
                  <Button
                    onClick={() => router.push('/patient/appointments/book')}
                    className="h-10 px-6 text-sm font-bold rounded-xl shadow-sm hover:scale-105 transition-transform"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6 outline-none">
            {filterAppointments('completed').length > 0 ? (
              filterAppointments('completed').map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onJoin={handleJoinConsultation}
                  onCancel={handleCancelAppointment}
                  onReschedule={handleRescheduleAppointment}
                />
              ))
            ) : (
              <div className="p-20 text-center space-y-4 opacity-40">
                <Stethoscope className="w-20 h-20 text-slate-300 mx-auto" />
                <p className="text-2xl font-black text-slate-400">No Completed Visits</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-6 outline-none">
            {filterAppointments('cancelled').length > 0 ? (
              filterAppointments('cancelled').map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onJoin={handleJoinConsultation}
                  onCancel={handleCancelAppointment}
                  onReschedule={handleRescheduleAppointment}
                />
              ))
            ) : (
              <div className="p-20 text-center space-y-4 opacity-40">
                <Calendar className="w-20 h-20 text-slate-300 mx-auto" />
                <p className="text-2xl font-black text-slate-400">No Cancelled visits</p>
              </div>
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
    if ((status === 'upcoming' || status === 'confirmed') && getAppointmentTimeStatus(appointment.date, appointment.time) === 'over') {
      return 'destructive';
    }
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
    if ((status === 'upcoming' || status === 'confirmed') && getAppointmentTimeStatus(appointment.date, appointment.time) === 'over') {
      return 'Appointment Over';
    }
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

  const normalizeDate = (d: string) => {
    if (!d) return '';
    if (d.includes('T')) return d.split('T')[0];
    if (d.includes('/')) {
      const parts = d.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }
    return d;
  };

  const isHackathon = appointment.date === 'hackathon' || appointment.doctorName?.toLowerCase().includes("gajraj pandey");
  const isToday = isHackathon || normalizeDate(appointment.date) === normalizeDate(new Date().toISOString().split('T')[0]);
  const timeStatus = isHackathon ? 'ready' : getAppointmentTimeStatus(appointment.date, appointment.time);

  return (
    <Card className="border shadow-none overflow-hidden transition-all hover:shadow-md hover:translate-y-[-1px] group bg-card">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side: Avatar & Basic Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="w-14 h-14 border rounded-xl shadow-sm">
                <AvatarImage src={appointment.avatar} />
                <AvatarFallback className="text-lg font-bold">
                  <Stethoscope className="h-7 w-7" />
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
                <h3 className="text-lg font-bold text-foreground tracking-tight">{appointment.doctorName}</h3>
                <Badge variant="secondary" className={cn(
                  "px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-widest border",
                  appointment.status === 'completed' ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10" :
                    appointment.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10" :
                      "bg-primary/5 text-primary border-primary/10 dark:bg-primary/10"
                )}>
                  {getStatusText(appointment.status)}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-muted-foreground italic">
                {appointment.doctorSpecialization}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center px-3 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground border">
                  <Calendar className="w-3 h-3 mr-2 text-primary" />
                  {appointment.date === 'hackathon' ? 'Demo Mode' : new Date(appointment.date).toLocaleDateString()}
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

          {/* Right Side: Actions & Fee */}
          <div className="flex lg:flex-col items-center lg:items-end justify-between gap-4 lg:min-w-[160px] pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-6">
            <div className="text-center lg:text-right hidden lg:block">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Fee</p>
              <p className="text-xl font-bold text-foreground">₹{appointment.consultationFee || '500'}</p>
            </div>

            <div className="flex flex-wrap lg:flex-col gap-2 w-full sm:w-auto lg:w-full">
              {isPending && (
                <>
                  <Button
                    variant="premium"
                    className="flex-1 h-10 text-sm font-bold rounded-xl"
                    onClick={() => router.push(`/patient/payment/${appointment.id}`)}
                  >
                    <CreditCard className="w-5 h-5 mr-3 text-[#001C3D]" />
                    Pay Now
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-9 text-sm font-bold rounded-xl text-destructive hover:bg-destructive/5"
                    onClick={() => onCancel(appointment.id)}
                  >
                    Cancel
                  </Button>
                </>
              )}

              {isUpcoming && isToday && (
                <>
                   {timeStatus === 'ready' && (
                    <Button
                      variant="premium"
                      className={cn(
                        "flex-1 h-11 text-base font-bold rounded-xl border-2 border-primary/20",
                        isHackathon && "bg-green-500 hover:bg-green-600 border-none text-white shadow-lg shadow-green-500/20"
                      )}
                      onClick={() => onJoin(appointment.id)}
                    >
                      <Video className={cn("w-6 h-6 mr-3", isHackathon ? "text-white" : "text-primary")} />
                      {isHackathon ? "Direct Join (Demo)" : "Join Call"}
                    </Button>
                  )}
                  {timeStatus === 'early' && (
                    <div className="bg-primary/5 border rounded-xl p-2 text-center w-full">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Starting Soon</p>
                      <p className="text-[10px] font-medium text-muted-foreground mt-0.5 italic">Join 10 min before</p>
                    </div>
                  )}
                </>
              )}

              {isUpcoming && !isToday && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 h-9 text-sm font-bold rounded-xl text-muted-foreground"
                    onClick={() => onReschedule(appointment.id)}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 h-9 text-[10px] font-bold rounded-xl text-muted-foreground uppercase tracking-widest hover:text-destructive"
                    onClick={() => onCancel(appointment.id)}
                  >
                    Cancel Visit
                  </Button>
                </>
              )}

              {appointment.status === 'completed' && (
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-sm font-bold rounded-xl"
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-primary" />
                  Chat
                </Button>
              )}

              {appointment.status === 'cancelled' && (
                <Button
                  onClick={() => router.push('/patient/appointments/book')}
                  variant="outline"
                  className="flex-1 h-9 text-sm font-bold rounded-xl text-muted-foreground"
                >
                  Book Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
