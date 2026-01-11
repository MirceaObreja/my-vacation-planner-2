
import React, { useMemo } from 'react';
import { Trash2, Heart, Users, Clock, Sparkles, Calendar, CheckCircle2, MapPin, UserCheck } from 'lucide-react';
import { Destination } from '../types.ts';

interface Props {
  destination: Destination;
  currentUserName: string;
  availability: Record<string, string[]>;
  onToggleInterest: () => void;
  onDelete: () => void;
}

const MONTH_MAP: Record<string, number> = {
  "Jan": 0, "Feb": 1, "Mär": 2, "Apr": 3, "Mai": 4, "Jun": 5,
  "Jul": 6, "Aug": 7, "Sep": 8, "Okt": 9, "Nov": 10, "Dez": 11
};

const DestinationCard: React.FC<Props> = ({ destination, currentUserName, availability, onToggleInterest, onDelete }) => {
  const interestedPeople = destination.interestedPeople || [];
  const preferredMonths = destination.preferredMonths || [];
  const destinationYear = destination.year || new Date().getFullYear();
  
  const isInterested = interestedPeople.includes(currentUserName);

  const recommendations = useMemo(() => {
    if (preferredMonths.length === 0) return [];

    const results: Array<{ month: string, start: number, end: number, availableUsers: string[], year: number, matchesUser: boolean }> = [];
    const windowSize = 7;
    const year = destinationYear;

    preferredMonths.forEach(m => {
      const monthIdx = MONTH_MAP[m];
      if (monthIdx === undefined) return;
      
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      let bestMonthScore = -1;
      let bestMonthData: any = null;

      for (let i = 1; i <= daysInMonth - windowSize + 1; i++) {
        let currentScore = 0;
        let maxOverlapOnSingleDay = 0;
        const usersInWindow = new Set<string>();
        
        for (let j = 0; j < windowSize; j++) {
          const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(i + j).padStart(2, '0')}`;
          const dayUsers = availability[dateStr] || [];
          currentScore += dayUsers.length;
          dayUsers.forEach(u => usersInWindow.add(u));
          if (dayUsers.length > maxOverlapOnSingleDay) maxOverlapOnSingleDay = dayUsers.length;
        }
        
        if (maxOverlapOnSingleDay >= 3) {
          const weightedScore = currentScore + (usersInWindow.size * 2);
          if (weightedScore > bestMonthScore) {
            bestMonthScore = weightedScore;
            bestMonthData = {
              month: m,
              start: i,
              end: i + windowSize - 1,
              availableUsers: Array.from(usersInWindow),
              year: year,
              matchesUser: Array.from(usersInWindow).includes(currentUserName)
            };
          }
        }
      }

      if (bestMonthData) {
        results.push(bestMonthData);
      }
    });

    return results;
  }, [availability, preferredMonths, destinationYear, currentUserName]);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-lg border border-orange-50 hover:shadow-xl transition-shadow relative overflow-hidden group flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <div className="pr-8">
          <h3 className="text-xl font-bold text-orange-900 mb-1 leading-tight">{destination.name || "Unbekanntes Ziel"}</h3>
          
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 text-orange-400 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
              <Users size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {interestedPeople.length} Interessierte
              </span>
            </div>
            <div className="flex items-center gap-1 text-blue-400 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
              <Calendar size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {destinationYear}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={onDelete}
          className="absolute top-4 right-4 p-2 text-orange-100 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all z-10"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 text-slate-400 mb-4 px-1">
        <Clock size={12} />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Bevorzugt: {preferredMonths.length > 0 ? preferredMonths.join(', ') : "Kein Zeitraum"}
        </span>
      </div>

      <div className="flex-grow">
        {recommendations.length > 0 ? (
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-1.5 px-1 mb-1">
              <Sparkles size={12} className="text-amber-500" />
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest">Passende Zeitspannen!</p>
            </div>
            {recommendations.map((rec, index) => {
              const personalMatch = rec.matchesUser && isInterested;
              return (
                <div 
                  key={index} 
                  className={`relative border rounded-[1.5rem] p-4 animate-in fade-in zoom-in duration-300 shadow-inner transition-colors ${
                    personalMatch 
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' 
                      : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                  }`}
                >
                  {personalMatch && (
                    <div className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 border border-emerald-400">
                      <UserCheck size={10} />
                      Perfekt für dich!
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${personalMatch ? 'text-emerald-900' : 'text-orange-950'}`}>
                        {rec.month} {rec.start} - {rec.end}, {rec.year}
                      </p>
                      {personalMatch && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className={`text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1 ${
                      personalMatch ? 'text-emerald-800/60' : 'text-amber-800/60'
                    }`}>
                      <CheckCircle2 size={10} /> {rec.availableUsers.length} Personen sind bereit:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {rec.availableUsers.map(u => (
                        <div 
                          key={u} 
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            u === currentUserName 
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm' 
                              : personalMatch 
                                ? 'bg-white/80 text-emerald-700 border-emerald-100'
                                : 'bg-white/80 text-amber-700 border-amber-100'
                          }`}
                        >
                          {u === currentUserName ? 'Du' : u}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mb-5 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warte auf Übereinstimmung</p>
            <p className="text-[9px] text-slate-300">Sobald 3+ Freunde Zeit haben, erscheint hier der beste Termin.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-5 min-h-[1.5rem] px-1">
          {interestedPeople.map((person, idx) => (
            <span 
              key={idx} 
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                person === currentUserName 
                  ? 'bg-orange-500 text-white border-orange-400' 
                  : 'bg-white text-orange-400 border-orange-50'
              }`}
            >
              {person === currentUserName ? 'Du' : person}
            </span>
          ))}
          {interestedPeople.length === 0 && (
            <span className="text-xs text-orange-200 italic">Noch keine Interessenten...</span>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <button 
          onClick={onToggleInterest}
          className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 text-sm ${
            isInterested 
              ? 'bg-orange-50 text-orange-600 border-2 border-orange-100 shadow-inner' 
              : 'bg-orange-500 text-white shadow-lg hover:bg-orange-600 hover:-translate-y-0.5'
          }`}
        >
          <Heart size={18} fill={isInterested ? 'currentColor' : 'none'} />
          {isInterested ? "Bin dabei!" : "Vormerken"}
        </button>
      </div>

      <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
        <MapPin size={100} fill="orange" />
      </div>
    </div>
  );
};

export default DestinationCard;
