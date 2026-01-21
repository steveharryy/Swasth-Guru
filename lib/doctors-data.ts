export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  languages: string[];
  availability: boolean;
  rating: number;
  avatar?: string;
  experience: string;
  qualifications: string;
  consultationFee: number;
  about: string;
  availableSlots: string[];
  specialties: string[];
}

export const doctorsData: Doctor[] = [
  {
    id: 1,
    name: 'Dr. Priya Sharma',
    specialization: 'General Physician',
    languages: ['english', 'hindi'],
    availability: true,
    rating: 4.8,
    avatar: '/avatars/doctor-1.jpg',
    experience: '8 years',
    qualifications: 'MBBS, MD (Internal Medicine)',
    consultationFee: 11,
    about: 'Experienced general physician specializing in preventive care, chronic disease management, and family medicine. Committed to providing comprehensive healthcare to rural communities.',
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'],
    specialties: ['Fever', 'Cough', 'Headache', 'Body ache', 'General checkup', 'Diabetes', 'Hypertension']
  },
  {
    id: 2,
    name: 'Dr. Rajesh Kumar',
    specialization: 'Pediatrician',
    languages: ['hindi', 'punjabi'],
    availability: true,
    rating: 4.6,
    avatar: '/avatars/doctor-2.jpg',
    experience: '12 years',
    qualifications: 'MBBS, MD (Pediatrics)',
    consultationFee: 11,
    about: 'Dedicated pediatrician with extensive experience in child healthcare, vaccination, and developmental disorders. Passionate about ensuring healthy growth in children.',
    availableSlots: ['10:00 AM', '11:00 AM', '12:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'],
    specialties: ['Child fever', 'Vaccination', 'Growth issues', 'Respiratory problems', 'Digestive issues', 'Skin problems']
  },
  {
    id: 3,
    name: 'Dr. Ananya Patel',
    specialization: 'Gynecologist',
    languages: ['english', 'hindi'],
    availability: true,
    rating: 4.9,
    avatar: '/avatars/doctor-3.jpg',
    experience: '10 years',
    qualifications: 'MBBS, MS (Obstetrics & Gynecology)',
    consultationFee: 11,
    about: 'Experienced gynecologist specializing in women\'s health, pregnancy care, and reproductive health. Dedicated to providing compassionate care to women of all ages.',
    availableSlots: ['09:00 AM', '10:30 AM', '12:00 PM', '2:30 PM', '4:00 PM'],
    specialties: ['Pregnancy care', 'Menstrual problems', 'PCOS', 'Infertility', 'Menopause', 'Women\'s health']
  },
  {
    id: 4,
    name: 'Dr. Amit Singh',
    specialization: 'Cardiologist',
    languages: ['english', 'hindi'],
    availability: true,
    rating: 4.7,
    avatar: '/avatars/doctor-4.jpg',
    experience: '15 years',
    qualifications: 'MBBS, MD (Cardiology), DM (Cardiology)',
    consultationFee: 11,
    about: 'Senior cardiologist with expertise in heart disease prevention, treatment, and cardiac emergencies. Committed to improving cardiovascular health in rural areas.',
    availableSlots: ['09:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
    specialties: ['Chest pain', 'Heart problems', 'High blood pressure', 'Cholesterol', 'Heart attack prevention', 'Cardiac checkup']
  },
  {
    id: 5,
    name: 'Dr. Sunita Devi',
    specialization: 'Dermatologist',
    languages: ['hindi', 'punjabi'],
    availability: true,
    rating: 4.5,
    avatar: '/avatars/doctor-5.jpg',
    experience: '7 years',
    qualifications: 'MBBS, MD (Dermatology)',
    consultationFee: 11,
    about: 'Skilled dermatologist specializing in skin, hair, and nail disorders. Experienced in treating common skin conditions and cosmetic dermatology.',
    availableSlots: ['10:00 AM', '11:30 AM', '1:00 PM', '3:30 PM', '5:00 PM'],
    specialties: ['Skin rash', 'Acne', 'Hair fall', 'Skin allergies', 'Fungal infections', 'Eczema']
  },
  {
    id: 6,
    name: 'Dr. Vikram Gupta',
    specialization: 'Orthopedic Surgeon',
    languages: ['english', 'hindi'],
    availability: true,
    rating: 4.8,
    avatar: '/avatars/doctor-6.jpg',
    experience: '11 years',
    qualifications: 'MBBS, MS (Orthopedics)',
    consultationFee: 11,
    about: 'Experienced orthopedic surgeon specializing in bone, joint, and muscle disorders. Expert in treating fractures, arthritis, and sports injuries.',
    availableSlots: ['09:30 AM', '11:00 AM', '2:30 PM', '4:30 PM'],
    specialties: ['Joint pain', 'Back pain', 'Fractures', 'Arthritis', 'Sports injuries', 'Bone problems']
  },
  {
    id: 7,
    name: 'Dr. Meera Joshi',
    specialization: 'Psychiatrist',
    languages: ['english', 'hindi'],
    availability: true,
    rating: 4.6,
    avatar: '/avatars/doctor-7.jpg',
    experience: '9 years',
    qualifications: 'MBBS, MD (Psychiatry)',
    consultationFee: 11,
    about: 'Compassionate psychiatrist specializing in mental health disorders, anxiety, depression, and stress management. Dedicated to improving mental wellness.',
    availableSlots: ['10:00 AM', '12:00 PM', '3:00 PM', '5:00 PM'],
    specialties: ['Depression', 'Anxiety', 'Stress', 'Sleep problems', 'Mental health', 'Counseling']
  },
  {
    id: 8,
    name: 'Dr. Ravi Patel',
    specialization: 'ENT Specialist',
    languages: ['english', 'hindi', 'punjabi'],
    availability: true,
    rating: 4.4,
    avatar: '/avatars/doctor-8.jpg',
    experience: '6 years',
    qualifications: 'MBBS, MS (ENT)',
    consultationFee: 11,
    about: 'ENT specialist with expertise in ear, nose, and throat disorders. Experienced in treating hearing problems, sinus issues, and throat infections.',
    availableSlots: ['09:00 AM', '10:30 AM', '12:30 PM', '3:30 PM', '5:30 PM'],
    specialties: ['Ear problems', 'Sore throat', 'Sinus problems', 'Hearing issues', 'Nose bleeding', 'Voice problems']
  },
  {
    id: 9,
    name: 'Dr. Kavita Sharma',
    specialization: 'Ophthalmologist',
    languages: ['hindi', 'punjabi'],
    availability: true,
    rating: 4.7,
    avatar: '/avatars/doctor-9.jpg',
    experience: '8 years',
    qualifications: 'MBBS, MS (Ophthalmology)',
    consultationFee: 11,
    about: 'Eye specialist with expertise in vision problems, eye diseases, and eye surgeries. Committed to preserving and improving vision health.',
    availableSlots: ['09:30 AM', '11:30 AM', '2:00 PM', '4:00 PM'],
    specialties: ['Eye problems', 'Vision issues', 'Eye pain', 'Cataract', 'Glaucoma', 'Eye infections']
  },
  {
    id: 10,
    name: 'Dr. Arjun Malhotra',
    specialization: 'Gastroenterologist',
    languages: ['english', 'hindi'],
    availability: true,
    rating: 4.5,
    avatar: '/avatars/doctor-10.jpg',
    experience: '10 years',
    qualifications: 'MBBS, MD (Gastroenterology)',
    consultationFee: 11,
    about: 'Gastroenterologist specializing in digestive system disorders, liver diseases, and gastrointestinal problems. Expert in endoscopic procedures.',
    availableSlots: ['10:00 AM', '12:00 PM', '3:00 PM', '5:00 PM'],
    specialties: ['Stomach pain', 'Acidity', 'Diarrhea', 'Constipation', 'Liver problems', 'Digestive issues']
  }
];

export const getAvailableDoctors = (language: string, symptoms?: string[]) => {
  let filtered = doctorsData.filter(doctor => 
    doctor.availability && doctor.languages.includes(language)
  );

  if (symptoms && symptoms.length > 0) {
    filtered = filtered.filter(doctor =>
      symptoms.some(symptom =>
        doctor.specialties.some(specialty =>
          specialty.toLowerCase().includes(symptom.toLowerCase()) ||
          symptom.toLowerCase().includes(specialty.toLowerCase())
        )
      )
    );
  }

  return filtered.sort((a, b) => b.rating - a.rating);
};

export const getDoctorById = (id: number) => {
  return doctorsData.find(doctor => doctor.id === id);
};