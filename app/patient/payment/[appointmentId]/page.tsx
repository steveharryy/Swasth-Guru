'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
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
  const { user, isAuthenticated, isDoctor } = useAuth();
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
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-muted-foreground">
                Your appointment has been confirmed. You will be redirected to your appointments page.
              </p>
              <div className="animate-spin mx-auto">
                <Loader2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Select Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center cursor-pointer flex-1">
                      <Smartphone className="w-5 h-5 mr-2" />
                      <div>
                        <p className="font-medium">UPI</p>
                        <p className="text-xs text-muted-foreground">Pay using UPI ID or apps</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="netbanking" id="netbanking" />
                    <Label htmlFor="netbanking" className="flex items-center cursor-pointer flex-1">
                      <Building2 className="w-5 h-5 mr-2" />
                      <div>
                        <p className="font-medium">Net Banking</p>
                        <p className="text-xs text-muted-foreground">Pay directly from your bank</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {paymentMethod === 'upi' && (
              <Card>
                <CardHeader>
                  <CardTitle>UPI Payment</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Enter your UPI ID to complete the payment
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: 9876543210@paytm, username@ybl
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Popular UPI Apps</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {popularUPIApps.map((app) => (
                        <Button
                          key={app.id}
                          variant="outline"
                          className="justify-start"
                          onClick={() => setUpiId(`@${app.id}`)}
                          disabled={isProcessing}
                        >
                          <span className="mr-2">{app.icon}</span>
                          {app.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      Your payment is secure and encrypted
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {paymentMethod === 'netbanking' && (
              <Card>
                <CardHeader>
                  <CardTitle>Net Banking</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select your bank to proceed
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Bank</Label>
                    <RadioGroup value={selectedBank} onValueChange={setSelectedBank}>
                      <div className="grid gap-2">
                        {popularBanks.map((bank) => (
                          <div
                            key={bank.id}
                            className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                          >
                            <RadioGroupItem value={bank.id} id={bank.id} disabled={isProcessing} />
                            <Label htmlFor={bank.id} className="flex items-center cursor-pointer flex-1">
                              <span className="mr-2">{bank.icon}</span>
                              <span>{bank.name}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      You will be redirected to your bank's secure payment gateway
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 pb-4 border-b">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={appointment.avatar} />
                    <AvatarFallback>
                      <Stethoscope className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{appointment.doctorName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.doctorSpecialization}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      Date
                    </div>
                    <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      Time
                    </div>
                    <p className="font-medium">{appointment.time}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Type
                    </div>
                    <Badge variant="outline">
                      {appointment.type === 'video' ? 'Video Call' : 'Phone Call'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span>₹{appointment.consultationFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span className="text-green-600">₹0</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">₹{appointment.consultationFee}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  className="w-full"
                  size="lg"
                  disabled={isProcessing || (paymentMethod === 'upi' && !upiId.trim()) || (paymentMethod === 'netbanking' && !selectedBank)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <IndianRupee className="w-5 h-5 mr-2" />
                      Pay ₹{appointment.consultationFee}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By proceeding, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
