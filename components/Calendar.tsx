
import React, { useState, useMemo } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  availability: Record<string, string[]>;
  onToggleDate: (date: string) => void;
  currentUserName: string;
}

const Calendar: React.FC<Props> = ({ availability, onToggleDate, currentUserName }) => {
  const [viewDate, setViewDate] = useState(new Date()); 

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  
  const monthName = viewDate.toLocaleString('de-DE', { month: 'long' });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const getDateString = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentYear, currentMonth + offset, 1);
    setViewDate(newDate);
  };

  const recommendation = useMemo(() => {
    let maxScore = -1;
    let bestStartDay = 1;
    const windowSize = 7;

    if (daysInMonth < windowSize) return null;

    for (let i = 1; i <= daysInMonth - windowSize + 1; i++) {
      let currentScore = 0;
      let maxOverlapInWindow = 0;
      
      for (let j = 0; j < windowSize; j++) {
        const dateStr = getDateString(i + j);
        const count = (availability[dateStr] || []).length;
        currentScore += count;
        if (count > maxOverlapInWindow) maxOverlapInWindow = count;
      }

      if (maxOverlapInWindow > 2) {
        if (currentScore > maxScore) {
          maxScore = currentScore;
          bestStartDay = i;
        }
      }
    }

    if (maxScore <= 0) return null;

    return {
      start: bestStartDay,
      end: bestStartDay + windowSize - 1,
      score: maxScore
    };
  }, [availability, viewDate, daysInMonth]);

  const getHeatmapClass = (count: number, isActive: boolean) => {
    if (isActive) return 'bg-orange-500 border-orange-400 text-white shadow-inner';
    if (count === 0) return 'bg-orange-50 border-white text-orange-900 hover:border-orange-200';
    if (count === 1) return 'bg-green-100 border-green-200 text-green-900';
    if (count === 2) return 'bg-green-200 border-green-300 text-green-900';
    if (count === 3) return 'bg-green-300 border-green-400 text-green-950';
    return 'bg-green-500 border-green-600 text-white';
  };

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-xl">
            <CalendarIcon className="text-orange-600 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-orange-950">{monthName}</h2>
            <p className="text-xs font-bold text-orange-400 tracking-widest uppercase">{currentYear}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-3 rounded-2xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => changeMonth(1)}
            className="p-3 rounded-2xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {recommendation && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="bg-amber-400 p-2 rounded-xl shadow-sm">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Empfehlung für {monthName}</p>
            <p className="text-sm text-amber-900 font-medium">
              Bester Zeitraum: <span className="font-bold underline">{monthName.slice(0,3)} {recommendation.start} - {recommendation.end}</span>
            </p>
          </div>
        </div>
      )}

      {!recommendation && (
        <div className="mb-6 bg-orange-50/50 border border-orange-100 p-4 rounded-2xl text-center">
           <p className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">Warten auf mehr Verfügbarkeiten...</p>
           <p className="text-[10px] text-orange-300">Empfehlungen erscheinen, sobald mind. 3 Personen im gleichen Zeitraum können.</p>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(wd => (
          <div key={wd} className="text-center text-[10px] font-bold text-orange-300 uppercase tracking-widest py-2">
            {wd}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`offset-${i}`} className="aspect-square opacity-20 bg-gray-50 rounded-xl" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = getDateString(day);
          const users = availability[dateStr] || [];
          const isActive = users.includes(currentUserName);
          const isRecommended = recommendation && day >= recommendation.start && day <= recommendation.end;

          return (
            <div key={day} className="relative group">
              <button
                onClick={() => onToggleDate(dateStr)}
                className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all border-2 relative ${
                  getHeatmapClass(users.length, isActive)
                } ${isRecommended && !isActive ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
              >
                <span className="text-sm font-bold">{day}</span>
                {users.length > 0 && !isActive && (
                  <span className="text-[10px] opacity-70 font-medium">{users.length}</span>
                )}
                {isRecommended && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                )}
              </button>
              
              {users.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max min-w-[100px] max-w-[150px] bg-gray-900 text-white text-[10px] p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-2xl scale-95 group-hover:scale-100 origin-bottom">
                  <p className="font-bold mb-1 border-b border-white/20 pb-1">Verfügbar ({users.length}):</p>
                  <div className="flex flex-col gap-0.5">
                    {users.map((u, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-green-400"></div>
                        {u} {u === currentUserName ? '(Du)' : ''}
                      </span>
                    ))}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-orange-100 bg-white/30 -mx-6 px-6 rounded-b-3xl">
        <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          Heatmap Legende
        </h4>
        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-orange-500 shadow-sm"></div>
            <span className="text-[11px] text-orange-900 font-medium">Deine Auswahl</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-green-100 border border-green-200"></div>
            <span className="text-[11px] text-orange-900 font-medium">1 Person frei</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-green-300 border border-green-400"></div>
            <span className="text-[11px] text-orange-900 font-medium">3 Personen frei</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-green-500 border border-green-600"></div>
            <span className="text-[11px] text-orange-900 font-medium">4+ Personen frei</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
