
import React, { useMemo } from 'react';
/* Added missing Users import from lucide-react */
import { Sparkles, Calendar, TrendingUp, UserCheck, CalendarDays, Users } from 'lucide-react';

interface Props {
  availability: Record<string, string[]>;
  currentUserName: string;
}

const MONTH_NAMES = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

const GlobalOverview: React.FC<Props> = ({ availability, currentUserName }) => {
  const currentYear = new Date().getFullYear();

  // Find best windows across all months
  const allWindows = useMemo(() => {
    const windows: Array<{ start: string, end: string, score: number, users: string[], month: string, year: number }> = [];
    const windowSize = 7;
    const years = [currentYear, currentYear + 1];

    years.forEach(year => {
      for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
        
        for (let i = 1; i <= daysInMonth - windowSize + 1; i++) {
          let score = 0;
          const usersInWindow = new Set<string>();
          let maxOverlap = 0;

          for (let j = 0; j < windowSize; j++) {
            const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(i + j).padStart(2, '0')}`;
            const dayUsers = availability[dateStr] || [];
            score += dayUsers.length;
            dayUsers.forEach(u => usersInWindow.add(u));
            if (dayUsers.length > maxOverlap) maxOverlap = dayUsers.length;
          }

          if (maxOverlap >= 3) {
            windows.push({
              start: `${i}.`,
              end: `${i + windowSize - 1}.`,
              score: score + (usersInWindow.size * 5), // Reward both volume and diversity
              users: Array.from(usersInWindow),
              month: MONTH_NAMES[monthIdx],
              year: year
            });
          }
        }
      }
    });

    return windows
      .sort((a, b) => b.score - a.score)
      .slice(0, 6); // Top 6 matches
  }, [availability, currentYear]);

  const monthSummary = useMemo(() => {
    const summary: Record<string, { days: number, maxUsers: number }> = {};
    
    Object.entries(availability).forEach(([date, users]) => {
      if (users.length === 0) return;
      const [year, month] = date.split('-');
      const key = `${year}-${month}`;
      if (!summary[key]) summary[key] = { days: 0, maxUsers: 0 };
      summary[key].days += 1;
      summary[key].maxUsers = Math.max(summary[key].maxUsers, users.length);
    });

    return Object.entries(summary)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [availability]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Top Recommendations Section */}
      <section className="lg:col-span-7 space-y-6">
        <div className="flex items-center gap-2 mb-4 px-2">
          <TrendingUp className="text-blue-500 w-6 h-6" />
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest">Top Reisefenster</h2>
        </div>

        {allWindows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allWindows.map((win, idx) => {
              const matchesYou = win.users.includes(currentUserName);
              return (
                <div key={idx} className={`relative bg-white p-5 rounded-[2rem] shadow-lg border-2 transition-all hover:-translate-y-1 ${matchesYou ? 'border-blue-200' : 'border-white'}`}>
                  {matchesYou && (
                    <div className="absolute -top-3 -right-3 bg-blue-500 text-white p-2 rounded-2xl shadow-xl ring-4 ring-white">
                      <UserCheck size={18} />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${matchesYou ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400'}`}>
                        <Calendar size={18} />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{win.month} {win.year}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 px-3 py-1.5 bg-slate-50 rounded-xl uppercase tracking-tighter">{win.start} - {win.end}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {win.users.map(u => (
                      <span key={u} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${u === currentUserName ? 'bg-blue-500 text-white border-blue-400 shadow-sm' : 'bg-white text-slate-500 border-slate-100'}`}>
                        {u === currentUserName ? 'Du' : u}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[3rem] text-center border-4 border-dashed border-slate-100">
            <Sparkles className="mx-auto text-slate-200 w-12 h-12 mb-4" />
            <p className="text-slate-400 font-bold mb-1">Noch keine Gruppen-Treffer</p>
            <p className="text-slate-300 text-xs">Sammelt mehr Verfügbarkeiten, um die besten Termine zu finden!</p>
          </div>
        )}

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-[3rem] shadow-2xl text-white mt-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Gemeinsame Power</p>
              <h3 className="text-2xl font-bold">Fast geschafft!</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Sparkles className="text-white w-6 h-6" />
            </div>
          </div>
          <p className="text-sm leading-relaxed opacity-90">
            In {monthSummary.length} verschiedenen Monaten gibt es bereits Potenzial. 
            Stimmt euch in der <strong>Orte</strong>-Sektion weiter ab!
          </p>
        </div>
      </section>

      {/* Heatmap Section */}
      <section className="lg:col-span-5 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-50 p-2.5 rounded-2xl">
            <CalendarDays className="text-blue-500 w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Jahres-Trend</h2>
        </div>

        <div className="space-y-8">
          {monthSummary.length > 0 ? monthSummary.map(([key, data]) => {
            const [year, month] = key.split('-');
            const monthName = MONTH_NAMES[parseInt(month) - 1];
            
            return (
              <div key={key} className="flex items-center gap-6">
                <div className="w-20 flex-shrink-0">
                  <p className="text-xs font-bold text-slate-800 uppercase leading-none mb-1">{monthName}</p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{year}</p>
                </div>
                
                <div className="flex-1 h-4 bg-slate-50 rounded-full relative overflow-hidden group">
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 shadow-inner ${
                      data.maxUsers >= 4 ? 'bg-blue-500' : 
                      data.maxUsers >= 3 ? 'bg-blue-400' : 
                      'bg-blue-200'
                    }`} 
                    style={{ width: `${(data.days / 31) * 100}%` }}
                  ></div>
                </div>

                <div className="flex items-center gap-1.5 min-w-[3.5rem] justify-end">
                   <Users size={12} className="text-slate-300" />
                   <span className="text-xs font-black text-slate-900">{data.maxUsers}</span>
                </div>
              </div>
            );
          }) : (
             <div className="py-16 text-center">
               <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.3em]">Keine Daten vorhanden</p>
             </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
           <span>Wenig Plan</span>
           <div className="flex gap-1.5">
             <div className="w-3 h-3 rounded-full bg-blue-100"></div>
             <div className="w-3 h-3 rounded-full bg-blue-300"></div>
             <div className="w-3 h-3 rounded-full bg-blue-500"></div>
           </div>
           <span>Top Match</span>
        </div>
      </section>
    </div>
  );
};

export default GlobalOverview;
