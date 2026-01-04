
import React, { useState, useMemo } from 'react';
import { User, TutorSession } from '../types';
import { X, Calendar, Clock, Book, DollarSign, CheckCircle, ShieldCheck, Info, MousePointer2, AlertCircle } from 'lucide-react';

interface TutorBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: User;
  currentUser: User;
  onBook: (session: TutorSession) => void;
  existingSessions?: TutorSession[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TutorBookingModal: React.FC<TutorBookingModalProps> = ({ isOpen, onClose, tutor, currentUser, onBook, existingSessions = [] }) => {
  const [subject, setSubject] = useState(tutor.tutorSubjects?.[0] || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const tutorAvailability = useMemo(() => {
    if (!tutor.tutorAvailability) return [];
    return [...tutor.tutorAvailability].sort((a, b) => a.day - b.day);
  }, [tutor.tutorAvailability]);

  if (!isOpen) return null;

  // Helper to check if a date/time combination is in the future
  const isDateTimeInFuture = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return false;
    const now = new Date();
    const selected = new Date(`${dateStr}T${timeStr}`);
    return selected > now;
  };

  const getNextDateForDay = (dayIndex: number, startTime: string) => {
    const today = new Date();
    const nowTimeStr = today.getHours().toString().padStart(2, '0') + ':' + today.getMinutes().toString().padStart(2, '0');
    
    let daysToAdd = (dayIndex + 7 - today.getDay()) % 7;
    
    // If the slot is for today but the time has already passed, move to next week
    if (daysToAdd === 0 && startTime <= nowTimeStr) {
        daysToAdd = 7;
    }
    
    const resultDate = new Date();
    resultDate.setDate(today.getDate() + daysToAdd);
    return resultDate.toISOString().split('T')[0];
  };

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return totalMinutes > 0 ? totalMinutes : 60;
  };

  const isSlotBooked = (dayIndex: number, startTime: string) => {
      const targetDateStr = new Date(getNextDateForDay(dayIndex, startTime)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return existingSessions.some(s => 
          s.tutorId === tutor.id && 
          s.date === targetDateStr && 
          s.time === startTime &&
          s.status !== 'cancelled'
      );
  };

  const handleSlotSelect = (slot: { day: number; startTime: string; endTime: string }, idx: number) => {
    if (isSlotBooked(slot.day, slot.startTime)) return;
    
    setValidationError(null);
    setSelectedSlotIdx(idx);
    const targetDate = getNextDateForDay(slot.day, slot.startTime);
    setDate(targetDate);
    setTime(slot.startTime);
    setDuration(calculateDuration(slot.startTime, slot.endTime));
  };

  const handleBook = () => {
    setValidationError(null);
    if (!date || !time || !subject) return;

    if (!isDateTimeInFuture(date, time)) {
        setValidationError("Please select a future date and time.");
        return;
    }

    const targetDateStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const alreadyBooked = existingSessions.some(s => 
        s.tutorId === tutor.id && 
        s.date === targetDateStr && 
        s.time === time &&
        s.status !== 'cancelled'
    );

    if (alreadyBooked) {
        setValidationError("This slot was just booked by someone else. Please choose another time.");
        return;
    }

    const totalPrice = Math.round((tutor.tutorRate || 0) * (duration / 60));
    
    if (currentUser.points < totalPrice) {
        setValidationError(`Insufficient points! You need ${totalPrice} pts.`);
        return;
    }

    const session: TutorSession = {
      id: `session-${Date.now()}`,
      tutorId: tutor.id,
      studentId: currentUser.id,
      subject,
      date: targetDateStr,
      time,
      duration,
      status: 'scheduled',
      price: totalPrice,
      meetingUrl: 'https://meet.google.com/new'
    };

    onBook(session);
    setConfirmed(true);
    setTimeout(() => {
        setConfirmed(false);
        onClose();
    }, 2000);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        {confirmed ? (
            <div className="p-10 text-center animate-in fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Booked!</h2>
                <p className="text-slate-500">Your tutoring session with {tutor.name} is confirmed. Check your dashboard for the link.</p>
            </div>
        ) : (
            <>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="font-bold text-lg text-slate-900">Book Private Session</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <img src={tutor.avatar} alt={tutor.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                        <div>
                            <p className="font-bold text-slate-900">{tutor.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{tutor.tutorRate} pts / hour</p>
                        </div>
                    </div>

                    {tutorAvailability.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <MousePointer2 size={12} /> Select an Available Slot
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {tutorAvailability.map((slot, i) => {
                                    const booked = isSlotBooked(slot.day, slot.startTime);
                                    const isSelected = selectedSlotIdx === i;
                                    const slotDate = getNextDateForDay(slot.day, slot.startTime);
                                    const formattedSlotDate = new Date(slotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    
                                    return (
                                        <button 
                                            key={i}
                                            disabled={booked}
                                            onClick={() => handleSlotSelect(slot, i)}
                                            className={`p-2.5 rounded-xl border text-left transition-all group relative ${
                                                booked 
                                                ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                                                : isSelected 
                                                    ? 'bg-primary-600 border-primary-600 text-white shadow-md ring-2 ring-primary-100' 
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-primary-400 hover:bg-primary-50/30'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-[10px] font-bold uppercase ${booked ? 'text-slate-400' : isSelected ? 'text-primary-100' : 'text-primary-600'}`}>
                                                    {DAYS[slot.day]}, {formattedSlotDate}
                                                </span>
                                                {booked ? (
                                                    <span className="text-[8px] font-bold text-red-500 uppercase bg-red-50 px-1 rounded border border-red-100">Booked</span>
                                                ) : isSelected && <CheckCircle size={12} className="text-white" />}
                                            </div>
                                            <div className={`text-xs font-bold truncate ${booked ? 'text-slate-300 line-through' : ''}`}>
                                                {slot.startTime} - {slot.endTime}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Subject</label>
                            <select 
                                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                            >
                                {tutor.tutorSubjects?.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="date"
                                        min={todayStr}
                                        className="w-full pl-9 pr-3 border border-slate-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        value={date}
                                        onChange={e => {
                                            setDate(e.target.value);
                                            setSelectedSlotIdx(null);
                                            setValidationError(null);
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Start Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="time"
                                        className="w-full pl-9 pr-3 border border-slate-200 rounded-xl p-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        value={time}
                                        onChange={e => {
                                            setTime(e.target.value);
                                            setSelectedSlotIdx(null);
                                            setValidationError(null);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Duration</label>
                            <div className="flex gap-2">
                                {[30, 60, 90, 120].map(m => (
                                    <button 
                                        key={m}
                                        onClick={() => {
                                            setDuration(m);
                                            setSelectedSlotIdx(null);
                                        }}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${duration === m ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                    >
                                        {m}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-2xl space-y-2 border border-indigo-100 shadow-inner">
                        <div className="flex justify-between text-sm">
                            <span className="text-indigo-600 font-medium">Total Price:</span>
                            <span className="font-bold text-indigo-900 text-lg">{Math.round((tutor.tutorRate || 0) * (duration / 60))} pts</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-indigo-600 font-medium">Your Balance:</span>
                            <span className={`font-bold ${currentUser.points < (tutor.tutorRate || 0) * (duration / 60) ? 'text-red-500' : 'text-indigo-900'}`}>{currentUser.points} pts</span>
                        </div>
                    </div>

                    {validationError && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <span>{validationError}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <ShieldCheck size={14} className="text-green-500" />
                        <span>Secure payment. Points are held in escrow until session completion.</span>
                    </div>

                    <button 
                        onClick={handleBook}
                        disabled={!date || !time || !subject || currentUser.points < (tutor.tutorRate || 0) * (duration / 60)}
                        className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary-600/20 active:scale-[0.98]"
                    >
                        Confirm Booking
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default TutorBookingModal;
