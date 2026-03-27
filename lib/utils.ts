import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAppointmentTimeStatus(dateStr: string, timeStr: string): 'early' | 'ready' | 'over' {
  try {
    if (!dateStr || !timeStr) return 'early';
    if (dateStr === 'hackathon') return 'ready';

    // Helper to normalize date to YYYY-MM-DD for constructor
    const normalize = (d: string) => {
      if (d.includes('T')) return d.split('T')[0];
      if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }
      return d;
    };

    const normalizedDate = normalize(dateStr);
    const [year, month, day] = normalizedDate.split('-').map(Number);

    // Parse time (HH:MM AM/PM)
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return 'early';

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const ampm = timeMatch[3].toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const appointmentDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    // Calculate difference in minutes
    // positive means now is after the appointment start
    const diffInMinutes = (now.getTime() - appointmentDate.getTime()) / (1000 * 60);

    if (diffInMinutes < -10) {
      return 'early'; // More than 10 mins before
    } else if (diffInMinutes >= -10 && diffInMinutes <= 40) {
      return 'ready'; // Between -10 and +40 mins
    } else {
      return 'over'; // More than 40 mins after
    }
  } catch (e) {
    console.error("Error parsing appointment time:", e);
    return 'early';
  }
}
