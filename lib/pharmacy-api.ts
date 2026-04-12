import { PharmacyAvailability } from './ai-api';

// Mock pharmacy data - In production, this would connect to real pharmacy APIs
const mockPharmacies: (PharmacyAvailability & { lat: number; lng: number })[] = [
  {
    pharmacyId: '1',
    pharmacyName: 'MedPlus Pharmacy',
    address: 'Main Market, Sector 15, Chandigarh',
    lat: 30.7583,
    lng: 76.7841,
    distance: 0.8,
    price: 45,
    stock: 25,
    lastUpdated: new Date().toISOString(),
    phone: '+91 98765 43210',
    isOpen: true,
    openingHours: '8:00 AM - 10:00 PM'
  },
  {
    pharmacyId: '2',
    pharmacyName: 'Apollo Pharmacy',
    address: 'SCO 123, Phase 3B2, Mohali',
    lat: 30.7046,
    lng: 76.7179,
    distance: 1.2,
    price: 42,
    stock: 15,
    lastUpdated: new Date().toISOString(),
    phone: '+91 87654 32109',
    isOpen: true,
    openingHours: '24 Hours'
  },
  {
    pharmacyId: '3',
    pharmacyName: 'Local Medical Store',
    address: 'Village Rampur, Near Gurudwara',
    lat: 30.6864,
    lng: 76.8123,
    distance: 2.1,
    price: 38,
    stock: 8,
    lastUpdated: new Date().toISOString(),
    phone: '+91 76543 21098',
    isOpen: true,
    openingHours: '7:00 AM - 9:00 PM'
  },
  {
    pharmacyId: '4',
    pharmacyName: 'HealthKart Pharmacy',
    address: 'Mall Road, Patiala',
    lat: 30.3400,
    lng: 76.3800,
    distance: 3.5,
    price: 50,
    stock: 0,
    lastUpdated: new Date().toISOString(),
    phone: '+91 65432 10987',
    isOpen: false,
    openingHours: '9:00 AM - 8:00 PM'
  },
  {
    pharmacyId: '5',
    pharmacyName: 'Bansal Medical Store',
    address: 'Cinema Road, Nabha, Punjab',
    lat: 30.3752,
    lng: 76.1466,
    distance: 0.6,
    price: 40,
    stock: 18,
    lastUpdated: new Date().toISOString(),
    phone: '+91 98140 11223',
    isOpen: true,
    openingHours: '9:00 AM - 9:00 PM'
  },
  {
    pharmacyId: '6',
    pharmacyName: 'Singla Pharmacy',
    address: 'Patiala Gate, Nabha',
    lat: 30.3725,
    lng: 76.1488,
    distance: 1.1,
    price: 47,
    stock: 12,
    lastUpdated: new Date().toISOString(),
    phone: '+91 98722 33445',
    isOpen: true,
    openingHours: '8:00 AM - 10:00 PM'
  },
  {
    pharmacyId: '7',
    pharmacyName: 'Jain Medical Hall',
    address: 'Station Road, Nabha',
    lat: 30.3780,
    lng: 76.1520,
    distance: 1.9,
    price: 39,
    stock: 20,
    lastUpdated: new Date().toISOString(),
    phone: '+91 98555 66778',
    isOpen: true,
    openingHours: '7:30 AM - 9:30 PM'
  },
  {
    pharmacyId: '8',
    pharmacyName: 'Sharma Chemist',
    address: 'Circular Road, Near Bus Stand, Nabha',
    lat: 30.3700,
    lng: 76.1400,
    distance: 2.4,
    price: 44,
    stock: 10,
    lastUpdated: new Date().toISOString(),
    phone: '+91 98880 77889',
    isOpen: false,
    openingHours: '9:00 AM - 8:30 PM'
  },
  {
    pharmacyId: '9',
    pharmacyName: 'Verma Medicos',
    address: 'Nehru Market, Nabha',
    lat: 30.3740,
    lng: 76.1550,
    distance: 2.9,
    price: 41,
    stock: 22,
    lastUpdated: new Date().toISOString(),
    phone: '+91 99155 88990',
    isOpen: true,
    openingHours: '8:00 AM - 9:00 PM'
  },
  {
    pharmacyId: '10',
    pharmacyName: 'Gupta Pharmacy',
    address: 'Hospital Road, Nabha',
    lat: 30.3795,
    lng: 76.1422,
    distance: 3.2,
    price: 43,
    stock: 14,
    lastUpdated: new Date().toISOString(),
    phone: '+91 98033 11224',
    isOpen: true,
    openingHours: '24 Hours'
  },
  {
    pharmacyId: '11',
    pharmacyName: 'City Life Pharmacy',
    address: 'Railway Road, Nabha',
    lat: 30.3820,
    lng: 76.1500,
    distance: 3.7,
    price: 46,
    stock: 9,
    lastUpdated: new Date().toISOString(),
    phone: '+91 97222 33446',
    isOpen: false,
    openingHours: '9:00 AM - 7:00 PM'
  }
];

// Helper to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function searchMedicineAvailability(
  medicineName: string,
  userLocation?: { lat: number; lng: number }
): Promise<PharmacyAvailability[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // 1. Calculate real distances if location is provided
  const updatedPharmacies = mockPharmacies.map(pharmacy => {
    if (userLocation) {
      const realDistance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        pharmacy.lat,
        pharmacy.lng
      );
      return { ...pharmacy, distance: parseFloat(realDistance.toFixed(1)) };
    }
    return pharmacy;
  });

  // 2. Filter pharmacies that have the medicine in stock (simulated)
  const availablePharmacies = updatedPharmacies.filter(pharmacy => {
    // Simulate random availability for demo, but ensure at least some are available
    const hasStock = pharmacy.stock > 0;
    return hasStock;
  });

  // 3. Sort by distance (asc) and status (open first)
  return availablePharmacies.sort((a, b) => {
    if (a.isOpen && !b.isOpen) return -1;
    if (!a.isOpen && b.isOpen) return 1;
    return a.distance - b.distance;
  });
}

export async function checkRealTimeStock(
  pharmacyId: string,
  medicineName: string
): Promise<{ stock: number; price: number; lastUpdated: string }> {
  // Simulate real-time stock check
  await new Promise(resolve => setTimeout(resolve, 500));

  const pharmacy = mockPharmacies.find(p => p.pharmacyId === pharmacyId);
  if (!pharmacy) {
    throw new Error('Pharmacy not found');
  }

  // Simulate stock fluctuation
  const stockVariation = Math.floor(Math.random() * 10) - 5;
  const newStock = Math.max(0, pharmacy.stock + stockVariation);

  return {
    stock: newStock,
    price: pharmacy.price + Math.floor(Math.random() * 10) - 5,
    lastUpdated: new Date().toISOString()
  };
}

export async function reserveMedicine(
  pharmacyId: string,
  medicineName: string,
  quantity: number,
  patientInfo: { name: string; phone: string }
): Promise<{ reservationId: string; expiresAt: string }> {
  // Simulate reservation
  await new Promise(resolve => setTimeout(resolve, 800));

  const reservationId = `RES${Date.now()}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

  return { reservationId, expiresAt };
}
