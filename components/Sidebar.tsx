
import React from 'react';
import { 
  Home, Compass, Package, Users, Wallet, 
  BarChart2, Calendar, MessageSquare, Bell, 
  User as UserIcon, LogOut, X, Trophy
} from 'lucide-react';
import { ViewState, User, Language } from '../types';
import Logo from './Logo';
import { TRANSLATIONS } from '../constants';

interface SidebarProps {
  user: User;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
  language?: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentView, onChangeView, isMobileOpen, onCloseMobile, onLogout, language = 'en' }) => {
  const t = TRANSLATIONS[language];

  const navItems = [
    { id: ViewState.DASHBOARD, label: t.home, icon: Home },
    { id: ViewState.NETWORK, label: t.myNetwork, icon: Users },
    { id: ViewState.LEADERBOARD, label: 'Leaderboard', icon: Trophy },
    { id: ViewState.EXPLORE, label: t.explore, icon: Compass },
    { id: ViewState.CALENDAR, label: t.calendar, icon: Calendar },
    { id: ViewState.MY_BOXES, label: t.myBoxes, icon: Package },
    { id: ViewState.ANALYTICS, label: t.reports, icon: BarChart2 },
    { id: ViewState.WALLET, label: t.wallet, icon: Wallet },
  ];

  const actionItems = [
    { id: ViewState.MESSAGING, label: t.messages, icon: MessageSquare },
    { id: ViewState.NOTIFICATIONS, label: t.notifications, icon: Bell },
    { id: ViewState.PROFILE, label: t.profile, icon: UserIcon },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[55] transition-opacity duration-300 md:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
      />
      
      {/* Sidebar Drawer */}
      <aside 
        className={`fixed inset-y-0 start-0 z-[60] w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-[72px] flex items-center justify-between px-4 border-b border-slate-100">
             <div className="flex items-center gap-3">
               <Logo size="sm" />
               <span className="font-bold text-lg text-slate-800">LrnBox</span>
             </div>
             <button onClick={onCloseMobile} className="text-slate-400 hover:text-slate-600 p-1">
               <X size={24} />
             </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <div className="flex items-center gap-3">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                <div className="min-w-0">
                   <p className="font-bold text-slate-900 truncate text-sm">{user.name}</p>
                   <p className="text-xs text-slate-500">{user.handle}</p>
                </div>
             </div>
             <div className="mt-3 flex gap-2 text-xs">
                <div className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm flex-1 text-center">
                   <span className="font-bold text-slate-900">{user.points}</span> pts
                </div>
                <div className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm flex-1 text-center">
                   <span className="font-bold text-slate-900">{user.followers.length}</span> followers
                </div>
             </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-2">
             <div className="px-3 mb-2">
                <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.menu}</p>
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onChangeView(item.id); onCloseMobile(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                      currentView === item.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={20} className={currentView === item.id ? 'text-primary-600' : 'text-slate-400'} />
                    {item.label}
                  </button>
                ))}
             </div>

             <div className="px-3 border-t border-slate-100 pt-2 pb-6">
                <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.account}</p>
                {actionItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onChangeView(item.id); onCloseMobile(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                      currentView === item.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={20} className={currentView === item.id ? 'text-primary-600' : 'text-slate-400'} />
                    {item.label}
                  </button>
                ))}
                
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2"
                >
                  <LogOut size={20} />
                  {t.logOut}
                </button>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
