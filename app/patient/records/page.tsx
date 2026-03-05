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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  ArrowLeft,
  Search,
  FileText,
  Download,
  Calendar,
  User,
  Stethoscope,
  Pill,
  Activity,
  Heart,
  Upload,
  Eye,
  Filter
} from 'lucide-react';

interface MedicalRecord {
  id: string;
  date: string;
  type: 'consultation' | 'prescription' | 'lab-report' | 'vaccination' | 'surgery';
  title: string;
  description: string;
  doctor: string;
  hospital?: string;
  attachments?: string[];
  status: 'completed' | 'pending' | 'scheduled';
}

export default function PatientRecordsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const isAuthenticated = !!user;
  const isDoctor = user?.unsafeMetadata?.role === 'doctor';
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      router.push('/');
      return;
    }

    if (user) {
      const storedRecords = JSON.parse(localStorage.getItem(`medical_records_${user.id}`) || '[]');
      setMedicalRecords(storedRecords);
    }
  }, [isAuthenticated, isDoctor, router, user]);


  const filterRecords = (type?: string) => {
    let filtered = medicalRecords;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.doctor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (type && type !== 'all') {
      filtered = filtered.filter(record => record.type === type);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <Stethoscope className="w-4 h-4" />;
      case 'prescription': return <Pill className="w-4 h-4" />;
      case 'lab-report': return <Activity className="w-4 h-4" />;
      case 'vaccination': return <Heart className="w-4 h-4" />;
      case 'surgery': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getRecordColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-primary/10 text-primary';
      case 'prescription': return 'bg-secondary/10 text-secondary';
      case 'lab-report': return 'bg-accent/10 text-accent';
      case 'vaccination': return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
      case 'surgery': return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'scheduled': return 'outline';
      default: return 'default';
    }
  };

  const handleDownload = (attachment: string) => {
    // In a real app, this would download the file
    console.log('Downloading:', attachment);
  };

  const handleUpload = () => {
    // In a real app, this would open file upload dialog
    console.log('Upload new record');
  };

  if (!isAuthenticated || !user || isDoctor) {
    return null;
  }

  const recordCounts = {
    all: medicalRecords.length,
    consultation: medicalRecords.filter(r => r.type === 'consultation').length,
    prescription: medicalRecords.filter(r => r.type === 'prescription').length,
    'lab-report': medicalRecords.filter(r => r.type === 'lab-report').length,
    vaccination: medicalRecords.filter(r => r.type === 'vaccination').length
  };

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
                onClick={() => router.push('/patient/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">{t('medicalRecords')}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleUpload} className="h-9">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-20 max-w-4xl">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search medical records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border rounded-xl bg-muted/20 shadow-none"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-foreground">
          <Card className="shadow-none border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-primary">{recordCounts.all}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Records</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-secondary">{recordCounts.consultation}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Consultations</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-accent">{recordCounts['lab-report']}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lab Reports</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-green-600">{recordCounts.prescription}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Prescriptions</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-9 p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="all" className="text-[10px] sm:text-xs font-bold rounded-md">All</TabsTrigger>
            <TabsTrigger value="consultation" className="text-[10px] sm:text-xs font-bold rounded-md uppercase">Visits</TabsTrigger>
            <TabsTrigger value="lab-report" className="text-[10px] sm:text-xs font-bold rounded-md uppercase">Lab</TabsTrigger>
            <TabsTrigger value="prescription" className="text-[10px] sm:text-xs font-bold rounded-md uppercase">Meds</TabsTrigger>
            <TabsTrigger value="vaccination" className="text-[10px] sm:text-xs font-bold rounded-md uppercase">Vax</TabsTrigger>
          </TabsList>

          {['all', 'consultation', 'lab-report', 'prescription', 'vaccination'].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              {filterRecords(tabValue === 'all' ? undefined : tabValue).map((record) => (
                <Card key={record.id} className="shadow-none border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl shrink-0 ${getRecordColor(record.type)} border border-current/10`}>
                        {getRecordIcon(record.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <h3 className="font-bold text-foreground truncate">{record.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(record.status)} className="text-[10px] font-bold h-5 px-2">
                              {record.status}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {new Date(record.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{record.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                          <div className="flex items-center">
                            <User className="w-3.5 h-3.5 mr-1.5 text-primary" />
                            {record.doctor}
                          </div>
                          {record.hospital && (
                            <div className="flex items-center">
                              <Stethoscope className="w-3.5 h-3.5 mr-1.5 text-primary" />
                              {record.hospital}
                            </div>
                          )}
                        </div>
                        {record.attachments && record.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {record.attachments.map((attachment, index) => (
                              <Button
                                key={index}
                                variant="secondary"
                                size="sm"
                                onClick={() => handleDownload(attachment)}
                                className="h-7 text-[10px] font-bold"
                              >
                                <Download className="w-3 h-3 mr-1.5" />
                                {attachment}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filterRecords(tabValue === 'all' ? undefined : tabValue).length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No medical records found</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}