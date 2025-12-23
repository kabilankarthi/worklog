
import React, { useState } from 'react';

interface CalendarProps {
  viewDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onNavigate: (months: number, years: number) => void;
  entries: { [key: string]: boolean };
}

const Calendar: React.FC<CalendarProps> = ({ viewDate, selectedDate, onSelectDate, onNavigate, entries }) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }

  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const hasEntry = (date: Date | null) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return !!entries[dateStr];
  };

  const handleMonthJump = (targetMonth: number) => {
    const diff = targetMonth - month;
    onNavigate(diff, 0);
    setIsMonthPickerOpen(false);
  };

  const handleYearJump = (targetYear: number) => {
    const diff = targetYear - year;
    onNavigate(0, diff);
    setIsYearPickerOpen(false);
  };

  return (
    <div className="relative p-4 bg-white dark:bg-slate-900 rounded-b-3xl shadow-lg border-b border-slate-100 dark:border-slate-800 transition-colors">
      
      {/* Selection Backdrop */}
      {(isMonthPickerOpen || isYearPickerOpen) && (
        <div 
          className="absolute inset-0 z-40 bg-slate-900/10 dark:bg-black/40 backdrop-blur-[2px] rounded-b-3xl"
          onClick={() => { setIsMonthPickerOpen(false); setIsYearPickerOpen(false); }}
        />
      )}

      {/* Month Picker Overlay */}
      {isMonthPickerOpen && (
        <div className="absolute inset-x-4 top-20 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 animate-in fade-in zoom-in duration-200">
          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((name, idx) => (
              <button
                key={name}
                onClick={() => handleMonthJump(idx)}
                className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  month === idx 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {name.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Year Picker Overlay */}
      {isYearPickerOpen && (
        <div className="absolute inset-x-4 top-10 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 animate-in fade-in zoom-in duration-200">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, i) => year - 5 + i).map((y) => (
              <button
                key={y}
                onClick={() => handleYearJump(y)}
                className={`py-3 rounded-xl text-sm font-black transition-all ${
                  year === y 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex flex-col space-y-2 mb-4">
        {/* Year Navigation */}
        <div className="flex items-center justify-between px-2">
           <button 
            onClick={() => onNavigate(0, -1)}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <button 
            onClick={() => { setIsYearPickerOpen(!isYearPickerOpen); setIsMonthPickerOpen(false); }}
            className={`px-4 py-1 rounded-full transition-colors ${isYearPickerOpen ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-700'}`}
          >
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center">
              {year}
              <svg className={`ml-1 w-3 h-3 transition-transform ${isYearPickerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </h2>
          </button>

          <button 
            onClick={() => onNavigate(0, 1)}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigate(-1, 0)}
            className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <button 
            onClick={() => { setIsMonthPickerOpen(!isMonthPickerOpen); setIsYearPickerOpen(false); }}
            className={`text-center flex-1 px-4 py-2 rounded-2xl transition-all ${isMonthPickerOpen ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-100 dark:ring-indigo-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center justify-center">
              {monthNames[month]}
              <svg className={`ml-2 w-5 h-5 text-indigo-400 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </h1>
          </button>

          <button 
            onClick={() => onNavigate(1, 0)}
            className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, idx) => (
          <div key={idx} className="text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="h-11 w-11" />;
          
          const selected = isSelected(date);
          const today = isToday(date);
          const entered = hasEntry(date);

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(date)}
              className={`
                relative h-11 w-11 flex items-center justify-center rounded-2xl transition-all duration-200
                ${selected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                ${today && !selected ? 'border-2 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-black' : ''}
              `}
            >
              <span className="text-sm z-10 font-bold">{date.getDate()}</span>
              {entered && !selected && (
                <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full border border-white dark:border-slate-900"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
