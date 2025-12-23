
import React, { useState, useEffect, useMemo } from 'react';
import Calendar from './components/Calendar';
import { apiService } from './services/apiService';
import { WorkEntry, User } from './types';
import { getWorkInsights } from './services/geminiService';

type ViewType = 'tracker' | 'summary';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('Logging your hours locally...');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<ViewType>('tracker');
  const [hourlyWage, setHourlyWage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');

  // Load Initial Data from Local Storage
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const [fetchedEntries, fetchedWage] = await Promise.all([
        apiService.fetchEntries(),
        apiService.getWage()
      ]);
      setEntries(fetchedEntries);
      setHourlyWage(fetchedWage);
      const insight = await getWorkInsights(fetchedEntries);
      setAiInsight(insight);
      setIsLoading(false);
    };
    if (isLoggedIn) initData();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Sync inputs with selected date
  useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const existing = entries.find(e => e.date === dateStr);
    if (existing) {
      setStartTime(existing.startTime);
      setEndTime(existing.endTime);
    } else {
      setStartTime('09:00');
      setEndTime('17:00');
    }
  }, [selectedDate, entries]);

  const dailyDuration = useMemo(() => {
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    const startMins = h1 * 60 + m1;
    const endMins = h2 * 60 + m2;
    const diff = endMins - startMins;
    return diff > 0 ? diff / 60 : 0;
  }, [startTime, endTime]);

  const monthlyEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [viewDate, entries]);

  const totalMonthlyHours = useMemo(() => {
    return monthlyEntries.reduce((sum, e) => sum + e.duration, 0);
  }, [monthlyEntries]);

  const totalMonthlyEarnings = useMemo(() => totalMonthlyHours * hourlyWage, [totalMonthlyHours, hourlyWage]);

  const entryMap = useMemo(() => {
    const map: { [key: string]: boolean } = {};
    entries.forEach(e => { map[e.date] = true; });
    return map;
  }, [entries]);

  const handleSave = async () => {
    setIsSyncing(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const newEntry: WorkEntry = {
      date: dateStr,
      startTime,
      endTime,
      duration: dailyDuration
    };
    await apiService.saveEntry(newEntry);
    const updated = await apiService.fetchEntries();
    setEntries(updated);
    setIsSyncing(false);
    getWorkInsights(updated).then(setAiInsight);
  };

  const handleDelete = async (date: string) => {
    if (confirm('Delete this entry permanently?')) {
      setIsSyncing(true);
      await apiService.deleteEntry(date);
      const updated = await apiService.fetchEntries();
      setEntries(updated);
      setIsSyncing(false);
    }
  };

  const handleEdit = (entry: WorkEntry) => {
    setSelectedDate(new Date(entry.date));
    setCurrentView('tracker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (months: number, years: number) => {
    const newDate = new Date(viewDate.getFullYear() + years, viewDate.getMonth() + months, 1);
    setViewDate(newDate);
  };

  const handleWageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    setHourlyWage(val);
    await apiService.saveWage(val);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-indigo-600 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-2xl">
              <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">WorkLog Pro</h1>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Personal Workspace</p>
          <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); setUser({ id: '1', name: 'User Name', email: 'user@example.com' }); }} className="space-y-4">
            <input type="email" placeholder="Email Address" defaultValue="user@example.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            <input type="password" placeholder="Password" defaultValue="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-6 pt-8 pb-4 relative overflow-hidden">
        {isSyncing && <div className="absolute bottom-0 left-0 h-1 bg-emerald-400 animate-pulse w-full"></div>}
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-indigo-200 text-[10px] uppercase tracking-widest font-black flex items-center">
              Offline Workspace
              {isSyncing && <span className="ml-2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>}
            </p>
            <h1 className="text-xl font-black">Welcome Back</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
              {isDarkMode ? <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>}
            </button>
            <button onClick={() => setIsLoggedIn(false)} className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Workspace...</p>
        </div>
      ) : currentView === 'tracker' ? (
        <>
          <section className="sticky top-0 z-20">
            <Calendar viewDate={viewDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} onNavigate={handleNavigate} entries={entryMap} />
          </section>

          <main className="flex-1 p-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </span>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                {isSyncing && <span className="text-[10px] text-emerald-500 font-black animate-pulse">SAVING...</span>}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3.5 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3.5 font-bold" />
                </div>
              </div>

              <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4 flex justify-between items-center mb-6">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Today</p>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{dailyDuration.toFixed(1)}h</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Month Running</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{(totalMonthlyHours + (entryMap[selectedDate.toISOString().split('T')[0]] ? 0 : dailyDuration)).toFixed(1)}h</p>
                </div>
              </div>

              <button onClick={handleSave} disabled={isSyncing} className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 uppercase tracking-widest text-sm disabled:opacity-50">
                {isSyncing ? 'Saving locally...' : 'Save Work Record'}
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 dark:from-indigo-900 dark:to-slate-900 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden border border-indigo-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="flex items-center mb-3 relative z-10">
                <div className="bg-white/20 p-2 rounded-xl mr-3 backdrop-blur-md">
                  <svg className="w-5 h-5 text-indigo-100" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">AI Productivity Engine</span>
              </div>
              <p className="text-sm font-semibold leading-relaxed italic relative z-10 text-indigo-50">"{aiInsight}"</p>
            </div>
          </main>
        </>
      ) : (
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Monthly Earnings</h2>
            <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
               <button onClick={() => handleNavigate(-1, 0)} className="p-1">&larr;</button>
               <span className="text-[10px] font-black uppercase mx-2 w-24 text-center">{viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
               <button onClick={() => handleNavigate(1, 0)} className="p-1">&rarr;</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hours Logged</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalMonthlyHours.toFixed(1)}h</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rate / Hour</p>
              <div className="flex items-center">
                <span className="text-slate-400 font-bold">$</span>
                <input type="number" value={hourlyWage} onChange={handleWageChange} className="w-full bg-transparent text-2xl font-black focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-500 dark:bg-emerald-600 p-6 rounded-3xl shadow-xl text-white">
            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-1">Projected Monthly Pay</p>
            <p className="text-4xl font-black">${totalMonthlyEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span>Avg Earnings / Day</span>
              <span>${(totalMonthlyEarnings / (monthlyEntries.length || 1)).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Work Records (Local)</h3>
            {monthlyEntries.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-medium">No records found for this month</p>
              </div>
            ) : (
              monthlyEntries.map(entry => (
                <div key={entry.date} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mr-4 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                      {new Date(entry.date).getDate()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{entry.startTime} &mdash; {entry.endTime}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{entry.duration.toFixed(1)} hrs &bull; ${(entry.duration * hourlyWage).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(entry)} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                    <button onClick={() => handleDelete(entry.date)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 p-2 pb-6 z-30 shadow-2xl">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <button onClick={() => setCurrentView('tracker')} className={`flex flex-col items-center p-2 rounded-2xl transition-all ${currentView === 'tracker' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Time Logs</span>
          </button>
          <div className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800"></div>
          <button onClick={() => setCurrentView('summary')} className={`flex flex-col items-center p-2 rounded-2xl transition-all ${currentView === 'summary' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.67 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.407-2.67-1M12 17V7m0 10c-3.313 0-6-2.687-6-6s2.687-6 6-6 6 2.687 6 6-2.687 6-6 6z" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Earnings</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
