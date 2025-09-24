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
  Info
} from 'lucide-react';
import { analyzeMedicine, findMedicineAlternatives, type MedicineInfo, type PharmacyAvailability } from '@/lib/gemini-api';
import { searchMedicineAvailability, checkRealTimeStock, reserveMedicine } from '@/lib/pharmacy-api';
import { useNotification } from '@/contexts/notification-context';

export function MedicineTracker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState<MedicineInfo | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyAvailability[]>([]);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('search');
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Analyze medicine using Gemini AI
      const info = await analyzeMedicine(searchQuery);
      setMedicineInfo(info);
      
      // Search for availability in nearby pharmacies
      const availability = await searchMedicineAvailability(searchQuery);
      setPharmacies(availability);
      
      // Find alternatives
      const alts = await findMedicineAlternatives(searchQuery, ['general']);
      setAlternatives(alts);
      
      setSelectedTab('results');
      showNotification('Medicine information loaded successfully', 'success');
    } catch (error) {
      showNotification('Error searching for medicine. Please try again.', 'error');
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

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search Medicine</TabsTrigger>
          <TabsTrigger value="results">Availability</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Medicine Tracker
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Search for medicines and check real-time availability in nearby pharmacies
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter medicine name (e.g., Paracetamol, Crocin)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </Button>
              </div>

              {medicineInfo && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{medicineInfo.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Generic: {medicineInfo.genericName} | Category: {medicineInfo.category}
                        </p>
                        <p className="text-sm">{medicineInfo.dosage}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {pharmacies.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Search for a medicine to see availability in nearby pharmacies
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Available at {pharmacies.length} pharmacies
                </h3>
                <Badge variant="outline">
                  <MapPin className="w-3 h-3 mr-1" />
                  Near you
                </Badge>
              </div>

              {pharmacies.map((pharmacy) => (
                <Card key={pharmacy.pharmacyId}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Avatar>
                          <AvatarFallback>
                            <Package className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{pharmacy.pharmacyName}</h4>
                            <div className="flex items-center space-x-2">
                              {pharmacy.isOpen ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Open
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Closed
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {pharmacy.distance} km away
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {pharmacy.openingHours}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">{pharmacy.address}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <IndianRupee className="w-4 h-4 mr-1" />
                                <span className="font-semibold">₹{pharmacy.price}</span>
                              </div>
                              <div className="flex items-center">
                                <Package className="w-4 h-4 mr-1" />
                                <span className={pharmacy.stock > 10 ? 'text-green-600' : 'text-orange-600'}>
                                  {pharmacy.stock} in stock
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRefreshStock(pharmacy.pharmacyId)}
                                disabled={isRefreshing === pharmacy.pharmacyId}
                              >
                                {isRefreshing === pharmacy.pharmacyId ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`tel:${pharmacy.phone}`)}
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                Call
                              </Button>
                              
                              <Button
                                size="sm"
                                onClick={() => handleReserveMedicine(pharmacy.pharmacyId, pharmacy.pharmacyName)}
                                disabled={!pharmacy.isOpen || pharmacy.stock === 0}
                              >
                                <Bookmark className="w-3 h-3 mr-1" />
                                Reserve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alternatives" className="space-y-4">
          {alternatives.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Search for a medicine to see alternative options
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Alternative Medicines</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Similar medicines that can treat the same condition
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {alternatives.map((alternative, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{alternative}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery(alternative);
                          setSelectedTab('search');
                        }}
                      >
                        <Search className="w-3 h-3 mr-1" />
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