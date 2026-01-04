import React from 'react';
import { Notification } from '../types';
import { Heart, MessageCircle, UserPlus, Bell, MoreHorizontal, Calendar, CheckCheck } from 'lucide-react';

interface NotificationsProps {
  notifications: Notification[];
  onMarkAllRead?: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, onMarkAllRead }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-pink-500 fill-pink-500" />;
      case 'comment': return <MessageCircle size={16} className="text-blue-500 fill-blue-500" />;
      case 'follow': return <UserPlus size={16} className="text-green-600" />;
      case 'event_join': return <Calendar size={16} className="text-indigo-600" />;
      default: return <Bell size={16} className="text-yellow-500 fill-yellow-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
        case 'like': return 'border-pink-200 bg-pink-50';
        case 'comment': return 'border-blue-200 bg-blue-50';
        case 'follow': return 'border-green-200 bg-green-50';
        case 'event_join': return 'border-indigo-200 bg-indigo-50';
        default: return 'border-yellow-200 bg-yellow-50';
      }
  };

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        <div className="flex gap-2">
           {hasUnread && onMarkAllRead && (
             <button 
                onClick={onMarkAllRead}
                className="text-sm font-medium text-primary-600 hover:text-primary-800 px-3 py-1.5 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
             >
                <CheckCheck size={16} /> Mark all read
             </button>
           )}
           <button className="text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors">Settings</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-4 flex gap-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
            >
               <div className="relative flex-shrink-0">
                  {notif.actorAvatar ? (
                     <img src={notif.actorAvatar} alt={notif.actorName} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                  ) : (
                     <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Bell size={20} className="text-slate-400" />
                     </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${getBorderColor(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
               </div>
               
               <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-slate-900 leading-snug">
                     {notif.actorName && <span className="font-bold hover:underline cursor-pointer mr-1">{notif.actorName}</span>}
                     <span className="text-slate-600">{notif.content}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{notif.timestamp}</p>
               </div>

               <div className="flex items-center self-center">
                  <button className="text-slate-300 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100">
                     <MoreHorizontal size={20} />
                  </button>
                  {!notif.isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ml-2"></div>
                  )}
               </div>
            </div>
          ))
        ) : (
            <div className="p-8 text-center text-slate-500">
                You're all caught up! No new notifications.
            </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;