
import { WorkEntry, ApiResponse } from '../types';

const STORAGE_KEY = 'worklog_data_v1';
const WAGE_KEY = 'worklog_wage_v1';

// Helper to simulate async behavior for consistency with previous UI flow
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  async fetchEntries(): Promise<WorkEntry[]> {
    await delay(300); // Small delay to maintain UI feel
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async saveEntry(entry: WorkEntry): Promise<boolean> {
    await delay(500);
    const entries = await this.fetchEntries();
    const idx = entries.findIndex(item => item.date === entry.date);
    
    if (idx > -1) {
      entries[idx] = entry;
    } else {
      entries.push(entry);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  },

  async deleteEntry(date: string): Promise<boolean> {
    await delay(300);
    const entries = await this.fetchEntries();
    const filtered = entries.filter(item => item.date !== date);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  async getWage(): Promise<number> {
    const wage = localStorage.getItem(WAGE_KEY);
    return wage ? parseFloat(wage) : 0;
  },

  async saveWage(wage: number): Promise<void> {
    localStorage.setItem(WAGE_KEY, wage.toString());
  }
};
