
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { X, Save, Image as ImageIcon, Link as LinkIcon, Upload, User as UserIcon, GraduationCap, DollarSign, Tag, Plus, Clock, Trash2, Globe, Languages } from 'lucide-react';
import { REGIONS, LANGUAGES } from '../constants';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  user: User;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [banner, setBanner] = useState(user.banner || 'https://picsum.photos/seed/bg/1000/300');
  
  // Tutoring Settings
  const [isTutor, setIsTutor] = useState(user.isTutor || false);
  const [tutorRate, setTutorRate] = useState(user.tutorRate || 500);
  const [tutorSubjects, setTutorSubjects] = useState<string>(user.tutorSubjects?.join(', ') || '');
  const [tutorRegion, setTutorRegion] = useState(user.tutorRegion || 'Global');
  const [tutorLanguages, setTutorLanguages] = useState<string>(user.tutorLanguages?.join(', ') || 'English');
  const [availability, setAvailability] = useState<{ day: number; startTime: string; endTime: string }[]>(user.tutorAvailability || []);
  
  const [avatarMode, setAvatarMode] = useState<'url' | 'file'>('url');
  const [bannerMode, setBannerMode] = useState<'url' | 'file'>('url');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setBio(user.bio);
      setAvatar(user.avatar);
      setBanner(user.banner || 'https://picsum.photos/seed/bg/1000/300');
      setIsTutor(user.isTutor || false);
      setTutorRate(user.tutorRate || 500);
      setTutorSubjects(user.tutorSubjects?.join(', ') || '');
      setTutorRegion(user.tutorRegion || 'Global');
      setTutorLanguages(user.tutorLanguages?.join(', ') || 'English');
      setAvailability(user.tutorAvailability || []);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setAvatar(objectUrl);
      setAvatarMode('file');
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setBanner(objectUrl);
      setBannerMode('file');
    }
  };

  const addAvailabilitySlot = (day: number) => {
      setAvailability([...availability, { day, startTime: '09:00', endTime: '10:00' }]);
  };

  const removeAvailabilitySlot = (index: number) => {
      setAvailability(availability.filter((_, i) => i !== index));
  };

  const updateAvailabilitySlot = (index: number, updates: Partial<{ day: number; startTime: string; endTime: string }>) => {
      const next = [...availability];
      next[index] = { ...next[index], ...updates };
      setAvailability(next);
  };

  const handleSave = () => {
    onSave({
      ...user,
      name,
      bio,
      avatar,
      banner,
      isTutor,
      tutorRate,
      tutorSubjects: tutorSubjects.split(',').map(s => s.trim()).filter(s => s.length > 0),
      tutorRegion,
      tutorLanguages: tutorLanguages.split(',').map(s => s.trim()).filter(s => s.length > 0),
      tutorAvailability: availability
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="font-bold text-lg text-slate-800">Edit Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Banner Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Banner Image</label>
            <div className="relative h-32 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group mb-3">
                <img src={banner} alt="Banner Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            
            <div className="flex gap-2">
               <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setBannerMode('url')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${bannerMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><LinkIcon size={12} /> URL</button>
                  <button onClick={() => setBannerMode('file')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${bannerMode === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Upload size={12} /> Upload</button>
               </div>
               {bannerMode === 'url' ? (
                  <input className="flex-1 border border-slate-200 rounded-lg p-2 text-sm text-slate-900 outline-none bg-white" placeholder="https://..." value={banner.startsWith('blob:') ? '' : banner} onChange={e => setBanner(e.target.value)} />
               ) : (
                  <button onClick={() => bannerInputRef.current?.click()} className="flex-1 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:bg-slate-50">Choose File</button>
               )}
               <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
            </div>
          </div>

          {/* Avatar Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-slate-200 relative">
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                        <button onClick={() => setAvatarMode('url')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${avatarMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><LinkIcon size={12} /> URL</button>
                        <button onClick={() => setAvatarMode('file')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${avatarMode === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Upload size={12} /> Upload</button>
                    </div>
                    {avatarMode === 'url' ? (
                        <input className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 outline-none bg-white" placeholder="https://..." value={avatar.startsWith('blob:') ? '' : avatar} onChange={e => setAvatar(e.target.value)} />
                    ) : (
                        <button onClick={() => avatarInputRef.current?.click()} className="w-full border border-dashed border-slate-300 rounded-lg p-2 text-xs text-slate-500 hover:bg-slate-50">Choose File</button>
                    )}
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </div>
            </div>
          </div>

          {/* Text Fields */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
            <input 
              className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Biography / Resume</label>
            <textarea 
              className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              rows={4}
              placeholder="Tell your students about your experience and background..."
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>

          {/* Tutoring Services Configuration */}
          {user.role === 'tutor' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-slate-900">Tutoring Services</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isTutor} onChange={e => setIsTutor(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-xs font-bold text-slate-600 uppercase">{isTutor ? 'Online' : 'Offline'}</span>
                      </label>
                  </div>

                  {isTutor && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <DollarSign size={12} /> Rate (Points/hr)
                                </label>
                                <input 
                                    type="number"
                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={tutorRate}
                                    onChange={e => setTutorRate(parseInt(e.target.value) || 0)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <Globe size={12} /> Geolocation
                                </label>
                                <select 
                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={tutorRegion}
                                    onChange={e => setTutorRegion(e.target.value)}
                                >
                                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                              </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <Languages size={12} /> Languages (Comma separated)
                            </label>
                            <input 
                                type="text"
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                placeholder="e.g. English, Arabic, Spanish"
                                value={tutorLanguages}
                                onChange={e => setTutorLanguages(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <Tag size={12} /> Topics / Areas of Teaching
                            </label>
                            <input 
                                type="text"
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                placeholder="e.g. Physics, Calculus, React"
                                value={tutorSubjects}
                                onChange={e => setTutorSubjects(e.target.value)}
                            />
                          </div>

                          <div className="space-y-3">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                  <Clock size={12} /> Recurring Weekly Availability
                              </label>
                              <div className="space-y-2">
                                  {availability.map((slot, idx) => (
                                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 group">
                                          <select 
                                              className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                                              value={slot.day}
                                              onChange={e => updateAvailabilitySlot(idx, { day: parseInt(e.target.value) })}
                                          >
                                              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                          </select>
                                          <input 
                                              type="time" 
                                              className="bg-transparent text-xs outline-none"
                                              value={slot.startTime}
                                              onChange={e => updateAvailabilitySlot(idx, { startTime: e.target.value })}
                                          />
                                          <span className="text-slate-400">-</span>
                                          <input 
                                              type="time" 
                                              className="bg-transparent text-xs outline-none"
                                              value={slot.endTime}
                                              onChange={e => updateAvailabilitySlot(idx, { endTime: e.target.value })}
                                          />
                                          <button 
                                              onClick={() => removeAvailabilitySlot(idx)}
                                              className="ml-auto text-slate-300 hover:text-red-500 transition-colors"
                                          >
                                              <Trash2 size={14} />
                                          </button>
                                      </div>
                                  ))}
                                  <button 
                                      onClick={() => addAvailabilitySlot(1)}
                                      className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs font-bold text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-1"
                                  >
                                      <Plus size={14} /> Add Available Slot
                                  </button>
                              </div>
                          </div>

                          <div className="p-3 bg-indigo-100/50 rounded-lg flex items-start gap-2 border border-indigo-200">
                             <Plus size={14} className="text-indigo-600 mt-0.5" />
                             <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                                Enabling services allows students to find you in the marketplace and book sessions using their wallet points.
                             </p>
                          </div>
                      </div>
                  )}
              </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="text-slate-600 px-4 py-2 font-medium hover:text-slate-900">Cancel</button>
          <button onClick={handleSave} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary-600/20">
             <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
