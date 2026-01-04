
import React from 'react';
import { X } from 'lucide-react';

interface Viewer {
  id: string;
  name: string;
  avatar: string;
  role: string;
  time?: string;
}

interface ViewersModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewers: Viewer[];
  onViewProfile: (userId: string) => void;
  title?: string;
}

const ViewersModal: React.FC<ViewersModalProps> = ({ isOpen, onClose, viewers, onViewProfile, title = "Profile Viewers" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="font-bold text-lg text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-2 overflow-y-auto">
            {viewers.length > 0 ? viewers.map((viewer) => (
                <div 
                    key={viewer.id} 
                    onClick={() => {
                        onViewProfile(viewer.id);
                        onClose();
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                    <img src={viewer.avatar} alt={viewer.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <p className="font-bold text-slate-900 text-sm truncate hover:text-primary-600 hover:underline">{viewer.name}</p>
                            {viewer.time && (
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{viewer.time}</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium capitalize">{viewer.role}</p>
                    </div>
                </div>
            )) : (
                <div className="p-8 text-center text-slate-500 text-sm italic">
                    No users found.
                </div>
            )}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
            <button onClick={onClose} className="text-slate-600 font-bold text-sm hover:bg-slate-200 px-6 py-2 rounded-lg transition-colors">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ViewersModal;
