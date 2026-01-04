import React from 'react';
import { Event } from '../types';
import { X, Calendar, Clock, Users, Check, Lock, MapPin, Video, ExternalLink } from 'lucide-react';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onToggleJoin: (eventId: string) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, onClose, event, onToggleJoin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="relative h-48 w-full">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all"
            >
                <X size={20} />
            </button>
            <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-500/90 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                        {event.type}
                    </span>
                    {event.isPrivate && (
                        <span className="bg-slate-900/80 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 backdrop-blur-md">
                            <Lock size={10} /> Private
                        </span>
                    )}
                </div>
                <h2 className="text-2xl font-bold leading-tight">{event.title}</h2>
            </div>
        </div>

        <div className="p-6 overflow-y-auto">
            <div className="flex flex-col gap-3 mb-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <Calendar className="text-primary-600 flex-shrink-0" size={20} />
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Date</p>
                            <p className="text-sm font-semibold">{event.date}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <Clock className="text-primary-600 flex-shrink-0" size={20} />
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Time</p>
                            <p className="text-sm font-semibold">{event.time}</p>
                        </div>
                    </div>
                </div>

                {/* Location / Format Info */}
                <div className="flex items-start gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {event.isOnline !== false ? ( // Default to online if undefined for legacy mock data compatibility or explicit check
                        <Video className="text-primary-600 mt-0.5 flex-shrink-0" size={20} />
                    ) : (
                        <MapPin className="text-primary-600 mt-0.5 flex-shrink-0" size={20} />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-500 uppercase">
                            {event.isOnline !== false ? "Online Event" : "Location"}
                        </p>
                        {event.isOnline !== false ? (
                            event.meetingUrl ? (
                                <a 
                                    href={event.meetingUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1 mt-0.5"
                                >
                                    Join Meeting <ExternalLink size={12} />
                                </a>
                            ) : (
                                <p className="text-sm font-semibold text-slate-400 italic">Link available upon registration</p>
                            )
                        ) : (
                            <p className="text-sm font-semibold">{event.location || "TBA"}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <Users className="text-primary-600 flex-shrink-0" size={20} />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Attendees</p>
                        <p className="text-sm font-semibold">{event.attendees} people joined</p>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-bold text-slate-900 mb-2 text-lg">About Event</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                    {event.description || "No description provided for this event. Join to interact with other attendees and the host!"}
                </p>
            </div>

            <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100">
                <button 
                    onClick={() => onToggleJoin(event.id)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        event.isJoined 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20'
                    }`}
                >
                    {event.isJoined ? (
                        <>
                            <Check size={18} /> Registered
                        </>
                    ) : (
                        "Join Event"
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;