'use client';

import { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
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
  Filter,
  Loader2,
  Trash2
} from 'lucide-react';

interface MedicalRecord {
  id: string;
  date: string;
  category: 'visits' | 'labs' | 'meds' | 'vax';
  title: string;
  description: string;
  file_url: string;
  file_name: string;
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/records/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setMedicalRecords(data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && (!isAuthenticated || isDoctor)) {
      router.push('/');
      return;
    }

    if (user) {
      fetchRecords();
    }
  }, [isAuthenticated, isDoctor, isLoaded, router, user]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadCategory || !uploadTitle) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const fileBase64 = await base64Promise;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${apiUrl}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user?.id,
          category: uploadCategory,
          title: uploadTitle,
          description: uploadDescription,
          fileName: selectedFile.name,
          fileBase64
        })
      });

      if (res.ok) {
        toast.success('Record uploaded successfully');
        setIsUploadOpen(false);
        resetUploadForm();
        fetchRecords();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload record');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadCategory('');
    setUploadTitle('');
    setUploadDescription('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/records/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Record deleted');
        fetchRecords();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete record');
    }
  };

  const filterRecords = (tabValue: string) => {
    let filtered = medicalRecords;

    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (tabValue && tabValue !== 'all') {
      const tabToCategory: any = {
        'consultation': 'visits',
        'lab-report': 'labs',
        'prescription': 'meds',
        'vaccination': 'vax'
      };
      const category = tabToCategory[tabValue];
      filtered = filtered.filter(record => record.category === category);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getRecordIcon = (category: string) => {
    switch (category) {
      case 'visits': return <Stethoscope className="w-4 h-4" />;
      case 'meds': return <Pill className="w-4 h-4" />;
      case 'labs': return <Activity className="w-4 h-4" />;
      case 'vax': return <Heart className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getRecordColor = (category: string) => {
    switch (category) {
      case 'visits': return 'bg-primary/10 text-primary border-primary/20';
      case 'meds': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'labs': return 'bg-accent/10 text-accent border-accent/20';
      case 'vax': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300 border-green-200';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-background flex items-center justify-center font-bold">Loading...</div>;
  if (!isAuthenticated || !user || isDoctor) return null;

  const recordCounts = {
    all: medicalRecords.length,
    visits: medicalRecords.filter(r => r.category === 'visits').length,
    labs: medicalRecords.filter(r => r.category === 'labs').length,
    meds: medicalRecords.filter(r => r.category === 'meds').length,
    vax: medicalRecords.filter(r => r.category === 'vax').length
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
              <h1 className="text-xl font-bold">Medical Records</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setIsUploadOpen(true)} 
                className="h-9 font-bold bg-primary text-black hover:bg-primary/90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New
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
              className="pl-10 h-10 border rounded-xl bg-muted/10 font-medium"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-none border bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-primary">{recordCounts.all}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Records</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-secondary">{recordCounts.visits}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Visits</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-accent">{recordCounts.labs}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lab Reports</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-green-600">{recordCounts.meds + recordCounts.vax}</div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Others</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-11 p-1 bg-muted/30 rounded-xl border">
            <TabsTrigger value="all" className="text-xs font-black uppercase rounded-lg">All</TabsTrigger>
            <TabsTrigger value="consultation" className="text-xs font-black uppercase rounded-lg">Visits</TabsTrigger>
            <TabsTrigger value="lab-report" className="text-xs font-black uppercase rounded-lg">Labs</TabsTrigger>
            <TabsTrigger value="prescription" className="text-xs font-black uppercase rounded-lg">Meds</TabsTrigger>
            <TabsTrigger value="vaccination" className="text-xs font-black uppercase rounded-lg">Vax</TabsTrigger>
          </TabsList>

          {['all', 'consultation', 'lab-report', 'prescription', 'vaccination'].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4 pt-2">
              {isLoading ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="font-bold">Loading your records...</p>
                </div>
              ) : (
                <>
                  {filterRecords(tabValue).map((record) => (
                    <Card key={record.id} className="shadow-md hover:shadow-lg transition-all border border-primary/5 hover:border-primary/20 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-stretch">
                          <div className={`w-1.5 ${getRecordColor(record.category).split(' ')[1]}`} />
                          <div className="flex-1 p-5">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-2xl shrink-0 ${getRecordColor(record.category)} border border-current/10 shadow-sm`}>
                                {getRecordIcon(record.category)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                  <h3 className="font-black text-lg text-foreground truncate">{record.title}</h3>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest h-6 px-3 rounded-full bg-muted">
                                      {record.category}
                                    </Badge>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                      {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 font-medium">{record.description}</p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(record.file_url, '_blank')}
                                      className="h-8 text-[11px] font-black uppercase tracking-wider rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                                    >
                                      <Eye className="w-3.5 h-3.5 mr-2" />
                                      View Document
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = record.file_url;
                                        link.download = record.file_name;
                                        link.click();
                                      }}
                                      className="h-8 text-[11px] font-black uppercase tracking-wider rounded-lg"
                                    >
                                      <Download className="w-3.5 h-3.5 mr-2" />
                                      Download
                                    </Button>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDeleteRecord(record.id)}
                                    className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/5"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filterRecords(tabValue).length === 0 && (
                    <div className="py-20 text-center opacity-50">
                      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-black text-muted-foreground uppercase tracking-widest">No records found</p>
                      <p className="text-sm text-muted-foreground mt-2">Upload your first document to get started</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary/10 p-6 border-b border-primary/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-primary flex items-center gap-3">
                <Upload className="w-6 h-6" />
                Upload Medical Record
              </DialogTitle>
              <DialogDescription className="font-bold text-muted-foreground/80">
                Store your prescriptions, lab reports, and more securely.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleFileUpload} className="p-6 space-y-6 bg-card">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Document Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="e.g. Blood Test Report, Dental Checkup"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="rounded-xl border-muted-foreground/20 font-bold focus:ring-primary shadow-none"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category <span className="text-destructive">*</span></Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory} required>
                  <SelectTrigger className="rounded-xl border-muted-foreground/20 font-bold shadow-none">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-muted-foreground/20 font-bold">
                    <SelectItem value="visits" className="font-bold">Visits / Consultations</SelectItem>
                    <SelectItem value="labs" className="font-bold">Lab Reports</SelectItem>
                    <SelectItem value="meds" className="font-bold">Medications / Prescriptions</SelectItem>
                    <SelectItem value="vax" className="font-bold">Vaccinations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notes / Description</Label>
                <Textarea
                  id="description"
                  placeholder="Any extra details about this record..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="rounded-xl border-muted-foreground/20 font-bold min-h-[100px] shadow-none"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">File <span className="text-destructive">*</span></Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    selectedFile ? 'bg-primary/5 border-primary/50' : 'bg-muted/5 border-muted-foreground/20 hover:border-primary/40'
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-10 h-10 text-primary" />
                      <p className="font-black text-sm truncate max-w-[300px]">{selectedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="mt-2 text-destructive font-bold h-7">Remove</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-muted rounded-full">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="font-black text-sm">Click to choose or drag & drop</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">PDF, PNG, JPG (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('File too large (max 5MB)');
                          return;
                        }
                        setSelectedFile(file);
                      }
                    }}
                    accept=".pdf,image/*"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)} className="rounded-xl font-bold flex-1 h-12">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading} 
                className="rounded-xl font-black uppercase tracking-widest flex-1 h-12 shadow-lg shadow-primary/20 bg-primary text-black hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Confirm Upload'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}