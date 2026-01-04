import React, { useState, useRef } from 'react';
import { X, Calendar, Clock, MapPin, Image as ImageIcon, Lock, Globe, Upload, Link as LinkIcon, Video } from 'lucide-react';
import { Event } from '../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (event: Event) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<Event['type']>('Webinar');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Location / Online State
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');

  // Image State
  const [coverImage, setCoverImage] = useState('');
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setCoverImage(objectUrl);
      setImageMode('file');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;

    // Default image if none provided
    const finalImage = coverImage || `https://picsum.photos/seed/${title.replace(/\s/g, '')}/200/200`;

    const newEvent: Event = {
      id: `e-${Date.now()}`,
      title,
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time,
      type,
      attendees: 1,
      image: finalImage,
      isJoined: true,
      description,
      isPrivate,
      creatorId: 'u1', // Hardcoded as current user for demo creation
      invitedUserIds: [],
      isOnline,
      location: !isOnline ? location : undefined,
      meetingUrl: isOnline ? meetingUrl : undefined,
    };

    onCreate(newEvent);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setType('Webinar');
    setDescription('');
    setIsPrivate(false);
    setCoverImage('');
    setImageMode('url');
    setIsOnline(true);
    setLocation('');
    setMeetingUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="font-bold text-lg text-slate-800">Create New Event</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
            <input 
              type="text"
              required
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              placeholder="e.g. React Developers Meetup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Event Image</label>
            
            {/* Preview */}
            <div className="mb-3 relative h-32 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group">
                {coverImage ? (
                    <img src={coverImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon size={32} />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
               <div className="flex bg-slate-100 p-1 rounded-lg self-start">
                  <button 
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${imageMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    <LinkIcon size={12} /> URL
                  </button>
                  <button 
                    type="button"
                    onClick={() => setImageMode('file')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${imageMode === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    <Upload size={12} /> Upload
                  </button>
               </div>

               {imageMode === 'url' ? (
                  <input 
                    type="text"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none bg-white"
                    placeholder="https://example.com/image.jpg"
                    value={coverImage.startsWith('blob:') ? '' : coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                  />
               ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-300 rounded-lg p-3 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-center"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <p className="text-xs text-slate-600 font-medium">Click to select file</p>
                  </div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
               <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   type="date"
                   required
                   className="w-full pl-9 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                   value={date}
                   onChange={(e) => setDate(e.target.value)}
                 />
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
               <div className="relative">
                 <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   type="time"
                   required
                   className="w-full pl-9 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                   value={time}
                   onChange={(e) => setTime(e.target.value)}
                 />
               </div>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
             <select 
               className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
               value={type}
               onChange={(e) => setType(e.target.value as any)}
             >
               <option value="Webinar">Webinar</option>
               <option value="Meetup">Meetup</option>
               <option value="Conference">Conference</option>
               <option value="Workshop">Workshop</option>
             </select>
          </div>

          {/* Location / Format Section */}
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
             <div className="flex gap-2 mb-3">
                 <button
                    type="button"
                    onClick={() => setIsOnline(true)}
                    className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${isOnline ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                 >
                     <Video size={16} /> Online
                 </button>
                 <button
                    type="button"
                    onClick={() => setIsOnline(false)}
                    className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${!isOnline ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                 >
                     <MapPin size={16} /> In Person
                 </button>
             </div>
             
             {isOnline ? (
                 <div className="animate-in fade-in slide-in-from-top-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Meeting Link (Optional)</label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="url"
                            className="w-full pl-9 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                            placeholder="https://zoom.us/j/..."
                            value={meetingUrl}
                            onChange={(e) => setMeetingUrl(e.target.value)}
                        />
                    </div>
                 </div>
             ) : (
                 <div className="animate-in fade-in slide-in-from-top-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Location / Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text"
                            className="w-full pl-9 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                            placeholder="123 Conference Center Dr, New York"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                 </div>
             )}
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Privacy</label>
             <div className="flex gap-2">
                 <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${!isPrivate ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                 >
                     <Globe size={16} /> Public
                 </button>
                 <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${isPrivate ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                 >
                     <Lock size={16} /> Private
                 </button>
             </div>
             <p className="text-xs text-slate-500 mt-1">
                 {isPrivate ? "Only invited users can see and join this event." : "Anyone in your network can see and join this event."}
             </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea 
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              placeholder="What is this event about?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-sm"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;