
export interface WorkEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // In hours
}

export interface User {
  id: string;
  name: string;
  email: string;
  hourlyWage?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MonthSummary {
  totalHours: number;
  entryCount: number;
  projectedEarnings: number;
}
