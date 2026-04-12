'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  MapPin,
  Phone,
  Clock,
  Package,
  IndianRupee,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Navigation,
  Bookmark,
  Info,
  AlertTriangle,
  Camera,
  Upload,
  ImageIcon
} from 'lucide-react';
import { analyzeMedicine, findMedicineAlternatives, isAiAvailable, type MedicineInfo, type PharmacyAvailability, analyzeMedicineImage } from '@/lib/ai-api';

import { searchMedicineAvailability, checkRealTimeStock, reserveMedicine } from '@/lib/pharmacy-api';
import { useNotification } from '@/contexts/notification-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export function MedicineTracker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState<MedicineInfo | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyAvailability[]>([]);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('search');
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const [aiAvailable] = useState(isAiAvailable());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          console.log("User location detected:", location);
        },
        (error) => {
          console.warn("Geolocation denied or failed:", error.message);
          // Default to Nabha coordinates as fallback
          setUserLocation({ lat: 30.3752, lng: 76.1466 });
        }
      );
    }
  }, []);


  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setMedicineInfo(null);
    setAlternatives([]);

    try {
      // 1. Check if Gemini is available
      if (!aiAvailable) {
        showNotification('AI API key not found. Please configure NEXT_PUBLIC_GEMINI_API_KEY in .env.local', 'error');
        setIsSearching(false);
        return;
      }

      // 2. Analyze medicine using OpenAI
      const info = await analyzeMedicine(searchQuery);
      setMedicineInfo(info);

      // 3. Search for availability in nearby pharmacies
      const availability = await searchMedicineAvailability(searchQuery, userLocation || undefined);
      setPharmacies(availability);

      // 4. Find alternatives
      const alts = await findMedicineAlternatives(searchQuery, ['general']);
      setAlternatives(alts);

      setSelectedTab('results');
      showNotification('Medicine information loaded successfully', 'success');
    } catch (error: any) {
      const message = error.message || 'Error searching for medicine. Please try again.';
      showNotification(message, 'error');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefreshStock = async (pharmacyId: string) => {
    setIsRefreshing(pharmacyId);
    try {
      const stockInfo = await checkRealTimeStock(pharmacyId, searchQuery);

      // Update pharmacy stock in the list
      setPharmacies(prev => prev.map(pharmacy =>
        pharmacy.pharmacyId === pharmacyId
          ? { ...pharmacy, ...stockInfo }
          : pharmacy
      ));

      showNotification('Stock information updated', 'success');
    } catch (error) {
      showNotification('Error updating stock information', 'error');
    } finally {
      setIsRefreshing(null);
    }
  };

  const handleReserveMedicine = async (pharmacyId: string, pharmacyName: string) => {
    try {
      const reservation = await reserveMedicine(
        pharmacyId,
        searchQuery,
        1,
        { name: 'Patient', phone: '+91 98765 43210' }
      );

      showNotification(
        `Medicine reserved at ${pharmacyName}. Reservation ID: ${reservation.reservationId}`,
        'success'
      );
    } catch (error) {
      showNotification('Error reserving medicine', 'error');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('Please upload an image file', 'error');
        return;
    }

    setIsAnalyzing(true);
    showNotification('Analyzing medicine image...', 'info');

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = e.target?.result as string;
            const result = await analyzeMedicineImage(base64Image);
            console.log("Medicine Analysis Result:", result);
            
            if (result.medicine_name && result.medicine_name !== 'Unknown') {
                const cleanedName = result.medicine_name.split(' (')[0].split(' tablet')[0].split(' caps')[0].trim();
                setSearchQuery(result.medicine_name);
                
                // 1. Set Detailed Info
                const detailedInfo = {
                    name: result.medicine_name,
                    genericName: result.generic_name || 'Medical Formula',
                    dosage: result.dosage || result.suggestion || 'Consult doctor',
                    manufacturer: result.manufacturer || 'Generic',
                    category: 'AI Vision Analysis',
                    sideEffects: result.side_effects || [],
                    interactions: result.interactions || [],
                    alternatives: []
                };
                setMedicineInfo(detailedInfo);

                showNotification(`Identified: ${result.medicine_name}`, 'success');
                
                // 2. Fetch Availability & Alternatives
                setIsSearching(true);
                try {
                   // Clean name for better search matching
                   const searchKey = cleanedName.split(' ')[0];
                   const availability = await searchMedicineAvailability(searchKey, userLocation || undefined);
                   setPharmacies(availability);
                   
                   const alts = await findMedicineAlternatives(searchKey, ['general']);
                   setAlternatives(alts);
                   
                   // Switch to show both the info and the results
                   setSelectedTab('results');
                } catch (err) {
                   console.error("Search follow-up error:", err);
                } finally {
                   setIsSearching(false);
                }
            } else if (result.error) {


                console.error("Analysis Error:", result.error);
                showNotification(`Analysis failed: ${result.error}`, 'error');
            } else {
                showNotification('Could not identify medicine. Please try searching manually.', 'warning');
            }
        };
        reader.onerror = (error) => {
            console.error("FileReader Error:", error);
            showNotification('Error reading image file', 'error');
        };
        reader.readAsDataURL(file);
    } catch (error: any) {
        console.error("HandleImageUpload Error:", error);
        showNotification(error.message || 'Analysis failed', 'error');
    } finally {
        setIsAnalyzing(false);
    }
  };



  return (
    <div className="space-y-10">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-11 p-1 bg-muted/50 backdrop-blur-sm rounded-xl gap-1 border border-white/5">
          <TabsTrigger value="search" className="rounded-lg text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-muted-foreground/70">दवा खोजें (Search)</TabsTrigger>
          <TabsTrigger value="results" className="rounded-lg text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-muted-foreground/70">उपलब्धता (Stock)</TabsTrigger>
          <TabsTrigger value="alternatives" className="rounded-lg text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-muted-foreground/70">विकल्प (Alternatives)</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6 mt-6">
          <Card className="border shadow-none rounded-2xl p-6 bg-card">
            <CardHeader className="px-0 pt-0 pb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">Medicine Tracker</CardTitle>
                  <p className="text-sm font-medium text-muted-foreground">Search for medicines and check real-time availability</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 space-y-6">
              {!aiAvailable && (
                <Alert variant="destructive" className="bg-destructive/10 border shadow-none rounded-xl p-4 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <div className="ml-3">
                    <AlertTitle className="text-base font-bold mb-0.5">API Key Missing</AlertTitle>
                    <AlertDescription className="text-sm font-medium opacity-90">
                      Medicine analysis is temporarily disabled. Please contact support.
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="दवा का नाम लिखें (e.g., Paracetamol, Crocin)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 pl-12 pr-12 text-base font-medium rounded-xl border bg-muted/30 focus:bg-background transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <input
                      type="file"
                      id="medicine-photo"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isAnalyzing}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                      onClick={() => document.getElementById('medicine-photo')?.click()}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || isAnalyzing || !searchQuery.trim()}
                  variant="premium"
                  className="h-11 px-6 text-base font-bold rounded-xl shrink-0"
                >
                  {isSearching ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-3 text-primary" />
                      खोजें (Search)
                    </>
                  )}
                </Button>
              </div>


              {medicineInfo && (
                <Card className="bg-muted/30 border shadow-none rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-6">
                      <div className="w-12 h-12 bg-background shadow-sm rounded-xl flex items-center justify-center text-primary border">
                        <Info className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-1.5">{medicineInfo.name}</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="secondary" className="px-3 py-0.5 text-[10px] font-bold">Generic: {medicineInfo.genericName}</Badge>
                          <Badge variant="outline" className="px-3 py-0.5 text-[10px] font-bold">Category: {medicineInfo.category}</Badge>
                          {medicineInfo.manufacturer && medicineInfo.manufacturer !== 'Generic' && (
                             <Badge variant="outline" className="px-3 py-0.5 text-[10px] font-bold border-primary/30 text-primary">Mfg: {medicineInfo.manufacturer}</Badge>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-background/50 p-4 rounded-xl border">
                             <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Usage & Dosage</h4>
                             <p className="text-sm font-medium text-foreground leading-relaxed italic">{medicineInfo.dosage}</p>
                          </div>

                          {(medicineInfo.sideEffects?.length > 0 || medicineInfo.interactions?.length > 0) && (
                            <div className="grid grid-cols-2 gap-4">
                               {medicineInfo.sideEffects?.length > 0 && (
                                 <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                                   <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-2">Side Effects</h4>
                                   <ul className="text-xs font-medium text-orange-700/80 list-disc list-inside">
                                      {medicineInfo.sideEffects.slice(0, 3).map((se, i) => <li key={i}>{se}</li>)}
                                   </ul>
                                 </div>
                               )}
                               {medicineInfo.interactions?.length > 0 && (
                                 <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                                   <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-2">Interactions</h4>
                                   <ul className="text-xs font-medium text-red-700/80 list-disc list-inside">
                                      {medicineInfo.interactions.slice(0, 3).map((item, i) => <li key={i}>{item}</li>)}
                                   </ul>
                                 </div>
                               )}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6 mt-6">
          {pharmacies.length === 0 ? (
            <Card className="border shadow-none rounded-2xl p-12 bg-card text-center">
              <CardContent className="p-0 space-y-6">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto border shadow-inner">
                  <Package className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1.5">दवा की उपलब्धता देखें</h3>
                  <p className="text-sm font-medium text-muted-foreground">Search for a medicine to see availability in nearby pharmacies</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold text-foreground tracking-tight">
                  Available at {pharmacies.length} pharmacies
                </h3>
                <Badge variant="outline" className="h-8 px-4 rounded-xl text-xs font-bold bg-primary/5">
                  <MapPin className="w-3.5 h-3.5 mr-2" />
                  Near you
                </Badge>
              </div>

              <div className="grid gap-4">
                {pharmacies.map((pharmacy) => (
                  <Card key={pharmacy.pharmacyId} className="border shadow-none rounded-2xl p-6 bg-card group hover:bg-muted/30 transition-colors">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <Avatar className="w-16 h-16 border rounded-xl">
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            <Package className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-4 text-center md:text-left">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <h4 className="text-xl font-bold text-foreground">{pharmacy.pharmacyName}</h4>
                            <div className="flex items-center justify-center gap-2">
                              {pharmacy.isOpen ? (
                                <Badge variant="secondary" className="h-7 px-3 text-[10px] font-bold bg-green-500/10 text-green-500 border-none">
                                  <CheckCircle className="w-3 h-3 mr-1.5" />
                                  Open
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="h-7 px-3 text-[10px] font-bold bg-red-500/10 text-red-500 border-none">
                                  <AlertCircle className="w-3 h-3 mr-1.5" />
                                  Closed
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm font-medium text-muted-foreground">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-primary" />
                              {pharmacy.distance} km away
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-primary" />
                              {pharmacy.openingHours}
                            </div>
                          </div>

                          <p className="text-sm font-medium text-muted-foreground bg-muted/30 p-4 rounded-xl border">
                            {pharmacy.address}
                          </p>

                          <div className="flex flex-col xl:flex-row items-center justify-between gap-6 pt-4 border-t">
                            <div className="flex items-center gap-8">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mr-3">
                                  <IndianRupee className="w-4 h-4" />
                                </div>
                                <span className="text-2xl font-bold text-foreground">₹{pharmacy.price}</span>
                              </div>
                              <div className="flex items-center">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center mr-3",
                                  pharmacy.stock > 10 ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                                )}>
                                  <Package className="w-4 h-4" />
                                </div>
                                <span className={cn(
                                  "text-lg font-bold",
                                  pharmacy.stock > 10 ? 'text-green-500' : 'text-orange-500'
                                )}>
                                  {pharmacy.stock} in stock
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-xl"
                                onClick={() => handleRefreshStock(pharmacy.pharmacyId)}
                                disabled={isRefreshing === pharmacy.pharmacyId}
                              >
                                <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isRefreshing === pharmacy.pharmacyId && "animate-spin")} />
                              </Button>

                              <Button
                                variant="outline"
                                className="h-10 px-4 text-sm font-bold rounded-xl"
                                onClick={() => window.open(`tel:${pharmacy.phone}`)}
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                Call
                              </Button>

                              <Button
                                variant="premium"
                                className="h-11 px-6 text-sm font-bold rounded-xl shadow-lg"
                                onClick={() => handleReserveMedicine(pharmacy.pharmacyId, pharmacy.pharmacyName)}
                                disabled={!pharmacy.isOpen || pharmacy.stock === 0}
                              >
                                <Bookmark className="w-5 h-5 mr-2 text-primary" />
                                Reserve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="alternatives" className="space-y-6 mt-6">
          {alternatives.length === 0 ? (
            <Card className="border shadow-none rounded-2xl p-12 bg-card text-center">
              <CardContent className="p-0 space-y-6">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto border shadow-inner">
                  <Package className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1.5">विकल्प देखें</h3>
                  <p className="text-sm font-medium text-muted-foreground">Search for a medicine to see alternative options</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border shadow-none rounded-2xl p-6 bg-card">
              <CardHeader className="px-0 pt-0 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">Alternative Medicines</CardTitle>
                    <p className="text-sm font-medium text-muted-foreground tracking-tight">Similar medicines that treat the same condition</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="grid gap-3">
                  {alternatives.map((alternative, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border bg-muted/30 rounded-xl hover:bg-background hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-background shadow-sm rounded-lg flex items-center justify-center text-muted-foreground border">
                          <Package className="w-5 h-5" />
                        </div>
                        <span className="text-base font-bold text-foreground">{alternative}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-xs font-bold rounded-lg border-2"
                        onClick={() => {
                          setSearchQuery(alternative);
                          setSelectedTab('search');
                        }}
                      >
                        <Search className="w-3.5 h-3.5 mr-2" />
                        Search
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
