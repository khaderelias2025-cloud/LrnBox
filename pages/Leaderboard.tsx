
import React, { useState, useMemo, useRef } from 'react';
import { User } from '../types';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Search, 
  ChevronRight, 
  Award,
  Star,
  Users,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface LeaderboardProps {
  users: User[];
  onViewProfile: (userId: string) => void;
  onMessage: (userId: string) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ users, onViewProfile, onMessage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'tutor' | 'professional' | 'enthusiast'>('all');
  const tableRef = useRef<HTMLDivElement>(null);
  const podiumRef = useRef<HTMLDivElement>(null);

  const sortedUsers = useMemo(() => {
    return [...users]
      .filter(u => {
        // Strictly exclude institutes from the leaderboard
        if (u.role === 'institute') return false;

        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             u.handle.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => b.points - a.points);
  }, [users, searchTerm, filterRole]);

  const topThree = sortedUsers.slice(0, 3);
  const remainingUsers = sortedUsers.slice(3);

  const handleActivateProFilter = () => {
    setFilterRole('professional');
    setSearchTerm('');
    tableRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPodium = () => {
    podiumRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 pb-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Individual Rankings</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Honoring our most dedicated individual learners and subject matter experts. Join the elite!
        </p>
      </div>

      {/* Podium Section */}
      <div ref={podiumRef} className="flex flex-col md:flex-row items-end justify-center gap-4 mb-16 px-4">
        {/* 2nd Place */}
        {topThree[1] && (
          <div className="w-full md:w-64 order-2 md:order-1 group cursor-pointer" onClick={() => onViewProfile(topThree[1].id)}>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-slate-300 overflow-hidden shadow-lg transition-transform group-hover:scale-110">
                  <img src={topThree[1].avatar} alt={topThree[1].name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
                  2
                </div>
              </div>
              <div className="bg-white rounded-t-2xl w-full p-6 shadow-sm border border-slate-200 border-b-0 text-center h-48 flex flex-col justify-end">
                <div className="flex items-center justify-center gap-1">
                    <h3 className="font-bold text-slate-900 truncate px-2">{topThree[1].name}</h3>
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-primary-600 font-bold text-xl mt-1">{topThree[1].points.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">Points</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); onMessage(topThree[1].id); }}
                  className="mt-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center justify-center gap-1"
                >
                  <MessageSquare size={12} /> Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {topThree[0] && (
          <div className="w-full md:w-72 order-1 md:order-2 group cursor-pointer" onClick={() => onViewProfile(topThree[0].id)}>
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-500 w-12 h-12 drop-shadow-md animate-bounce" />
                <div className="w-28 h-28 rounded-full border-4 border-yellow-400 overflow-hidden shadow-xl transition-transform group-hover:scale-110">
                  <img src={topThree[0].avatar} alt={topThree[0].name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md">
                  1
                </div>
              </div>
              <div className="bg-white rounded-t-2xl w-full p-8 shadow-md border-x border-t border-yellow-100 text-center h-72 flex flex-col justify-end relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-yellow-400"></div>
                <div className="flex items-center justify-center gap-1">
                    <h3 className="font-bold text-slate-900 text-xl truncate px-2">{topThree[0].name}</h3>
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-yellow-600 font-extrabold text-3xl mt-2">{topThree[0].points.toLocaleString()}</p>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-3">Points</p>
                <div className="mt-4 flex justify-center">
                   <span className="bg-yellow-50 text-yellow-700 text-[10px] px-2 py-1 rounded font-bold border border-yellow-100 uppercase">Expert Scholar</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onMessage(topThree[0].id); }}
                  className="mt-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} /> Send Congratulations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {topThree[2] && (
          <div className="w-full md:w-64 order-3 group cursor-pointer" onClick={() => onViewProfile(topThree[2].id)}>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-amber-600/30 overflow-hidden shadow-lg transition-transform group-hover:scale-110">
                  <img src={topThree[2].avatar} alt={topThree[2].name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
                  3
                </div>
              </div>
              <div className="bg-white rounded-t-2xl w-full p-6 shadow-sm border border-slate-200 border-b-0 text-center h-40 flex flex-col justify-end">
                <div className="flex items-center justify-center gap-1">
                    <h3 className="font-bold text-slate-900 truncate px-2">{topThree[2].name}</h3>
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-amber-800 font-bold text-xl mt-1">{topThree[2].points.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">Points</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); onMessage(topThree[2].id); }}
                  className="mt-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center justify-center gap-1"
                >
                  <MessageSquare size={12} /> Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rankings Table Header */}
      <div ref={tableRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-enter">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                <Trophy size={20} />
              </div>
              <h2 className="font-bold text-xl text-slate-900">Rankings</h2>
           </div>
           
           <div className="flex flex-1 max-w-xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Find person..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white outline-none transition-all"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value as any)}
              >
                <option value="all">All People</option>
                <option value="student">Students</option>
                <option value="tutor">Private Tutors</option>
                <option value="professional">Professionals</option>
                <option value="enthusiast">Enthusiasts</option>
              </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-100">
                <th className="px-6 py-4 text-center w-20">Rank</th>
                <th className="px-6 py-4">Individual</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Points</th>
                <th className="px-6 py-4 text-right">Momentum</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {remainingUsers.length > 0 ? (
                remainingUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => onViewProfile(user.id)}
                  >
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-slate-500">#{index + 4}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                        user.role === 'tutor' || user.role === 'professional' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {user.role === 'tutor' ? 'Private Tutor' : user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-slate-900">{user.points.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs text-green-600 font-bold">
                        <TrendingUp size={14} />
                        +{Math.floor(Math.random() * 15) + 5}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onMessage(user.id); }}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all"
                            title="Message User"
                          >
                             <MessageSquare size={18} />
                          </button>
                          <ChevronRight className="text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" size={18} />
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                     No individuals found matching your criteria.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rewards Info Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
           <Award className="w-10 h-10 mb-4 opacity-80" />
           <h3 className="font-bold text-lg mb-2">Individual Glory</h3>
           <p className="text-sm text-primary-100 leading-relaxed">
             This leaderboard is dedicated to individual excellence. Institutes are excluded to maintain a level playing field for all learners.
           </p>
        </div>
        <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm cursor-pointer hover:border-yellow-400 transition-all group"
            onClick={scrollToPodium}
        >
           <Star className="w-10 h-10 mb-4 text-yellow-500 group-hover:scale-110 transition-transform" />
           <h3 className="font-bold text-lg text-slate-900 mb-2">Weekly Spotlight</h3>
           <p className="text-sm text-slate-500 leading-relaxed mb-4">
             The top 3 individuals of the week are featured on the global dashboard and receive a "Rising Star" badge.
           </p>
           <div className="text-sm font-bold text-yellow-600 flex items-center gap-1 group-hover:underline">
              Meet Current Stars <ChevronRight size={16} />
           </div>
        </div>
        <div 
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm cursor-pointer hover:border-primary-400 transition-all group"
          onClick={handleActivateProFilter}
        >
           <Users className="w-10 h-10 mb-4 text-indigo-500 group-hover:scale-110 transition-transform" />
           <h3 className="font-bold text-lg text-slate-900 mb-2">Connect with Pros</h3>
           <p className="text-sm text-slate-500 leading-relaxed mb-4">
             Find the highest-ranking experts in your field of interest and connect with them for personalized guidance.
           </p>
           <div className="text-sm font-bold text-primary-600 flex items-center gap-1 group-hover:underline">
              Browse Professional Ranks <ChevronRight size={16} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
