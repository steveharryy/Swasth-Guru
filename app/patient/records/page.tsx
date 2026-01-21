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
  const { user, isAuthenticated, isDoctor } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    if (!isAuthenticated || isDoctor) {
      router.push('/');
    }
  }, [isAuthenticated, isDoctor, router]);

  // Mock medical records data
  const medicalRecords: MedicalRecord[] = [
    {
      id: '1',
      date: '2024-01-20',
      type: 'consultation',
      title: 'General Checkup',
      description: 'Regular health checkup. Patient reported feeling well. Blood pressure slightly elevated.',
      doctor: 'Dr. Priya Sharma',
      hospital: 'SwasthGuru Clinic',
      attachments: ['consultation-report-20240120.pdf'],
      status: 'completed'
    },
    {
      id: '2',
      date: '2024-01-18',
      type: 'lab-report',
      title: 'Blood Test Results',
      description: 'Complete Blood Count, Lipid Profile, and Diabetes Panel',
      doctor: 'Dr. Priya Sharma',
      hospital: 'City Lab',
      attachments: ['blood-test-20240118.pdf', 'lipid-profile-20240118.pdf'],
      status: 'completed'
    },
    {
      id: '3',
      date: '2024-01-15',
      type: 'prescription',
      title: 'Medication for Hypertension',
      description: 'Prescribed medication for blood pressure management',
      doctor: 'Dr. Priya Sharma',
      hospital: 'SwasthGuru Clinic',
      attachments: ['prescription-20240115.pdf'],
      status: 'completed'
    },
    {
      id: '4',
      date: '2024-01-10',
      type: 'vaccination',
      title: 'Annual Flu Vaccination',
      description: 'Seasonal influenza vaccine administered',
      doctor: 'Dr. Rajesh Kumar',
      hospital: 'Community Health Center',
      status: 'completed'
    },
    {
      id: '5',
      date: '2023-12-20',
      type: 'consultation',
      title: 'Follow-up Consultation',
      description: 'Follow-up for previous health concerns. Patient showing improvement.',
      doctor: 'Dr. Priya Sharma',
      hospital: 'SwasthGuru Clinic',
      attachments: ['followup-20231220.pdf'],
      status: 'completed'
    },
    {
      id: '6',
      date: '2024-01-25',
      type: 'lab-report',
      title: 'X-Ray Chest',
      description: 'Chest X-ray for respiratory symptoms',
      doctor: 'Dr. Ananya Patel',
      hospital: 'City Diagnostic Center',
      status: 'scheduled'
    }
  ];

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
              <h1 className="text-xl font-bold">{t('medicalRecords')}</h1>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
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
              placeholder="Search medical records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{recordCounts.all}</div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">{recordCounts.consultation}</div>
              <div className="text-sm text-muted-foreground">Consultations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{recordCounts['lab-report']}</div>
              <div className="text-sm text-muted-foreground">Lab Reports</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{recordCounts.prescription}</div>
              <div className="text-sm text-muted-foreground">Prescriptions</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="consultation">Consultations</TabsTrigger>
            <TabsTrigger value="lab-report">Lab Reports</TabsTrigger>
            <TabsTrigger value="prescription">Prescriptions</TabsTrigger>
            <TabsTrigger value="vaccination">Vaccinations</TabsTrigger>
          </TabsList>

          {['all', 'consultation', 'lab-report', 'prescription', 'vaccination'].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              {filterRecords(tabValue === 'all' ? undefined : tabValue).map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${getRecordColor(record.type)}`}>
                          {getRecordIcon(record.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium truncate">{record.title}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant={getStatusColor(record.status)}>
                                {record.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(record.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{record.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {record.doctor}
                            </div>
                            {record.hospital && (
                              <div className="flex items-center">
                                <Stethoscope className="w-3 h-3 mr-1" />
                                {record.hospital}
                              </div>
                            )}
                          </div>
                          {record.attachments && record.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {record.attachments.map((attachment, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(attachment)}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  {attachment}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
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