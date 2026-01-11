
import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<Props> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Löschen", 
  cancelText = "Abbrechen" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-orange-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="bg-red-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-500 w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-bold text-orange-950 mb-2">{title}</h3>
          <p className="text-orange-900/60 text-sm leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="w-full bg-orange-50 hover:bg-orange-100 text-orange-900 font-bold py-4 rounded-2xl transition-all active:scale-95"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
