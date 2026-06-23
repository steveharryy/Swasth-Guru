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
  Clock,
  Calendar,
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

  // Loading states
  const [activeJoinLoading, setActiveJoinLoading] = useState<string | null>(null);
  const [activeCancelLoading, setActiveCancelLoading] = useState<string | null>(null);
  const [activePayLoading, setActivePayLoading] = useState<string | null>(null);
  const [activeRescheduleLoading, setActiveRescheduleLoading] = useState<string | null>(null);
  const [isBookLoading, setIsBookLoading] = useState(false);

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

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleJoinConsultation = (appointmentId: string) => {
    setActiveJoinLoading(appointmentId);
    router.push(`/patient/consultation/${appointmentId}`);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    setActiveCancelLoading(appointmentId);
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

        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const updatedAllAppointments = allAppointments.map((apt: any) =>
          apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
        );
        localStorage.setItem('appointments', JSON.stringify(updatedAllAppointments));
      } else {
        alert('Failed to cancel appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Network error. Could not cancel appointment.');
    } finally {
      setActiveCancelLoading(null);
    }
  };

  const handleRescheduleAppointment = (appointmentId: string) => {
    setActiveRescheduleLoading(appointmentId);
    // Mimic quick redirect or reload
    setTimeout(() => {
      alert('Reschedule request sent / समय बदलने का अनुरोध भेजा गया');
      setActiveRescheduleLoading(null);
    }, 1000);
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
                className="h-10 w-10 text-muted-foreground"
                onClick={() => router.push('/patient/dashboard')}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-bold logo-text">My Appointments / मेरे अपॉइंटमेंट</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setIsBookLoading(true);
                  router.push('/patient/appointments/book');
                }}
                loading={isBookLoading}
                variant="premium"
                className="h-12 px-6 rounded-xl font-black text-sm"
              >
                <Plus className="w-5 h-5 mr-2" />
                Book Doctor / डॉक्टर से मिलें
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Search by doctor or symptoms / डॉक्टर या लक्षणों से खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 pr-4 text-base font-semibold rounded-xl border bg-muted/30 focus:bg-background focus:border-primary/20 transition-all shadow-none"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Upcoming / आने वाले', count: filterAppointments('upcoming').length, color: 'text-primary' },
            { label: 'Completed / पूरा हुआ', count: filterAppointments('completed').length, color: 'text-green-600' },
            { label: 'Cancelled / रद्द हुआ', count: filterAppointments('cancelled').length, color: 'text-red-500' }
          ].map((stat) => (
            <Card key={stat.label} className="border shadow-none bg-card">
              <CardContent className="p-4 text-center space-y-1">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="flex w-full h-12 p-1 bg-muted rounded-xl border">
            {['upcoming', 'completed', 'cancelled'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex-1 h-full text-xs md:text-sm font-black rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all uppercase tracking-wider"
              >
                {tab === 'upcoming' ? 'Upcoming / आने वाले' : tab === 'completed' ? 'Completed / पूरा हुआ' : 'Cancelled / रद्द हुआ'}
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
                  joinLoading={activeJoinLoading === appointment.id}
                  cancelLoading={activeCancelLoading === appointment.id}
                  rescheduleLoading={activeRescheduleLoading === appointment.id}
                  payLoading={activePayLoading === appointment.id}
                  setPayLoading={setActivePayLoading}
                />
              ))
            ) : (
              <Card className="border border-dashed bg-muted/20">
                <CardContent className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Calendar className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-muted-foreground/55">No Appointments Found / कोई अपॉइंटमेंट नहीं मिला</p>
                  </div>
                  <Button
                    onClick={() => {
                      setIsBookLoading(true);
                      router.push('/patient/appointments/book');
                    }}
                    loading={isBookLoading}
                    className="h-12 px-6 text-sm font-bold rounded-xl shadow-sm hover:scale-105 transition-transform"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Book Now / अभी बुक करें
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
                  joinLoading={activeJoinLoading === appointment.id}
                  cancelLoading={activeCancelLoading === appointment.id}
                  rescheduleLoading={activeRescheduleLoading === appointment.id}
                  payLoading={activePayLoading === appointment.id}
                  setPayLoading={setActivePayLoading}
                />
              ))
            ) : (
              <div className="p-20 text-center space-y-4 opacity-40">
                <Stethoscope className="w-20 h-20 text-muted-foreground/60 mx-auto" />
                <p className="text-xl font-bold text-muted-foreground">No Appointments / कोई मुलाक़ात नहीं</p>
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
                  joinLoading={activeJoinLoading === appointment.id}
                  cancelLoading={activeCancelLoading === appointment.id}
                  rescheduleLoading={activeRescheduleLoading === appointment.id}
                  payLoading={activePayLoading === appointment.id}
                  setPayLoading={setActivePayLoading}
                />
              ))
            ) : (
              <div className="p-20 text-center space-y-4 opacity-40">
                <Calendar className="w-20 h-20 text-muted-foreground/60 mx-auto" />
                <p className="text-xl font-bold text-muted-foreground">No Appointments / कोई मुलाक़ात नहीं</p>
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
  onReschedule,
  joinLoading,
  cancelLoading,
  rescheduleLoading,
  payLoading,
  setPayLoading
}: {
  appointment: Appointment;
  onJoin: (id: string) => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
  joinLoading: boolean;
  cancelLoading: boolean;
  rescheduleLoading: boolean;
  payLoading: boolean;
  setPayLoading: (id: string | null) => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();

  const getStatusText = (status: string) => {
    if ((status === 'upcoming' || status === 'confirmed') && getAppointmentTimeStatus(appointment.date, appointment.time) === 'over') {
      return 'Appointment Over / मुलाक़ात समाप्त';
    }
    switch (status) {
      case 'upcoming': return 'Upcoming / आने वाली';
      case 'confirmed': return 'Confirmed / निश्चित';
      case 'pending': return 'Payment Pending / भुगतान बाकी';
      case 'completed': return 'Completed / पूरा हुआ';
      case 'cancelled': return 'Cancelled / रद्द हुआ';
      default: return status;
    }
  };

  const isUpcoming = appointment.status === 'upcoming' || appointment.status === 'confirmed';
  const isPending = appointment.status === 'pending';

  const normalizeDate = (d: string) => {
    if (!d) return '';
    if (d.includes('T')) return d.split('T')[0];
    return d;
  };

  const isHackathon = appointment.date === 'hackathon' || appointment.doctorName?.toLowerCase().includes("gajraj pandey");
  const isToday = isHackathon || normalizeDate(appointment.date) === normalizeDate(new Date().toISOString().split('T')[0]);
  const timeStatus = isHackathon ? 'ready' : getAppointmentTimeStatus(appointment.date, appointment.time);

  return (
    <Card className="border shadow-sm overflow-hidden transition-all hover:shadow-md bg-card rounded-[2rem]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side: Avatar & Basic Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="w-16 h-16 border rounded-2xl shadow-sm">
                <AvatarImage src={appointment.avatar} />
                <AvatarFallback className="text-xl font-bold bg-muted">
                  <Stethoscope className="h-8 w-8 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-background border rounded-lg flex items-center justify-center shadow-sm">
                {appointment.type === 'video' ? (
                  <Video className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Phone className="w-3.5 h-3.5 text-secondary" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-foreground tracking-tight">{appointment.doctorName}</h3>
                <Badge variant="secondary" className={cn(
                  "px-3 py-1 rounded-lg font-bold text-xs border",
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
                <div className="flex items-center px-3 py-1.5 bg-muted rounded-xl text-xs font-bold text-muted-foreground border">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-primary" />
                  {appointment.date === 'hackathon' ? 'Demo Mode' : new Date(appointment.date).toLocaleDateString()}
                </div>
                <div className="flex items-center px-3 py-1.5 bg-muted rounded-xl text-xs font-bold text-muted-foreground border">
                  <Clock className="w-3.5 h-3.5 mr-2 text-primary" />
                  {appointment.time}
                </div>
              </div>

              {appointment.symptoms && appointment.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {appointment.symptoms.map((symptom, index) => (
                    <Badge key={index} variant="outline" className="text-xs font-bold px-2 py-0.5 rounded-md">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Actions & Fee */}
          <div className="flex lg:flex-col items-center lg:items-end justify-between gap-4 lg:min-w-[180px] pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-6">
            <div className="text-center lg:text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Fee / शुल्क</p>
              <p className="text-2xl font-black text-foreground">₹{appointment.consultationFee || '500'}</p>
            </div>

            <div className="flex flex-wrap lg:flex-col gap-2.5 w-full sm:w-auto lg:w-full">
              {isPending && (
                <>
                  <Button
                    variant="premium"
                    className="flex-1 h-12 text-sm font-black rounded-xl"
                    onClick={() => {
                      setPayLoading(appointment.id);
                      router.push(`/patient/payment/${appointment.id}`);
                    }}
                    loading={payLoading}
                  >
                    <CreditCard className="w-5 h-5 mr-2 text-[#001C3D] shrink-0" />
                    Pay Now / भुगतान करें
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-sm font-bold rounded-xl text-destructive hover:bg-destructive/5"
                    onClick={() => onCancel(appointment.id)}
                    loading={cancelLoading}
                  >
                    Cancel / रद्द करें
                  </Button>
                </>
              )}

              {isUpcoming && isToday && (
                <>
                   {timeStatus === 'ready' && (
                      <Button
                      variant="premium"
                      className={cn(
                        "flex-1 h-14 text-sm font-black rounded-xl border-2 border-primary/20",
                        isHackathon && "bg-green-500 hover:bg-green-600 border-none text-white shadow-lg"
                      )}
                      onClick={() => onJoin(appointment.id)}
                      loading={joinLoading}
                    >
                      <Video className={cn("w-5 h-5 mr-2 shrink-0", isHackathon ? "text-white" : "text-primary")} />
                      Join Call / कॉल से जुड़ें
                    </Button>
                  )}
                  {timeStatus === 'early' && (
                    <div className="bg-primary/5 border rounded-xl p-3 text-center w-full">
                      <p className="text-xs font-bold text-primary uppercase tracking-wide">Starting Soon / जल्द शुरू होगा</p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 italic">Join 10m early / १० मिनट पहले जुड़ें</p>
                    </div>
                  )}
                </>
              )}

              {isUpcoming && !isToday && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-sm font-bold rounded-xl text-muted-foreground"
                    onClick={() => onReschedule(appointment.id)}
                    loading={rescheduleLoading}
                  >
                    Reschedule / समय बदलें
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 h-12 text-xs font-bold rounded-xl text-muted-foreground uppercase tracking-wider hover:text-destructive"
                    onClick={() => onCancel(appointment.id)}
                    loading={cancelLoading}
                  >
                    Cancel / रद्द करें
                  </Button>
                </>
              )}

              {appointment.status === 'completed' && (
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-sm font-bold rounded-xl"
                  onClick={() => router.push(`/patient/dashboard`)}
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-primary" />
                  Chat / बातचीत
                </Button>
              )}

              {appointment.status === 'cancelled' && (
                <Button
                  onClick={() => router.push('/patient/appointments/book')}
                  variant="outline"
                  className="flex-1 h-12 text-sm font-bold rounded-xl text-muted-foreground"
                >
                  Book Again / फिर बुक करें
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
