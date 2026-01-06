
import React, { useState, useRef, useEffect } from 'react';
import { User, Group } from '../types';
import { X, Search, Check, Users, Save, Image as ImageIcon, Link as LinkIcon, Upload, Plus } from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  onSave: (group: Group) => void;
  existingGroup?: Group | null;
}

const CohortModal: React.FC<GroupModalProps> = ({ isOpen, onClose, currentUser, allUsers, onSave, existingGroup }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  
  // Image State
  const [image, setImage] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(existingGroup?.name || '');
      setDescription(existingGroup?.description || '');
      setSelectedMemberIds(existingGroup?.memberIds || []);
      setImage(existingGroup?.image || '');
      setShowUrlInput(false);
    }
  }, [isOpen, existingGroup]);

  if (!isOpen) return null;

  // Logic: Get only connected users (mutual follow) and exclude institutes
  const connections = allUsers.filter(u => 
    u.id !== currentUser.id &&
    u.role !== 'institute' &&
    currentUser.following?.includes(u.id) &&
    currentUser.followers?.includes(u.id)
  );

  const displayUsers = connections.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter(id => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
          if (event.target?.result) {
              setImage(event.target.result as string);
              setShowUrlInput(false);
          }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
        alert("Please enter a group name.");
        return;
    }

    const group: Group = {
        id: existingGroup?.id || `grp-${Date.now()}`,
        creatorId: currentUser.id,
        name,
        description,
        image: image || undefined,
        memberIds: selectedMemberIds,
        createdAt: existingGroup?.createdAt || new Date().toDateString()
    };

    onSave(group);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <Users size={24} className="text-primary-600" /> 
              {existingGroup ? 'Edit Group' : 'Create New Group'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                    {/* Left: Image Uploader */}
                    <div className="w-full md:w-1/3 space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Group Image</label>
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-primary-400 bg-slate-50 transition-colors group">
                            {image ? (
                                <>
                                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-white text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-slate-100"
                                        >
                                            <Upload size={14} /> Change
                                        </button>
                                        <button 
                                            onClick={() => { setImage(''); setShowUrlInput(true); }}
                                            className="bg-white text-red-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-red-50"
                                        >
                                            <X size={14} /> Remove
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                    {showUrlInput ? (
                                        <div className="w-full">
                                            <input 
                                                type="text" 
                                                className="w-full text-xs border border-slate-300 rounded p-1 mb-2 text-slate-900 outline-none focus:border-primary-500"
                                                placeholder="Paste Image URL"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setImage(e.currentTarget.value);
                                                        setShowUrlInput(false);
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    if(e.target.value) setImage(e.target.value);
                                                    setShowUrlInput(false);
                                                }}
                                            />
                                            <button onClick={() => setShowUrlInput(false)} className="text-xs text-slate-500 hover:underline">Cancel</button>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon className="text-slate-300 mb-2" size={32} />
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-xs font-bold text-primary-600 hover:underline bg-primary-50 px-2 py-1 rounded"
                                                >
                                                    Upload
                                                </button>
                                                <span className="text-xs text-slate-400 self-center">or</span>
                                                <button 
                                                    onClick={() => setShowUrlInput(true)}
                                                    className="text-xs font-bold text-slate-500 hover:underline bg-slate-200 px-2 py-1 rounded"
                                                >
                                                    URL
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>

                    {/* Right: Info Fields */}
                    <div className="w-full md:w-2/3 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                placeholder="e.g. React Study Group"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                            <textarea 
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
                                placeholder="What is this group for?"
                                rows={4}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Members Section */}
                <div className="border-t border-slate-100 pt-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">Members</span>
                            <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                {selectedMemberIds.length}
                            </span>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Search connections..." 
                                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-primary-500 bg-white focus:bg-white transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 h-48 overflow-y-auto">
                        {displayUsers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {displayUsers.map(user => {
                                    const isSelected = selectedMemberIds.includes(user.id);
                                    return (
                                        <div 
                                            key={user.id} 
                                            onClick={() => toggleUser(user.id)}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${isSelected ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' : 'bg-white border-transparent hover:border-slate-200'}`}
                                        >
                                            <div className="relative">
                                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover bg-slate-200" />
                                                {isSelected && (
                                                    <div className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-0.5 border border-white">
                                                        <Check size={8} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-xs font-bold truncate ${isSelected ? 'text-primary-700' : 'text-slate-700'}`}>{user.name}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{user.handle}</p>
                                            </div>
                                            {!isSelected && <Plus size={14} className="text-slate-300" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Users size={32} className="mb-2 opacity-50" />
                                <p className="text-sm font-medium">No people found</p>
                                <p className="text-xs">Try searching for a different name</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button onClick={onClose} className="text-slate-600 px-5 py-2.5 text-sm font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
            <button 
                onClick={handleSave}
                className="bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
            >
                <Save size={18} />
                {existingGroup ? 'Update Group' : 'Create Group'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CohortModal;
