
import React, { useState } from 'react';
import { ViewState, User, Language } from '../types';
import Logo from './Logo';
import { TRANSLATIONS } from '../constants';
import { 
  Home, 
  Compass, 
  Package, 
  Users, 
  Wallet, 
  Search, 
  Bell, 
  MessageSquare, 
  Menu,
  BarChart2,
  LogOut,
  Calendar,
  X,
  Trophy
} from 'lucide-react';

interface HeaderProps {
  user: User;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onToggleMobileMenu?: () => void;
  onLogout: () => void;
  onSearch: (term: string) => void;
  notificationCount?: number;
  messageCount?: number;
  language?: Language;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  currentView, 
  onChangeView, 
  onToggleMobileMenu, 
  onLogout, 
  onSearch,
  notificationCount = 0,
  messageCount = 0,
  language = 'en'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const t = TRANSLATIONS[language];

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      onSearch(searchTerm);
      setIsMobileSearchOpen(false);
    }
  };

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

  return (
    <header className="sticky top-0 z-50 bg-[#34495e] border-b border-slate-600 shadow-lg h-[72px]">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className={`flex items-center gap-4 md:gap-8 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
          <div onClick={() => onChangeView(ViewState.DASHBOARD)} className="cursor-pointer flex items-center gap-3">
            <div className="transition-transform hover:scale-105 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">
              <Logo size="md" theme="dark" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">LrnBox</span>
          </div>
        </div>

        {/* Search Bar (Desktop & Mobile Toggle) */}
        <div className={`flex-1 max-w-md mx-4 ${isMobileSearchOpen ? 'flex' : 'hidden md:block'}`}>
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder} 
                  className="bg-white border border-slate-300 text-slate-900 text-sm rounded-md pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  autoFocus={isMobileSearchOpen}
                />
                {isMobileSearchOpen && (
                    <button 
                        onClick={() => setIsMobileSearchOpen(false)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>

        {!isMobileSearchOpen && (
            <button 
                className="md:hidden text-slate-400 p-2 hover:bg-slate-700 rounded-full"
                onClick={() => setIsMobileSearchOpen(true)}
            >
                <Search size={24} />
            </button>
        )}

        {/* Middle: Navigation (Desktop) */}
        <nav className="hidden md:flex items-center h-full gap-1 lg:gap-6">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`flex flex-col items-center justify-center h-full min-w-[60px] border-b-2 transition-all group ${
                  isActive 
                    ? 'border-primary-500 text-white' 
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <item.icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`mb-1 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} 
                /> 
                <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions & Profile */}
        <div className={`flex items-center gap-2 md:gap-6 border-s border-slate-600 ps-2 md:ps-6 ms-2 md:ms-0 h-3/4 my-auto ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
          <div className="hidden md:flex items-center gap-4">
             <button 
                onClick={() => onChangeView(ViewState.MESSAGING)}
                className={`flex flex-col items-center justify-center transition-colors relative ${currentView === ViewState.MESSAGING ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                title={t.messages}
             >
                <MessageSquare size={20} fill={currentView === ViewState.MESSAGING ? "currentColor" : "none"} />
                {/* Unread dot */}
                {messageCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white px-1 ring-2 ring-slate-900 font-bold">
                    {messageCount > 9 ? '9+' : messageCount}
                  </span>
                )}
             </button>
             <button 
                onClick={() => onChangeView(ViewState.NOTIFICATIONS)}
                className={`flex flex-col items-center justify-center transition-colors relative ${currentView === ViewState.NOTIFICATIONS ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                title={t.notifications}
             >
                <Bell size={20} fill={currentView === ViewState.NOTIFICATIONS ? "currentColor" : "none"} />
                {/* Unread dot */}
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white px-1 ring-2 ring-slate-900 font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
             </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
                onClick={() => onChangeView(ViewState.PROFILE)}
                className="flex flex-col items-center justify-center group"
                title={t.profile}
            >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 group-hover:ring-2 ring-white transition-all">
                <img src={user.avatar} alt="Me" className="w-full h-full object-cover" />
                </div>
            </button>

            <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors ms-2 hidden md:block"
                title={t.logOut}
            >
                <LogOut size={20} />
            </button>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:bg-slate-700 rounded-md relative"
            onClick={onToggleMobileMenu}
          >
            <Menu size={24} />
            {(notificationCount > 0 || messageCount > 0) && (
               <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
