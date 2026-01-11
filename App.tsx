
import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Calendar as CalendarIcon, 
  MapPin, 
  Send, 
  ChevronDown,
  Clock,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.ts';
import { Destination } from './types.ts';
import Onboarding from './components/Onboarding.tsx';
import DestinationCard from './components/DestinationCard.tsx';
import Calendar from './components/Calendar.tsx';
import GlobalOverview from './components/GlobalOverview.tsx';
import ConfirmationModal from './components/ConfirmationModal.tsx';

const ALL_MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const AVAILABLE_YEARS = [new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2];
const STORAGE_KEY = 'vacation_planner_user_name';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(localStorage.getItem(STORAGE_KEY));
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [newDestination, setNewDestination] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(AVAILABLE_YEARS[0]);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'calendar' | 'destinations' | 'overview'>('calendar');
  
  // Modal State
  const [destinationToDelete, setDestinationToDelete] = useState<Destination | null>(null);

  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (configured) {
      const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        const usersList = snapshot.docs.map(doc => doc.id);
        setAllUsers(usersList);
        setIsLoadingUsers(false);
      });
      return () => unsubUsers();
    } else {
      setIsLoadingUsers(false);
      setAllUsers(["Demo Max", "Demo Sarah"]);
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      const savedDestinations = localStorage.getItem('demo_destinations');
      const savedAvailability = localStorage.getItem('demo_availability');
      if (savedDestinations) setDestinations(JSON.parse(savedDestinations));
      if (savedAvailability) setAvailability(JSON.parse(savedAvailability));
      return;
    }

    try {
      const q = query(collection(db, "destinations"), orderBy("createdAt", "desc"));
      const unsubDest = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Destination));
        setDestinations(docs);
      });

      const unsubAvail = onSnapshot(collection(db, "availability"), (snapshot) => {
        const data: Record<string, string[]> = {};
        snapshot.docs.forEach(doc => {
          data[doc.id] = doc.data().users || [];
        });
        setAvailability(data);
      });

      return () => {
        unsubDest();
        unsubAvail();
      };
    } catch (e) {
      console.error("Firebase setup failed:", e);
    }
  }, [configured]);

  const handleSetUserName = async (name: string) => {
    setUserName(name);
    localStorage.setItem(STORAGE_KEY, name);
    if (configured && !allUsers.includes(name)) {
      await setDoc(doc(db, "users", name), { createdAt: Date.now() });
    }
  };

  const handleRenameUser = async (oldName: string, newName: string) => {
    if (oldName === newName) return;
    
    if (configured) {
      await setDoc(doc(db, "users", newName), { createdAt: Date.now() });
      await deleteDoc(doc(db, "users", oldName));

      const destSnapshot = await getDocs(collection(db, "destinations"));
      for (const destDoc of destSnapshot.docs) {
        const data = destDoc.data();
        if (data.interestedPeople && data.interestedPeople.includes(oldName)) {
          const newList = data.interestedPeople.map((p: string) => p === oldName ? newName : p);
          await updateDoc(doc(db, "destinations", destDoc.id), { interestedPeople: newList });
        }
      }

      const availSnapshot = await getDocs(collection(db, "availability"));
      for (const availDoc of availSnapshot.docs) {
        const data = availDoc.data();
        if (data.users && data.users.includes(oldName)) {
          const newList = data.users.map((u: string) => u === oldName ? newName : u);
          await updateDoc(doc(db, "availability", availDoc.id), { users: newList });
        }
      }
    } else {
      const localDest = destinations.map(d => ({
        ...d,
        interestedPeople: d.interestedPeople.map(p => p === oldName ? newName : p)
      }));
      setDestinations(localDest);
      localStorage.setItem('demo_destinations', JSON.stringify(localDest));

      const localAvail: Record<string, string[]> = {};
      Object.keys(availability).forEach(date => {
        localAvail[date] = availability[date].map(u => u === oldName ? newName : u);
      });
      setAvailability(localAvail);
      localStorage.setItem('demo_availability', JSON.stringify(localAvail));
    }

    if (userName === oldName) {
      setUserName(newName);
      localStorage.setItem(STORAGE_KEY, newName);
    }
  };

  const handleDeleteUser = async (name: string) => {
    if (configured) {
      await deleteDoc(doc(db, "users", name));
      
      const destSnapshot = await getDocs(collection(db, "destinations"));
      for (const destDoc of destSnapshot.docs) {
        await updateDoc(doc(db, "destinations", destDoc.id), { interestedPeople: arrayRemove(name) });
      }

      const availSnapshot = await getDocs(collection(db, "availability"));
      for (const availDoc of availSnapshot.docs) {
        await updateDoc(doc(db, "availability", availDoc.id), { users: arrayRemove(name) });
      }
    } else {
      const localDest = destinations.map(d => ({
        ...d,
        interestedPeople: d.interestedPeople.filter(p => p !== name)
      }));
      setDestinations(localDest);
      localStorage.setItem('demo_destinations', JSON.stringify(localDest));

      const localAvail: Record<string, string[]> = {};
      Object.keys(availability).forEach(date => {
        localAvail[date] = availability[date].filter(u => u !== name);
      });
      setAvailability(localAvail);
      localStorage.setItem('demo_availability', JSON.stringify(localAvail));
    }

    if (userName === name) {
      logout();
    }
  };

  const logout = () => {
    setUserName(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
    if (showValidationError) setShowValidationError(false);
  };

  const addDestination = async () => {
    if (!newDestination.trim()) return;
    
    if (selectedMonths.length === 0) {
      setShowValidationError(true);
      setShowMonthPicker(true);
      return;
    }

    const destName = newDestination.trim();
    const id = Math.random().toString(36).substr(2, 9);
    
    const newDestData = {
      name: destName,
      interestedPeople: [],
      createdAt: Date.now(),
      preferredMonths: selectedMonths,
      year: selectedYear
    };

    if (configured) {
      await setDoc(doc(db, "destinations", id), newDestData);
    } else {
      const newList = [{ id, ...newDestData }, ...destinations];
      setDestinations(newList);
      localStorage.setItem('demo_destinations', JSON.stringify(newList));
    }
    setNewDestination('');
    setSelectedMonths([]);
    setShowMonthPicker(false);
    setShowValidationError(false);
  };

  const confirmDeleteDestination = async () => {
    if (!destinationToDelete) return;
    const id = destinationToDelete.id;
    
    if (configured) {
      await deleteDoc(doc(db, "destinations", id));
    } else {
      const newList = destinations.filter(d => d.id !== id);
      setDestinations(newList);
      localStorage.setItem('demo_destinations', JSON.stringify(newList));
    }
    setDestinationToDelete(null);
  };

  const toggleInterest = async (destId: string) => {
    if (!userName) return;
    const dest = destinations.find(d => d.id === destId);
    if (!dest) return;
    const isInterested = dest.interestedPeople.includes(userName);

    if (configured) {
      await updateDoc(doc(db, "destinations", destId), {
        interestedPeople: isInterested ? arrayRemove(userName) : arrayUnion(userName)
      });
    } else {
      const newList = destinations.map(d => d.id === destId ? {
        ...d, interestedPeople: isInterested ? d.interestedPeople.filter(p => p !== userName) : [...d.interestedPeople, userName]
      } : d);
      setDestinations(newList);
      localStorage.setItem('demo_destinations', JSON.stringify(newList));
    }
  };

  const toggleAvailability = async (dateStr: string) => {
    if (!userName) return;
    const currentUsers = availability[dateStr] || [];
    const hasUser = currentUsers.includes(userName);

    if (configured) {
      await setDoc(doc(db, "availability", dateStr), {
        users: hasUser ? arrayRemove(userName) : arrayUnion(userName)
      }, { merge: true });
    } else {
      const newAvail = {
        ...availability,
        [dateStr]: hasUser ? currentUsers.filter(u => u !== userName) : [...currentUsers, userName]
      };
      setAvailability(newAvail);
      localStorage.setItem('demo_availability', JSON.stringify(newAvail));
    }
  };

  const isFormValid = newDestination.trim().length > 0 && selectedMonths.length > 0;

  if (!userName) {
    return (
      <Onboarding 
        existingUsers={allUsers} 
        onSelectUser={handleSetUserName} 
        onRenameUser={handleRenameUser}
        onDeleteUser={handleDeleteUser}
        isLoading={isLoadingUsers}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col pb-20 px-4 md:px-8 pt-4 md:pt-6 animate-in fade-in duration-500">
      <header className="mb-6 text-center relative max-w-2xl mx-auto w-full">
        <div className="absolute right-0 top-0 flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-orange-100 rounded-2xl px-3 py-2 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left mr-2">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter leading-none mb-0.5">Eingeloggt</p>
              <p className="text-xs font-bold text-orange-950 truncate max-w-[80px] leading-none">{userName}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 text-orange-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Abmelden / Benutzer wechseln"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div className="flex justify-center mb-2">
          <div className="bg-orange-400 p-3 rounded-2xl shadow-lg rotate-3">
            <Sun className="text-white w-8 h-8" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-orange-900 tracking-tight mb-1 text-center">Urlaubsplaner</h1>
        <p className="text-orange-900/70 font-medium px-6 text-sm leading-snug max-w-md mx-auto">
          Finde die perfekten Reise-Termine mit deinen Freunden!
        </p>
      </header>

      <div className="flex gap-1.5 mb-4 bg-orange-100/50 p-1 rounded-2xl max-w-lg mx-auto w-full">
        <button 
          onClick={() => setActiveTab('calendar')} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all font-bold text-[9px] uppercase ${activeTab === 'calendar' ? 'bg-white text-orange-600 shadow-md' : 'text-orange-400'}`}
        >
          <CalendarIcon size={14} />
          Kalender
        </button>
        <button 
          onClick={() => setActiveTab('destinations')} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all font-bold text-[9px] uppercase ${activeTab === 'destinations' ? 'bg-white text-orange-600 shadow-md' : 'text-orange-400'}`}
        >
          <MapPin size={14} />
          Orte
        </button>
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all font-bold text-[9px] uppercase ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-md' : 'text-orange-400'}`}
        >
          <BarChart3 size={14} />
          Trends
        </button>
      </div>

      <main className="flex-1 w-full">
        {activeTab === 'calendar' && (
          <div className="max-w-xl mx-auto bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-orange-50 animate-in fade-in zoom-in duration-300">
            <Calendar availability={availability} onToggleDate={toggleAvailability} currentUserName={userName || ''} />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
             <GlobalOverview availability={availability} currentUserName={userName || ''} />
          </div>
        )}

        {activeTab === 'destinations' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="max-w-2xl mx-auto w-full">
              <div className={`bg-white rounded-[2rem] shadow-xl overflow-hidden border transition-colors ${showValidationError ? 'border-red-300 ring-2 ring-red-100' : 'border-orange-50'}`}>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newDestination} 
                    onChange={(e) => setNewDestination(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && addDestination()} 
                    placeholder="Ziel vorschlagen..." 
                    className="w-full bg-white px-6 py-4 focus:outline-none text-lg placeholder:text-orange-200 font-medium" 
                  />
                  <button 
                    onClick={addDestination} 
                    disabled={!newDestination.trim()}
                    className={`absolute right-3 top-3 bottom-3 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center ${isFormValid ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'}`}
                  >
                    <Send size={20} />
                  </button>
                </div>
                
                <div className="px-6 pb-4">
                  <button 
                    onClick={() => setShowMonthPicker(!showMonthPicker)}
                    className={`flex items-center justify-between w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      selectedMonths.length === 0 
                        ? (showValidationError ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-orange-50 text-orange-600 hover:bg-orange-100') 
                        : 'bg-green-50 text-green-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {selectedMonths.length === 0 ? "Zeitraum wählen" : `${selectedYear}: ${selectedMonths.join(', ')}`}
                    </div>
                    <ChevronDown size={14} className={`transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showMonthPicker && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-orange-400 uppercase tracking-widest block px-1">Jahr</label>
                        <div className="flex gap-2">
                          {AVAILABLE_YEARS.map(y => (
                            <button
                              key={y}
                              onClick={() => setSelectedYear(y)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                selectedYear === y 
                                  ? 'bg-orange-500 text-white shadow-md' 
                                  : 'bg-white text-orange-400 border border-orange-100 shadow-sm'
                              }`}
                            >
                              {y}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-orange-400 uppercase tracking-widest block px-1">Monate</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {ALL_MONTHS.map(m => (
                            <button
                              key={m}
                              onClick={() => toggleMonth(m)}
                              className={`py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${
                                selectedMonths.includes(m)
                                  ? 'bg-orange-500 text-white shadow-sm'
                                  : 'bg-white text-orange-300 border border-orange-50'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {destinations.map(dest => (
                  <DestinationCard 
                    key={dest.id} 
                    destination={dest} 
                    currentUserName={userName || ''} 
                    availability={availability}
                    onToggleInterest={() => toggleInterest(dest.id)} 
                    onDelete={() => setDestinationToDelete(dest)} 
                  />
                ))}
              </div>
              
              {destinations.length === 0 && (
                <div className="max-w-md mx-auto text-center py-16 px-8 border-4 border-dashed border-orange-100 rounded-[2.5rem] bg-white/40">
                  <MapPin className="mx-auto text-orange-200 w-12 h-12 mb-4" />
                  <p className="text-orange-900 text-lg font-bold mb-1">Die Welt wartet!</p>
                  <p className="text-orange-400 text-xs">Tragt oben eure ersten Ziele ein.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ConfirmationModal 
        isOpen={!!destinationToDelete}
        title="Ziel löschen?"
        message={`Möchtest du "${destinationToDelete?.name}" wirklich aus der Liste entfernen?`}
        onConfirm={confirmDeleteDestination}
        onCancel={() => setDestinationToDelete(null)}
      />

      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-100/50 to-transparent pointer-events-none md:hidden"></div>
    </div>
  );
};

export default App;
