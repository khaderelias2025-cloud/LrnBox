
import React, { useState, useEffect, useMemo } from 'react';
import { Event, Reminder, User, TutorSession } from '../types';
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar as CalendarIcon, Plus, CheckCircle, Circle, List, Grid, Bell, GraduationCap, Info, X } from 'lucide-react';

interface CalendarProps {
  currentUser: User;
  events: Event[];
  reminders: Reminder[];
  onAddReminder: (reminder: Reminder) => void;
  onToggleReminder: (reminderId: string) => void;
  tutorSessions?: TutorSession[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar: React.FC<CalendarProps> = ({ currentUser, events, reminders, onAddReminder, onToggleReminder, tutorSessions = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  
  // New Reminder Form State
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderType, setNewReminderType] = useState<Reminder['type']>('personal');

  // Filter events to show only joined/created ones
  const myEvents = events.filter(e => e.isJoined || e.creatorId === currentUser.id);

  // Helper to normalize date strings for comparison
  const normalizeDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ 
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false 
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month padding to fill a 6x7 grid (42 days)
    // This ensures that months that span 6 weeks are always shown fully
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle || !newReminderTime) return;

    const newReminder: Reminder = {
      id: `r-${Date.now()}`,
      title: newReminderTitle,
      date: normalizeDate(selectedDate),
      time: newReminderTime,
      type: newReminderType,
      isCompleted: false
    };

    onAddReminder(newReminder);
    setIsAddReminderOpen(false);
    setNewReminderTitle('');
    setNewReminderTime('');
  };

  // Get items for selected date
  const selectedDateStr = normalizeDate(selectedDate);
  const todaysEvents = myEvents.filter(e => e.date === selectedDateStr);
  const todaysReminders = reminders.filter(r => r.date === selectedDateStr);
  const todaysSessions = tutorSessions.filter(s => s.date === selectedDateStr);
  const todaysTutorSlots = useMemo(() => {
    if (currentUser.role !== 'tutor' || !currentUser.tutorAvailability) return [];
    const dayOfWeek = selectedDate.getDay();
    return currentUser.tutorAvailability.filter(slot => slot.day === dayOfWeek);
  }, [currentUser, selectedDate]);

  const renderMonthView = () => {
    const days = generateCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <button 
            onClick={() => { setSelectedDate(new Date()); setCurrentDate(new Date()); }}
            className="text-sm font-bold text-primary-600 hover:text-primary-700 px-3 py-1.5 hover:bg-primary-50 rounded-lg transition-all"
          >
            Go to Today
          </button>
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 shrink-0">
          {weekDays.map(day => (
            <div key={day} className="py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="grid grid-cols-7 flex-1 overflow-y-auto">
          {days.map(({ date, isCurrentMonth }, idx) => {
            const dateStr = normalizeDate(date);
            const isToday = normalizeDate(new Date()) === dateStr;
            const isSelected = normalizeDate(selectedDate) === dateStr;
            
            const dayEvents = myEvents.filter(e => e.date === dateStr);
            const dayReminders = reminders.filter(r => r.date === dateStr);
            const daySessions = tutorSessions.filter(s => s.date === dateStr);
            const hasTutorSlot = currentUser.role === 'tutor' && currentUser.tutorAvailability?.some(s => s.day === date.getDay());

            return (
              <div 
                key={date.toISOString()} 
                onClick={() => {
                  setSelectedDate(date);
                  if (!isCurrentMonth) {
                    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
                  }
                }}
                className={`
                  relative border-b border-r border-slate-100 p-2 cursor-pointer transition-all min-h-[110px] group
                  ${isSelected ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-500 z-10' : 'hover:bg-slate-50'}
                  ${!isCurrentMonth ? 'bg-slate-50/30 text-slate-300' : 'bg-white'}
                  ${idx % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                <div className="flex justify-between items-start">
                  <span className={`
                    text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all
                    ${isToday ? 'bg-primary-600 text-white shadow-md' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}
                    ${isSelected && !isToday ? 'bg-indigo-200 text-indigo-700' : ''}
                  `}>
                    {date.getDate()}
                  </span>
                  {hasTutorSlot && (
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5" title="Available for tutoring"></div>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 2).map(ev => (
                    <div key={ev.id} className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded truncate font-bold border-l-2 border-indigo-500">
                      {ev.title}
                    </div>
                  ))}
                  {daySessions.slice(0, 1).map(sess => (
                    <div key={sess.id} className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded truncate font-bold border-l-2 border-green-500">
                      {sess.subject}
                    </div>
                  ))}
                  {(dayEvents.length + daySessions.length) > 2 && (
                      <div className="text-[8px] text-slate-400 pl-1 font-medium">+{dayEvents.length + daySessions.length - 2} more</div>
                  )}
                  {dayReminders.length > 0 && dayEvents.length + daySessions.length < 2 && (
                    <div className={`text-[9px] px-1.5 py-0.5 rounded truncate font-bold border-l-2 ${dayReminders[0].isCompleted ? 'bg-slate-100 text-slate-400 border-slate-300 line-through' : 'bg-amber-100 text-amber-800 border-amber-500'}`}>
                      {dayReminders[0].title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const allItems = [
      ...myEvents.map(e => ({ ...e, itemType: 'event' as const })),
      ...reminders.map(r => ({ ...r, itemType: 'reminder' as const })),
      ...tutorSessions.map(s => ({ ...s, itemType: 'session' as const, title: `Tutoring: ${s.subject}` }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 overflow-y-auto min-h-[600px]">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <List size={20} className="text-primary-600" /> Upcoming Agenda
        </h3>
        <div className="space-y-6">
          {allItems.length > 0 ? (
            allItems.map((item: any) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="flex flex-col items-center min-w-[60px]">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                   <span className="text-2xl font-bold text-slate-900">{new Date(item.date).getDate()}</span>
                </div>
                <div className={`flex-1 border-l-4 pl-4 py-1.5 rounded-r-lg transition-colors ${item.itemType === 'event' ? 'border-indigo-500 bg-indigo-50/30' : item.itemType === 'session' ? 'border-green-500 bg-green-50/30' : 'border-amber-500 bg-amber-50/30'}`}>
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-bold text-sm ${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.title}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-medium">
                           <span className="flex items-center gap-1"><Clock size={10} /> {item.time}</span>
                           {item.type && <span className="capitalize px-1.5 py-0.5 bg-white border border-slate-100 rounded">{item.type}</span>}
                           {item.itemType === 'session' && <span className="capitalize text-green-700 font-bold px-1.5 py-0.5 bg-green-100 rounded">Tutoring Session</span>}
                        </div>
                      </div>
                      {item.itemType === 'reminder' && (
                        <button onClick={() => onToggleReminder(item.id)} className="text-slate-400 hover:text-green-600 transition-colors">
                           {item.isCompleted ? <CheckCircle size={20} className="text-green-600" /> : <Circle size={20} />}
                        </button>
                      )}
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-slate-500">
                <CalendarIcon size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="font-bold text-slate-700">Your agenda is clear!</p>
                <p className="text-sm text-slate-500 mt-1">Check back later or add a new reminder.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Calendar</h1>
          <p className="text-slate-500">Manage your schedule and learning milestones.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsAddReminderOpen(true)}
                className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-600/20 transition-all active:scale-95"
            >
                <Plus size={18} /> New Reminder
            </button>
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                <button 
                    onClick={() => setViewMode('month')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'month' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Month View"
                >
                    <Grid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                    title="List View"
                >
                    <List size={20} />
                </button>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main View Area */}
        <div className="flex-1">
           {viewMode === 'month' ? renderMonthView() : renderListView()}
        </div>

        {/* Sidebar / Daily Agenda */}
        {viewMode === 'month' && (
          <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
             {/* Selected Date Agenda */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                   <div>
                       <h3 className="font-bold text-slate-900 leading-tight">
                         {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                       </h3>
                       <p className="text-sm font-medium text-slate-400">
                        {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                       </p>
                   </div>
                   <button 
                     onClick={() => setIsAddReminderOpen(true)}
                     className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-all"
                     title="Add for this day"
                   >
                     <Plus size={20} />
                   </button>
                </div>

                <div className="space-y-4">
                   {todaysEvents.length === 0 && todaysReminders.length === 0 && todaysSessions.length === 0 && todaysTutorSlots.length === 0 && (
                      <div className="text-center py-12">
                         <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CalendarIcon size={24} className="text-slate-200" />
                         </div>
                         <p className="text-slate-400 text-xs italic font-medium">Nothing scheduled today.</p>
                      </div>
                   )}

                   {todaysTutorSlots.length > 0 && (
                       <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                           <h4 className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                               <Clock size={12} /> My Tutoring Availability
                           </h4>
                           <div className="space-y-1.5">
                               {todaysTutorSlots.map((slot, i) => (
                                   <div key={i} className="text-xs text-green-700 font-bold bg-white/60 px-2.5 py-1.5 rounded-lg border border-green-100">
                                       {slot.startTime} - {slot.endTime}
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {todaysEvents.map(event => (
                      <div key={event.id} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 group hover:border-indigo-300 transition-all">
                         <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-indigo-900 text-sm line-clamp-1">{event.title}</h4>
                            <span className="text-[9px] font-bold uppercase text-indigo-500 bg-white px-1.5 py-0.5 rounded-md border border-indigo-100 flex-shrink-0">{event.type}</span>
                         </div>
                         <div className="flex items-center gap-3 text-[10px] text-indigo-700 mt-2 font-medium">
                            <span className="flex items-center gap-1"><Clock size={10} /> {event.time}</span>
                            <span className="flex items-center gap-1"><MapPin size={10} /> {event.isOnline ? 'Online' : 'Venue'}</span>
                         </div>
                      </div>
                   ))}

                   {todaysSessions.map(session => (
                      <div key={session.id} className="bg-green-50 border border-green-100 rounded-xl p-4 group hover:border-green-300 transition-all">
                         <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-green-900 text-sm line-clamp-1">{session.subject}</h4>
                            <span className="text-[9px] font-bold uppercase text-green-600 bg-white px-1.5 py-0.5 rounded-md border border-green-100 flex-shrink-0">SESSION</span>
                         </div>
                         <div className="flex items-center gap-3 text-[10px] text-green-700 mt-2 font-medium">
                            <span className="flex items-center gap-1"><Clock size={10} /> {session.time}</span>
                            <span className="flex items-center gap-1"><GraduationCap size={10} /> {session.duration}m</span>
                         </div>
                      </div>
                   ))}

                   {todaysReminders.map(reminder => (
                      <div key={reminder.id} className={`border rounded-xl p-4 flex gap-3 items-start group transition-all ${reminder.isCompleted ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-amber-50 border-amber-100 hover:border-amber-300'}`}>
                         <button 
                           onClick={() => onToggleReminder(reminder.id)}
                           className={`mt-0.5 transition-colors ${reminder.isCompleted ? 'text-green-500' : 'text-amber-400 hover:text-green-500'}`}
                         >
                            {reminder.isCompleted ? <CheckCircle size={18} /> : <Circle size={18} />}
                         </button>
                         <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold truncate ${reminder.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{reminder.title}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-medium">
                               <Clock size={10} /> {reminder.time}
                               <span className="capitalize">• {reminder.type}</span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Legend */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 shrink-0">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Legend</h4>
                <div className="space-y-3 text-xs">
                   <div className="flex items-center gap-3 font-medium text-slate-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/30"></div>
                      <span>Events</span>
                   </div>
                   <div className="flex items-center gap-3 font-medium text-slate-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/30"></div>
                      <span>Tutoring / Available</span>
                   </div>
                   <div className="flex items-center gap-3 font-medium text-slate-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30"></div>
                      <span>Reminders</span>
                   </div>
                   <div className="flex items-center gap-3 font-medium text-slate-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-600 shadow-sm shadow-primary-600/30"></div>
                      <span>Current Day</span>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {isAddReminderOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddReminderOpen(false)} />
           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Bell size={20} className="text-primary-600"/> Add Reminder</h3>
                  <button onClick={() => setIsAddReminderOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-5">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                    <div className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-bold flex items-center gap-2 shadow-inner">
                       <CalendarIcon size={16} className="text-slate-400" />
                       {normalizeDate(selectedDate)}
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                    <input 
                      type="text" 
                      required
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white shadow-sm"
                      placeholder="e.g. Study React Hooks"
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      autoFocus
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Time</label>
                        <input 
                          type="time" 
                          required
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white shadow-sm"
                          value={newReminderTime}
                          onChange={(e) => setNewReminderTime(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                        <select 
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white shadow-sm"
                          value={newReminderType}
                          onChange={(e) => setNewReminderType(e.target.value as Reminder['type'])}
                        >
                           <option value="personal">Personal</option>
                           <option value="study">Study</option>
                           <option value="deadline">Deadline</option>
                        </select>
                    </div>
                 </div>
                 <div className="flex gap-3 mt-4 pt-2">
                    <button type="button" onClick={() => setIsAddReminderOpen(false)} className="flex-1 py-3 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-95">Save Task</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
