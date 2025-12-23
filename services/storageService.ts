
import { WorkEntry } from '../types';

const STORAGE_KEY = 'worklog_data';
const WAGE_KEY = 'worklog_wage';

export const storageService = {
  getEntries: (): WorkEntry[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveEntry: (entry: WorkEntry): void => {
    const entries = storageService.getEntries();
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    if (existingIndex > -1) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  },

  deleteEntry: (date: string): void => {
    const entries = storageService.getEntries();
    const filtered = entries.filter(e => e.date !== date);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  getEntryByDate: (date: string): WorkEntry | undefined => {
    const entries = storageService.getEntries();
    return entries.find(e => e.date === date);
  },

  getEntriesByMonth: (month: number, year: number): WorkEntry[] => {
    const entries = storageService.getEntries();
    return entries.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }).sort((a, b) => a.date.localeCompare(b.date));
  },

  calculateCumulativeHours: (targetDate: string): number => {
    const entries = storageService.getEntries();
    const target = new Date(targetDate);
    
    return entries
      .filter(e => {
        const entryDate = new Date(e.date);
        return entryDate < target;
      })
      .reduce((sum, e) => sum + e.duration, 0);
  },

  getHourlyWage: (): number => {
    const wage = localStorage.getItem(WAGE_KEY);
    return wage ? parseFloat(wage) : 0;
  },

  saveHourlyWage: (wage: number): void => {
    localStorage.setItem(WAGE_KEY, wage.toString());
  }
};
