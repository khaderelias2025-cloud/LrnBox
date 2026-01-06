
import React, { useState, useMemo } from 'react';
import { Box, User, Transaction, Lesson, Group, TutorSession } from '../types';
import LessonCard from '../components/LessonCard';
import ViewersModal from '../components/ViewersModal';
import ShareModal from '../components/ShareBoxModal';
import { Sparkles, Compass, Package, BookOpen, Plus, Trophy, BarChart2, Users, Edit2, Eye, Search, ArrowUpRight, ChevronRight, ChevronDown, GraduationCap, Video, ExternalLink, Star, Medal, DollarSign, Wallet } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';

interface DashboardProps {
  user: User;
  subscribedBoxes: Box[];
  allBoxes: Box[];
  allUsers: User[];
  myTransactions: Transaction[];
  onAddComment: (lessonId: string, text: string) => void;
  onHashtagClick: (tag: string) => void;
  onSubscribe: (boxId: string) => void;
  onViewBox: (boxId: string) => void;
  onCreateBox?: () => void;
  onEditProfile: () => void;
  onComplete: (lessonId: string) => void;
  onViewProfile: (userId: string) => void;
  onExplore: () => void;
  groups?: Group[];
  onSaveLesson?: (lessonId: string) => void;
  onDeleteLesson?: (boxId: string, lessonId: string) => void;
  tutorSessions?: TutorSession[];
}

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' style='background-color: %23f1f5f9;'%3E%3Cg stroke='%2394a3b8' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/g%3E%3C/svg%3E";

const RECENT_VIEWERS = [
  { id: 'u2', name: 'Sarah Chen', avatar: DEFAULT_AVATAR, role: 'tutor', time: '2h ago' },
  { id: 'u5', name: 'David Kim', avatar: DEFAULT_AVATAR, role: 'tutor', time: '5h ago' },
  { id: 'u4', name: 'Emily Blunt', avatar: DEFAULT_AVATAR, role: 'student', time: '1d ago' },
];

const MOCK_ALL_VIEWERS = [
    ...RECENT_VIEWERS,
    { id: 'u6', name: 'Michael Scott', avatar: DEFAULT_AVATAR, role: 'professional', time: '1d ago' },
    { id: 'u7', name: 'Pam Beesly', avatar: DEFAULT_AVATAR, role: 'student', time: '2d ago' },
    { id: 'u8', name: 'Jim Halpert', avatar: DEFAULT_AVATAR, role: 'professional', time: '2d ago' },
    { id: 'u9', name: 'Dwight Schrute', avatar: DEFAULT_AVATAR, role: 'enthusiast', time: '3d ago' },
    { id: 'u10', name: 'Stanley Hudson', avatar: DEFAULT_AVATAR, role: 'professional', time: '4d ago' },
    { id: 'u11', name: 'Kevin Malone', avatar: DEFAULT_AVATAR, role: 'enthusiast', time: '5d ago' },
];

const Dashboard: React.FC<DashboardProps> = ({ 
    user, 
    subscribedBoxes, 
    allBoxes,
    allUsers,
    myTransactions,
    onAddComment, 
    onHashtagClick,
    onSubscribe,
    onViewBox,
    onCreateBox,
    onEditProfile,
    onComplete,
    onViewProfile,
    onExplore,
    groups,
    onSaveLesson,
    onDeleteLesson,
    tutorSessions = []
}) => {
  const [viewersModalState, setViewersModalState] = useState<{
      isOpen: boolean;
      title: string;
      users: any[];
  }>({
      isOpen: false,
      title: '',
      users: []
  });
  
  const [sharingLesson, setSharingLesson] = useState<Lesson | null>(null);
  const [profileViewRange, setProfileViewRange] = useState<'7d' | '30d'>('7d');

  const profileViewsData = useMemo(() => {
      if (profileViewRange === '7d') {
          return [
            { day: 'Mon', views: 12 },
            { day: 'Tue', views: 18 },
            { day: 'Wed', views: 15 },
            { day: 'Thu', views: 25 },
            { day: 'Fri', views: 32 },
            { day: 'Sat', views: 28 },
            { day: 'Sun', views: 40 },
          ];
      } else {
          const data = [];
          for (let i = 1; i <= 30; i++) {
              data.push({
                  day: `Day ${i}`,
                  views: Math.floor(Math.random() * 40) + 10 + (i % 5)
              });
          }
          return data;
      }
  }, [profileViewRange]);

  const handleOpenViewers = (title: string, users: any[]) => {
      setViewersModalState({
          isOpen: true,
          title,
          users
      });
  };

  const feedLessons = subscribedBoxes.flatMap(box => 
    box.lessons.map(lesson => ({ ...lesson, box }))
  ).slice(0, 10);

  const spotlightUsers = useMemo(() => {
    return [...allUsers]
      .filter(u => u.role !== 'institute')
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
  }, [allUsers]);

  const subscribedBoxIds = subscribedBoxes.map(b => b.id);
  const subscribedCategories = new Set(subscribedBoxes.map(b => b.category));
  
  const recommendedBoxes = allBoxes
    .filter(box => !subscribedBoxIds.includes(box.id))
    .sort((a, b) => {
        const aMatch = subscribedCategories.has(a.category) ? 1 : 0;
        const bMatch = subscribedCategories.has(b.category) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        return b.subscribers - a.subscribers;
    })
    .slice(0, 3);

  const myBoxes = allBoxes.filter(b => b.creatorId === user.id);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  startOfWeek.setHours(0,0,0,0);

  const weeklyPoints = myTransactions
    .filter(t => t.type === 'credit' && new Date(t.timestamp) >= startOfWeek)
    .reduce((acc, t) => acc + t.amount, 0);
  
  const weeklyGoal = 500;
  const progressPercentage = Math.min(100, Math.round((weeklyPoints / weeklyGoal) * 100));

  const streak = user.streak || 0;

  // Tutor Earnings Logic
  const tutorEarnings = useMemo(() => {
      if (user.role !== 'tutor') return 0;
      return myTransactions
          .filter(t => t.type === 'credit' && t.description.includes('Tutoring'))
          .reduce((acc, t) => acc + t.amount, 0);
  }, [myTransactions, user.role]);

  const upcomingTutorCount = tutorSessions.filter(s => s.tutorId === user.id && s.status === 'scheduled').length;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="hidden lg:block space-y-6 animate-enter" style={{animationDelay: '0ms'}}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                <div 
                  className="h-20 bg-slate-700 bg-cover bg-center opacity-90 relative"
                  style={{ backgroundImage: `url('${user.banner || 'https://picsum.photos/seed/bg_abstract/400/150'}')` }}
                >
                   <button 
                      onClick={onEditProfile}
                      className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                      title="Edit Profile"
                   >
                      <Edit2 size={14} />
                   </button>
                </div>
                <div className="px-4 pb-4">
                    <div className="relative -mt-10 mb-3 text-center">
                        <img src={user.avatar} className="w-20 h-20 rounded-full border-4 border-white mx-auto object-cover bg-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity" onClick={onEditProfile} alt={user.name} />
                    </div>
                    <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-1">
                            <h2 className="font-bold text-lg text-slate-900 leading-tight hover:underline cursor-pointer" onClick={onEditProfile}>{user.name}</h2>
                            {spotlightUsers.some(su => su.id === user.id) && (
                                <Star size={14} className="text-yellow-500 fill-yellow-500" title="Rising Star" />
                            )}
                        </div>
                        <p className="text-sm text-slate-500">{user.handle}</p>
                        <p className="text-[10px] text-primary-700 font-bold uppercase mt-2 bg-primary-50 inline-block px-2 py-0.5 rounded border border-primary-100 tracking-wide">{user.role === 'tutor' ? 'Private Tutor' : user.role}</p>
                    </div>
                    <div className="flex justify-between py-3 border-t border-slate-100 text-center">
                        <div className="flex-1 border-r border-slate-100">
                            <div className="font-bold text-slate-900 text-lg">{user.points}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Points</div>
                        </div>
                        <div className="flex-1">
                             <div className="font-bold text-slate-900 text-lg">{user.followers.length}</div>
                             <div className="text-[10px] text-slate-500 uppercase font-semibold">Followers</div>
                        </div>
                    </div>
                    {user.bio && (
                        <div className="border-t border-slate-100 pt-3 mt-1">
                             <p className="text-xs text-slate-500 line-clamp-2 text-center italic leading-relaxed">"{user.bio}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tutor Earnings/Sales Widget */}
            {user.role === 'tutor' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-green-600">
                    <div className="p-3 border-b border-slate-100 bg-green-50 flex items-center justify-between">
                         <h3 className="font-bold text-sm text-green-800 flex items-center gap-2">
                             <DollarSign size={16} /> Tutor Sales
                         </h3>
                         <span className="text-[10px] font-bold text-green-600 bg-white px-1.5 py-0.5 rounded">Partner</span>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Life Earnings</p>
                                <p className="text-xl font-bold text-slate-900">{tutorEarnings.toLocaleString()} pts</p>
                            </div>
                            <div className="bg-green-100 p-2 rounded-full text-green-600">
                                <Wallet size={20} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Rate</p>
                                <p className="font-bold text-sm text-slate-800">{user.tutorRate} pts</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Sessions</p>
                                <p className="font-bold text-sm text-slate-800">{upcomingTutorCount}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onEditProfile}
                            className="w-full py-2 bg-green-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-green-700 transition-all flex items-center justify-center gap-1.5"
                        >
                            Manage Services <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* Upcoming Tutoring Sessions Widget */}
            {tutorSessions.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                        <h3 className="font-bold text-sm text-indigo-800 flex items-center gap-2">
                            <GraduationCap size={16} /> {user.role === 'tutor' ? 'Teaching' : 'Tutoring'}
                        </h3>
                        <span className="text-[10px] font-bold text-indigo-600 bg-white px-1.5 py-0.5 rounded">{tutorSessions.length}</span>
                    </div>
                    <div className="p-3 space-y-3">
                        {tutorSessions.map(session => {
                            const tutor = allUsers.find(u => u.id === session.tutorId);
                            const isTutor = session.tutorId === user.id;
                            const student = allUsers.find(u => u.id === session.studentId);
                            
                            return (
                                <div key={session.id} className="p-2 border border-slate-100 rounded-lg hover:border-indigo-200 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-xs font-bold text-slate-900">{session.subject}</h4>
                                        <span className="text-[9px] font-bold text-indigo-600 uppercase">{session.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={isTutor ? student?.avatar : tutor?.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                                        <span className="text-[10px] text-slate-500 truncate">{isTutor ? `Student: ${student?.name}` : `Tutor: ${tutor?.name}`}</span>
                                    </div>
                                    <a 
                                        href={session.meetingUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="w-full py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-indigo-700 transition-all"
                                    >
                                        <Video size={10} /> Join Session
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        <Package size={16} className="text-indigo-600"/> My Boxes
                    </h3>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{myBoxes.length}</span>
                </div>
                <div className="p-2 space-y-1">
                    {myBoxes.length > 0 ? myBoxes.slice(0, 3).map(box => (
                        <div key={box.id} onClick={() => onViewBox(box.id)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                             <img src={box.coverImage} className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-slate-100" alt={box.title} />
                             <div className="min-w-0 flex-1">
                                 <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">{box.title}</p>
                                 <p className="text-xs text-slate-500 flex items-center gap-1">
                                     <Users size={10} /> {box.subscribers}
                                 </p>
                             </div>
                        </div>
                    )) : (
                        <div className="text-center py-6 text-xs text-slate-400 italic">
                            You haven't created any boxes yet.
                        </div>
                    )}
                    <button 
                        onClick={onCreateBox}
                        className="w-full mt-2 py-2 text-xs font-bold text-primary-600 hover:bg-primary-50 hover:border-primary-300 rounded-lg flex items-center justify-center gap-1.5 border border-dashed border-primary-200 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={14} /> Create New Box
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        <BookOpen size={16} className="text-emerald-600"/> My Learning
                    </h3>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{subscribedBoxes.length}</span>
                </div>
                <div className="p-2 space-y-1">
                    {subscribedBoxes.length > 0 ? subscribedBoxes.slice(0, 5).map(box => (
                        <div key={box.id} onClick={() => onViewBox(box.id)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                             <div className="relative w-8 h-8 flex-shrink-0">
                                <img src={box.coverImage} className="w-full h-full rounded object-cover" alt={box.title} />
                                {box.isPrivate && (
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                        <div className="w-2.5 h-2.5 bg-slate-800 rounded-full flex items-center justify-center">
                                            <Sparkles size={6} className="text-yellow-400" />
                                        </div>
                                    </div>
                                )}
                             </div>
                             <div className="min-w-0 flex-1">
                                 <p className="text-sm font-medium text-slate-900 truncate group-hover:text-primary-600">{box.title}</p>
                                 <p className="text-[10px] text-slate-500 truncate">{box.category}</p>
                             </div>
                        </div>
                    )) : (
                        <div className="text-center py-6 text-xs text-slate-400 italic">
                            Not subscribed to anything.
                        </div>
                    )}
                    {subscribedBoxes.length > 5 && (
                        <button className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium border-t border-slate-50 mt-1">
                            View All ({subscribedBoxes.length})
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* CENTER COLUMN: Feed */}
        <div className="lg:col-span-2 space-y-6">
            <div className="lg:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 mb-2 animate-enter">
                <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-slate-100 object-cover" alt={user.name} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <h2 className="font-bold text-slate-900 text-lg truncate">{user.name}</h2>
                       <button onClick={onEditProfile} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors">
                           <Edit2 size={16} />
                       </button>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="font-bold text-slate-900">{user.points} pts</span>
                        <span>•</span>
                        <span>{user.followers.length} followers</span>
                    </div>
                </div>
            </div>

            {feedLessons.map((item) => (
                <LessonCard 
                    key={item.id} 
                    lesson={item} 
                    box={item.box}
                    onLike={(id) => {}} 
                    onComplete={onComplete}
                    onAddComment={onAddComment}
                    onHashtagClick={onHashtagClick}
                    friendsWhoCompleted={item.completedByUserIds?.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[]}
                    onShowCompleters={(users) => handleOpenViewers('Completed by', users)}
                    onShare={() => setSharingLesson(item)}
                    isSaved={user.savedLessonIds?.includes(item.id)}
                    onSave={onSaveLesson}
                    onDelete={item.box.creatorId === user.id ? (lid) => onDeleteLesson?.(item.box.id, lid) : undefined}
                />
            ))}
            
            {feedLessons.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Compass size={32} className="text-slate-300" />
                    </div>
                    <h3 className="font-bold text-slate-900">Your feed is empty</h3>
                    <p className="text-slate-500 text-sm mt-1 mb-4">Subscribe to boxes to see lessons here.</p>
                    <button onClick={onExplore} className="bg-primary-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-primary-700 transition-colors">
                        Explore Content
                    </button>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="hidden lg:block space-y-6 animate-enter" style={{animationDelay: '100ms'}}>
            {/* Weekly Spotlight Widget */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-yellow-400">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">
                        <Trophy size={16} className="text-yellow-500" /> Weekly Spotlight
                    </h3>
                    <Sparkles size={14} className="text-yellow-500 animate-pulse" />
                </div>
                <div className="p-4 space-y-4">
                    {spotlightUsers.map((su, idx) => (
                        <div key={su.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => onViewProfile(su.id)}>
                            <div className="relative">
                                <img src={su.avatar} alt={su.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-yellow-200 transition-colors" />
                                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-600'}`}>
                                    {idx + 1}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-yellow-600 transition-colors">{su.name}</h4>
                                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{su.points.toLocaleString()} pts</p>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    ))}
                </div>
                <div className="px-4 pb-4">
                    <button 
                        onClick={() => onExplore()} 
                        className="w-full py-2 bg-yellow-50 text-yellow-700 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-yellow-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <Medal size={12} /> View Full Leaderboard
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <Eye size={16} className="text-blue-500" /> Profile Views
                    </h3>
                    <div className="flex bg-slate-100 rounded-md p-0.5">
                       <button 
                         onClick={() => setProfileViewRange('7d')}
                         className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${profileViewRange === '7d' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                         7d
                       </button>
                       <button 
                         onClick={() => setProfileViewRange('30d')}
                         className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${profileViewRange === '30d' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                         30d
                       </button>
                    </div>
                </div>
                
                <div 
                    className="h-32 w-full -ml-2 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleOpenViewers("Chart Viewers", MOCK_ALL_VIEWERS)}
                    title="Click to view details"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={profileViewsData}>
                            <defs>
                                <linearGradient id="colorViews" x1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" hide />
                            <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-2 space-y-3">
                    {RECENT_VIEWERS.map((viewer, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <img src={viewer.avatar} alt={viewer.name} className="w-8 h-8 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                    <p className="text-xs font-bold text-slate-900 truncate cursor-pointer hover:underline" onClick={() => onViewProfile(viewer.id)}>{viewer.name}</p>
                                    <span className="text-[10px] text-slate-400">{viewer.time}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 capitalize">{viewer.role === 'tutor' ? 'Private Tutor' : viewer.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => handleOpenViewers("Profile Viewers", MOCK_ALL_VIEWERS)}
                    className="w-full mt-3 text-xs font-bold text-slate-500 hover:text-slate-800 text-center py-1 hover:bg-slate-50 rounded transition-colors"
                >
                    View all visitors
                </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-indigo-100 text-xs font-bold uppercase tracking-wide mb-1">Weekly Goal</p>
                            <h3 className="font-bold text-lg">{weeklyPoints} / {weeklyGoal} pts</h3>
                        </div>
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <Trophy size={18} className="text-yellow-300" />
                        </div>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div className="bg-yellow-400 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <p className="text-xs text-indigo-100 opacity-90">
                        {progressPercentage >= 100 ? "Goal reached! Great job!" : "Keep learning to hit your target!"}
                    </p>
                </div>
                <Sparkles className="absolute -bottom-2 -right-2 text-white/10 w-24 h-24 rotate-12" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <Compass size={16} className="text-primary-600" /> Recommended
                </h3>
                <div className="space-y-3">
                    {recommendedBoxes.map(box => (
                        <div key={box.id} className="flex gap-3 group cursor-pointer" onClick={() => onViewBox(box.id)}>
                            <img src={box.coverImage} className="w-16 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0" alt={box.title} />
                            <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors">{box.title}</h4>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{box.category}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 rounded">
                                        {box.isPrivate && box.price ? `${box.price} pts` : 'Free'}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSubscribe(box.id);
                                }}
                                className="self-center ml-auto p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-primary-600 hover:text-white transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    ))}
                    {recommendedBoxes.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center">No new recommendations.</p>
                    )}
                </div>
                <button onClick={onExplore} className="w-full mt-4 py-2 text-xs font-bold text-primary-600 border border-primary-100 rounded-lg hover:bg-primary-50 transition-colors">
                    Explore More
                </button>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">Daily Streak</p>
                    <h3 className="text-2xl font-bold text-orange-600">{streak} Days</h3>
                </div>
                <div className="text-4xl">🔥</div>
            </div>
        </div>
      </div>

      <ViewersModal 
        isOpen={viewersModalState.isOpen} 
        onClose={() => setViewersModalState(prev => ({...prev, isOpen: false}))} 
        viewers={viewersModalState.users}
        onViewProfile={onViewProfile}
        title={viewersModalState.title}
      />

      {sharingLesson && (
          <ShareModal
            isOpen={true}
            onClose={() => setSharingLesson(null)}
            item={{ id: sharingLesson.id, title: sharingLesson.title, type: 'Lesson' }}
            allUsers={allUsers}
            currentUser={user}
            groups={groups}
            onShare={(id, userIds) => {
                setSharingLesson(null);
                alert("Post shared successfully!");
            }}
          />
      )}
    </div>
  );
};

export default Dashboard;
