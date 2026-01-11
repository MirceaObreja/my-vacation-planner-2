
import React, { useState } from 'react';
import { User, ChevronRight, Plus, Users, Loader2, Sparkles, Pencil, Trash2, Check, X } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal.tsx';

interface Props {
  existingUsers: string[];
  onSelectUser: (name: string) => void;
  onRenameUser: (oldName: string, newName: string) => Promise<void>;
  onDeleteUser: (name: string) => Promise<void>;
  isLoading: boolean;
}

const Onboarding: React.FC<Props> = ({ existingUsers, onSelectUser, onRenameUser, onDeleteUser, isLoading }) => {
  const [mode, setMode] = useState<'landing' | 'create'>('landing');
  const [newName, setNewName] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<'rename' | 'delete' | 'load'>('load');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onSelectUser(newName.trim());
    }
  };

  const startEditing = (e: React.MouseEvent, user: string) => {
    e.stopPropagation();
    setEditingUser(user);
    setEditValue(user);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser(null);
  };

  const submitRename = async (e: React.MouseEvent, oldName: string) => {
    e.stopPropagation();
    if (editValue.trim() && editValue !== oldName) {
      setProcessingType('rename');
      setIsProcessing(true);
      await onRenameUser(oldName, editValue.trim());
      setIsProcessing(false);
    }
    setEditingUser(null);
  };

  const openDeleteModal = (e: React.MouseEvent, user: string) => {
    e.stopPropagation();
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      setProcessingType('delete');
      setIsProcessing(true);
      // Wir halten userToDelete für die UI-Referenz kurz fest, bis der Call fertig ist
      await onDeleteUser(userToDelete);
      setIsProcessing(false);
      setUserToDelete(null);
    }
  };

  const getProcessingMessage = () => {
    if (isLoading) return "Lade Freunde...";
    if (processingType === 'delete') return "Wird gelöscht...";
    if (processingType === 'rename') return "Aktualisiere Profil...";
    return "Bitte warten...";
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-400 via-orange-300 to-yellow-200 z-50 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[3rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        
        <header className="text-center mb-8">
          <div className="bg-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
             <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-orange-950 mb-2 leading-tight">Wähle ein Profil</h1>
          <p className="text-orange-800/60 font-medium text-sm px-4">oder erstelle eines, wenn du noch keins hast.</p>
        </header>

        {(isLoading || isProcessing) ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
              {processingType === 'delete' && (
                <Trash2 className="absolute inset-0 m-auto w-5 h-5 text-red-400 animate-pulse" />
              )}
            </div>
            <p className={`font-bold text-lg animate-pulse ${processingType === 'delete' ? 'text-red-500' : 'text-orange-600'}`}>
              {getProcessingMessage()}
            </p>
          </div>
        ) : mode === 'landing' ? (
          <div className="space-y-4">
            <div className="space-y-3 max-h-[40vh] overflow-y-auto no-scrollbar pr-1">
              {existingUsers.length > 0 ? (
                existingUsers.map(user => (
                  <div key={user} className="relative group">
                    <button
                      onClick={() => !editingUser && onSelectUser(user)}
                      className={`w-full flex items-center justify-between bg-white border-2 p-4 rounded-2xl transition-all ${
                        editingUser === user 
                        ? 'border-orange-400 shadow-inner' 
                        : 'border-orange-50 hover:border-orange-300 hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 overflow-hidden">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center font-bold text-orange-600 flex-shrink-0">
                          {user.charAt(0).toUpperCase()}
                        </div>
                        {editingUser === user ? (
                          <input 
                            autoFocus
                            className="bg-orange-50 text-lg font-bold text-orange-900 focus:outline-none w-full border-b-2 border-orange-500 px-1"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-lg font-bold text-orange-900 truncate text-left">{user}</span>
                        )}
                      </div>
                      
                      {editingUser === user ? (
                        <div className="flex items-center gap-2 ml-2">
                          <button onClick={(e) => submitRename(e, user)} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                            <Check size={16} />
                          </button>
                          <button onClick={cancelEditing} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 ml-2">
                          <button 
                            onClick={(e) => startEditing(e, user)}
                            className="p-2 text-orange-300 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                            title="Bearbeiten"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => openDeleteModal(e, user)}
                            className="p-2 text-orange-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Löschen"
                          >
                            <Trash2 size={16} />
                          </button>
                          <ChevronRight className="text-orange-200 ml-1 hidden sm:block" />
                        </div>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 px-4 bg-orange-50 rounded-2xl border-2 border-dashed border-orange-200">
                   <p className="text-orange-400 font-medium text-sm italic">Noch keine Profile. Sei der Erste!</p>
                </div>
              )}
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-orange-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.2em]">
                <span className="bg-white/80 backdrop-blur-sm px-4 text-orange-300">ODER</span>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setMode('create')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-[2rem] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
              >
                <Plus size={24} />
                Neues Profil erstellen
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-300">
             <form onSubmit={handleCreate} className="space-y-6">
              <div className="relative">
                <label className="text-xs font-bold text-orange-400 uppercase tracking-widest ml-4 mb-2 block">Wie heißt du?</label>
                <input 
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. Alex, Sarah..."
                  className="w-full bg-orange-50 border-2 border-orange-100 rounded-2xl px-6 py-5 text-orange-900 focus:outline-none focus:border-orange-400 transition-all font-bold text-xl placeholder:text-orange-200"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  type="submit"
                  disabled={!newName.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-5 rounded-[2rem] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                >
                  Beitreten
                  <ChevronRight size={24} />
                </button>
                <button 
                  type="button"
                  onClick={() => setMode('landing')}
                  className="w-full bg-transparent text-orange-400 font-bold py-3 hover:text-orange-600 transition-colors"
                >
                  Zurück zur Liste
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={!!userToDelete && !isProcessing}
        title="Profil löschen?"
        message={`Möchtest du "${userToDelete}" wirklich löschen? Alle deine Einträge und Verfügbarkeiten werden entfernt.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setUserToDelete(null)}
        confirmText="Unwiderruflich löschen"
      />

      <div className="mt-8 text-center text-orange-900/40 font-bold tracking-widest text-[10px] uppercase flex items-center gap-3">
        <div className="h-[1px] w-8 bg-orange-900/10"></div>
        Urlaubsplaner v1.0.6
        <div className="h-[1px] w-8 bg-orange-900/10"></div>
      </div>
    </div>
  );
};

export default Onboarding;
