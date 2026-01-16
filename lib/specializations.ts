export interface Specialization {
  id: string;
  name: string;
}

export const MEDICAL_SPECIALIZATIONS: Specialization[] = [
  { id: 'general', name: 'General Physician' },
  { id: 'pediatrics', name: 'Pediatrician' },
  { id: 'gynecology', name: 'Gynecologist' },
  { id: 'cardiology', name: 'Cardiologist' },
  { id: 'dermatology', name: 'Dermatologist' },
  { id: 'orthopedic', name: 'Orthopedic Surgeon' },
  { id: 'psychiatry', name: 'Psychiatrist' },
  { id: 'ent', name: 'ENT Specialist' },
  { id: 'ophthalmology', name: 'Ophthalmologist' },
  { id: 'gastroenterology', name: 'Gastroenterologist' },
  { id: 'neurology', name: 'Neurologist' },
  { id: 'pulmonology', name: 'Pulmonologist' },
];

export const getSpecializationName = (id: string): string => {
  const spec = MEDICAL_SPECIALIZATIONS.find(s => s.id === id);
  return spec?.name || id;
};
