'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/language-context';
import { useNotification } from '@/contexts/notification-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  Check,
  Loader2,
  Stethoscope,
  IndianRupee,
  Shield,
  Clock,
  Calendar
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  type: 'video' | 'phone';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  symptoms?: string[];
  consultationFee: number;
  additionalNotes?: string;
  avatar?: string;
  createdAt: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
}

type PaymentMethod = 'upi' | 'netbanking';

const popularUPIApps = [
  { id: 'paytm', name: 'Paytm', icon: '💰' },
  { id: 'phonepe', name: 'PhonePe', icon: '📱' },
  { id: 'googlepay', name: 'Google Pay', icon: '🅶' },
  { id: 'bhim', name: 'BHIM', icon: '🏦' }
];

const popularBanks = [
  { id: 'sbi', name: 'State Bank of India', icon: '🏛️' },
  { id: 'hdfc', name: 'HDFC Bank', icon: '🏦' },
  { id: 'icici', name: 'ICICI Bank', icon: '🏦' },
  { id: 'axis', name: 'Axis Bank', icon: '🏦' },
  { id: 'pnb', name: 'Punjab National Bank', icon: '🏦' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', icon: '🏦' }
];

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const { t } = useLanguage();
  const { showNotification } = useNotification();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      router.push('/');
      return;
    }

    const appointmentId = params.appointmentId as string;
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const foundAppointment = appointments.find((apt: Appointment) => apt.id === appointmentId);

    if (!foundAppointment) {
      showNotification('Appointment not found', 'error');
      router.push('/patient/appointments');
      return;
    }

    if (foundAppointment.paymentStatus === 'completed') {
      showNotification('Payment already completed', 'info');
      router.push('/patient/appointments');
      return;
    }

    setAppointment(foundAppointment);
  }, [isAuthenticated, isDoctor, params.appointmentId, router, showNotification]);

  const handlePayment = async () => {
    if (!appointment) return;

    if (paymentMethod === 'upi' && !upiId.trim()) {
      showNotification('Please enter your UPI ID', 'error');
      return;
    }

    if (paymentMethod === 'netbanking' && !selectedBank) {
      showNotification('Please select your bank', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Sync with backend (Supabase)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'confirmed',
          payment_status: 'completed'
        }),
      });

      if (!response.ok) {
        console.warn("Backend sync failed during payment.");
      }
    } catch (error) {
      console.error("Error updating appointment in backend:", error);
    }

    setTimeout(() => {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const updatedAppointments = appointments.map((apt: Appointment) => {
        if (apt.id === appointment.id) {
          return {
            ...apt,
            paymentStatus: 'completed',
            status: 'confirmed'
          };
        }
        return apt;
      });

      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

      setIsProcessing(false);
      setPaymentSuccess(true);

      setTimeout(() => {
        showNotification('Payment successful! Appointment confirmed.', 'success');
        router.push('/patient/appointments');
      }, 2000);
    }, 3000);
  };

  if (!isAuthenticated || !user || isDoctor || !appointment) {
    return null;
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-none border bg-card">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Payment Successful!</h2>
              <p className="text-sm text-muted-foreground">
                Your appointment has been confirmed. Redirecting...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => router.push('/patient/appointments')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Complete Payment</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-none border bg-card">
              <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-primary" />
                  Select Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <div className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center cursor-pointer flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg mr-3">
                        <Smartphone className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">UPI</p>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">GPay, PhonePe, Paytm</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <RadioGroupItem value="netbanking" id="netbanking" />
                    <Label htmlFor="netbanking" className="flex items-center cursor-pointer flex-1">
                      <div className="p-2 bg-secondary/10 rounded-lg mr-3">
                        <Building2 className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Net Banking</p>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Direct Bank Transfer</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {paymentMethod === 'upi' && (
              <Card className="shadow-none border bg-card">
                <CardHeader className="py-4">
                  <CardTitle className="text-base flex items-center justify-between">
                    UPI Payment
                    <Shield className="w-4 h-4 text-blue-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                  <div className="space-y-2">
                    <Label htmlFor="upiId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      disabled={isProcessing}
                      className="h-10 rounded-xl bg-muted/20 border-muted-foreground/20"
                    />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                      Example: 9876543210@paytm, username@ybl
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Popular UPI Apps</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {popularUPIApps.map((app) => (
                        <Button
                          key={app.id}
                          variant="outline"
                          size="sm"
                          className="justify-start h-9 rounded-xl font-bold px-3"
                          onClick={() => setUpiId(`@${app.id}`)}
                          disabled={isProcessing}
                        >
                          <span className="mr-2 text-base">{app.icon}</span>
                          <span className="text-[11px] truncate">{app.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {paymentMethod === 'netbanking' && (
              <Card className="shadow-none border bg-card">
                <CardHeader className="py-4">
                  <CardTitle className="text-base">Net Banking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Bank</Label>
                    <RadioGroup value={selectedBank} onValueChange={setSelectedBank}>
                      <div className="grid gap-2">
                        {popularBanks.map((bank) => (
                          <div
                            key={bank.id}
                            className="flex items-center space-x-3 p-2.5 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
                          >
                            <RadioGroupItem value={bank.id} id={bank.id} disabled={isProcessing} />
                            <Label htmlFor={bank.id} className="flex items-center cursor-pointer flex-1">
                              <span className="mr-2 text-lg">{bank.icon}</span>
                              <span className="text-[13px] font-bold">{bank.name}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="shadow-none border bg-card">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-5">
                <div className="flex items-center space-x-3 pb-4 border-b">
                  <Avatar className="w-10 h-10 border-2 border-primary/20 p-0.5">
                    <AvatarImage src={appointment.avatar} />
                    <AvatarFallback>
                      <Stethoscope className="w-5 h-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{appointment.doctorName}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{appointment.doctorSpecialization}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-primary" />
                      Date
                    </div>
                    <p className="text-xs font-bold">{new Date(appointment.date).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 mr-2 text-primary" />
                      Time
                    </div>
                    <p className="text-xs font-bold">{appointment.time}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <Smartphone className="w-3.5 h-3.5 mr-2 text-primary" />
                      Type
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-bold h-5 px-2">
                      {appointment.type === 'video' ? 'Video' : 'Phone'}
                    </Badge>
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Consultation</span>
                    <span className="text-foreground">₹{appointment.consultationFee}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Platform Fee</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-bold text-sm uppercase tracking-wider">Total</span>
                    <span className="text-2xl font-bold text-primary">₹{appointment.consultationFee}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  variant="premium"
                  className="w-full h-12 rounded-2xl text-base font-bold"
                  disabled={isProcessing || (paymentMethod === 'upi' && !upiId.trim()) || (paymentMethod === 'netbanking' && !selectedBank)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <IndianRupee className="w-5 h-5 mr-3" />
                      Pay ₹{appointment.consultationFee}
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-tighter opacity-70">
                  Secure 256-bit SSL encrypted payment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
