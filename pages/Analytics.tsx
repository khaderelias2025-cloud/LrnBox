
import React, { useState, useMemo } from 'react';
import { User, Box, TutorSession, Transaction } from '../types';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  TrendingUp, Users, BookOpen, DollarSign, Calendar, Download, 
  LayoutDashboard, Box as BoxIcon, PieChart as PieChartIcon, FileText,
  ArrowUpRight, ArrowDownRight, Clock, MapPin, Globe, ArrowLeft, MoreHorizontal, GraduationCap, Award, PlayCircle, Wallet, CreditCard
} from 'lucide-react';

interface AnalyticsProps {
  user: User;
  allBoxes: Box[]; // All boxes in system (for creator stats)
  subscribedBoxes: Box[]; // Subscribed boxes (for student stats)
  onViewBox: (boxId: string) => void;
  tutorSessions?: TutorSession[];
  myTransactions?: Transaction[];
}

// --- Mock Data Generators ---

const generateTimeSeriesData = (range: '7d' | '30d' | '90d') => {
  const points = range === '7d' ? 7 : range === '30d' ? 12 : 12; // Simplified for demo
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < points; i++) {
    const date = new Date();
    date.setDate(now.getDate() - (points - 1 - i) * (range === '7d' ? 1 : range === '30d' ? 2 : 7));
    
    data.push({
      name: range === '7d' ? date.toLocaleDateString('en-US', { weekday: 'short' }) : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      earnings: Math.floor(Math.random() * 500) + 200 + (i * 20),
      views: Math.floor(Math.random() * 1000) + 500 + (i * 50),
      subscribers: Math.floor(Math.random() * 20) + 5,
    });
  }
  return data;
};

const DEMOGRAPHICS_DATA = [
  { name: 'Students', value: 450, color: '#3b82f6' },
  { name: 'Teachers', value: 120, color: '#10b981' },
  { name: 'Professionals', value: 310, color: '#f59e0b' },
  { name: 'Hobbyists', value: 200, color: '#6366f1' },
];

const GEO_DATA = [
  { name: 'USA', value: 45 },
  { name: 'India', value: 20 },
  { name: 'UK', value: 15 },
  { name: 'Canada', value: 10 },
  { name: 'Germany', value: 5 },
  { name: 'Brazil', value: 3 },
];

const ACTIVITY_DATA = [
  { time: '00:00', users: 45 },
  { time: '04:00', users: 20 },
  { time: '08:00', users: 150 },
  { time: '12:00', users: 320 },
  { time: '16:00', users: 280 },
  { time: '20:00', users: 190 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

const Analytics: React.FC<AnalyticsProps> = ({ 
  user, 
  allBoxes, 
  subscribedBoxes, 
  onViewBox, 
  tutorSessions = [],
  myTransactions = []
}) => {
  const [activeReport, setActiveReport] = useState<'learning' | 'overview' | 'content' | 'audience' | 'financial'>('learning');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  const chartData = useMemo(() => generateTimeSeriesData(timeRange), [timeRange]);

  const totalSubscribers = allBoxes.reduce((acc, box) => acc + box.subscribers, 0);
  const totalLessons = allBoxes.reduce((acc, box) => acc + box.lessons.length, 0);
  
  // Calculate Box Revenue
  const boxRevenue = allBoxes.reduce((acc, box) => acc + (box.isPrivate && box.price ? box.subscribers * box.price : 0), 0);
  
  // Calculate Tutoring Revenue (specifically for the current user as a tutor)
  const tutoringRevenue = useMemo(() => {
      return tutorSessions
        .filter(s => s.tutorId === user.id && s.status !== 'cancelled')
        .reduce((acc, s) => acc + s.price, 0);
  }, [tutorSessions, user.id]);

  const totalRevenue = boxRevenue + tutoringRevenue;

  const handleExport = () => {
    alert("Report downloaded successfully!");
  };

  // Helper component for sidebar items
  const NavItem = ({ id, label, icon: Icon }: { id: typeof activeReport, label: string, icon: any }) => (
    <button 
      onClick={() => {
        setActiveReport(id);
        setSelectedBoxId(null); // Reset detail view when switching tabs
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        activeReport === id 
          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600' 
          : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  // --- Views ---

  const renderMyLearning = () => {
    // Generate Radar Data based on subscribed categories
    const categoryCounts: Record<string, number> = {};
    subscribedBoxes.forEach(box => {
        categoryCounts[box.category] = (categoryCounts[box.category] || 0) + 1;
    });
    
    // Normalize to Radar Chart format with a max value for visualization
    const radarData = Object.keys(categoryCounts).map(cat => ({
        subject: cat,
        A: categoryCounts[cat],
        fullMark: Math.max(...Object.values(categoryCounts)) + 1
    }));

    // Fallback if no data
    if (radarData.length === 0) {
        radarData.push({ subject: 'General', A: 1, fullMark: 10 });
        radarData.push({ subject: 'Skills', A: 1, fullMark: 10 });
        radarData.push({ subject: 'Growth', A: 1, fullMark: 10 });
    }

    const totalCompletedLessons = subscribedBoxes.reduce((acc, box) => acc + box.lessons.filter(l => l.isCompleted).length, 0);
    const totalAssignedLessons = subscribedBoxes.reduce((acc, box) => acc + box.lessons.length, 0);
    const avgProgress = totalAssignedLessons > 0 ? Math.round((totalCompletedLessons / totalAssignedLessons) * 100) : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <GraduationCap size={18} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Boxes Joined</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{subscribedBoxes.length}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Lessons Done</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{totalCompletedLessons}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Award size={18} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Certificates</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">0</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <TrendingUp size={18} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Avg. Progress</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{avgProgress}%</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Skills Radar */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Skill Profile</h3>
                    <p className="text-xs text-slate-500 mb-4">Based on your subscribed content categories.</p>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                <Radar
                                    name="Skills"
                                    dataKey="A"
                                    stroke="#4f46e5"
                                    strokeWidth={2}
                                    fill="#6366f1"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Course Progress List */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h3 className="font-bold text-lg text-slate-900 mb-6">Course Progress</h3>
                    <div className="space-y-6">
                        {subscribedBoxes.length > 0 ? subscribedBoxes.map(box => {
                            const completedCount = box.lessons.filter(l => l.isCompleted).length;
                            const totalCount = box.lessons.length;
                            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                            return (
                                <div key={box.id} className="flex items-center gap-4">
                                    <img src={box.coverImage} className="w-16 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0" alt={box.title} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between mb-1">
                                            <h4 className="font-bold text-slate-900 truncate pr-2">{box.title}</h4>
                                            <span className="text-xs font-bold text-slate-500">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-primary-600'}`} 
                                                style={{ width: `${progress}%` }} 
                                            />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-slate-500">{completedCount} of {totalCount} lessons completed</p>
                                            <button 
                                                onClick={() => onViewBox(box.id)}
                                                className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                                            >
                                                {progress === 100 ? 'Review' : 'Continue'} <PlayCircle size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                You haven't joined any learning boxes yet. Explore to get started!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-4">
             <div className="p-3 bg-green-100 text-green-600 rounded-lg">
               <DollarSign size={20} />
             </div>
             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
               <ArrowUpRight size={12} /> 12.5%
             </span>
           </div>
           <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
           <h3 className="text-2xl font-bold text-slate-900">{totalRevenue.toLocaleString()} pts</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-4">
             <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
               <Users size={20} />
             </div>
             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex items-center gap-1">
               <ArrowUpRight size={12} /> 5.2%
             </span>
           </div>
           <p className="text-slate-500 text-sm font-medium">Total Subscribers</p>
           <h3 className="text-2xl font-bold text-slate-900">{totalSubscribers.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-4">
             <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
               <BookOpen size={20} />
             </div>
             <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">0%</span>
           </div>
           <p className="text-slate-500 text-sm font-medium">Total Lessons</p>
           <h3 className="text-2xl font-bold text-slate-900">{totalLessons}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
           <div className="flex items-center justify-between mb-4">
             <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
               <TrendingUp size={20} />
             </div>
             <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
               <ArrowDownRight size={12} /> 2.1%
             </span>
           </div>
           <p className="text-slate-500 text-sm font-medium">Avg. Engagement</p>
           <h3 className="text-2xl font-bold text-slate-900">68%</h3>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-900">Growth Overview</h3>
            <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Earnings</span>
                <span className="flex items-center gap-1 text-xs font-medium text-purple-600"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Views</span>
            </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" name="Earnings" />
              <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" name="Views" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderSingleBoxReport = () => {
    const box = allBoxes.find(b => b.id === selectedBoxId);
    if (!box) return null;

    // Specific stats for the box
    const boxRevenue = box.isPrivate && box.price ? box.subscribers * box.price : 0;
    const avgScore = 85; // Mock
    const completionRate = 72; // Mock

    // Mock lesson specific stats
    const lessonStats = box.lessons.map(l => ({
        ...l,
        views: Math.floor(Math.random() * 500) + 100,
        completions: Math.floor(Math.random() * 400) + 50,
    }));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSelectedBoxId(null)}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{box.title}</h2>
                        <p className="text-sm text-slate-500">Detailed performance report</p>
                    </div>
                </div>
                <button className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg font-bold text-sm">
                    Export PDF
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-slate-900">{boxRevenue} pts</h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-2">
                        <ArrowUpRight size={12} /> +15% this month
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium mb-1">Completion Rate</p>
                    <h3 className="text-3xl font-bold text-slate-900">{completionRate}%</h3>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${completionRate}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium mb-1">Avg. Quiz Score</p>
                    <h3 className="text-3xl font-bold text-slate-900">{avgScore}%</h3>
                    <p className="text-xs text-slate-400 mt-2">Based on {box.lessons.filter(l => l.type === 'quiz').length} quizzes</p>
                </div>
            </div>

            {/* Drill Down Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="font-bold text-lg text-slate-900">Lesson Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Lesson Title</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-center">Views</th>
                                <th className="px-6 py-4 text-center">Completions</th>
                                <th className="px-6 py-4 text-center">Likes</th>
                                <th className="px-6 py-4 text-center">Comments</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {lessonStats.map(lesson => (
                                <tr key={lesson.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{lesson.title}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600 capitalize">
                                            {lesson.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-600">{lesson.views}</td>
                                    <td className="px-6 py-4 text-center text-slate-600">{lesson.completions}</td>
                                    <td className="px-6 py-4 text-center text-slate-600">{lesson.likes}</td>
                                    <td className="px-6 py-4 text-center text-slate-600">{lesson.comments.length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  const renderFinancials = () => {
    const scheduledTutoring = tutorSessions.filter(s => s.tutorId === user.id && s.status === 'scheduled');
    const completedTutoring = tutorSessions.filter(s => s.tutorId === user.id && s.status === 'completed');
    const pendingEarnings = scheduledTutoring.reduce((acc, s) => acc + s.price, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Earned</p>
                        <h3 className="text-3xl font-bold">{totalRevenue.toLocaleString()} pts</h3>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-300">
                            <span>Available for payout</span>
                            <button className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors">Withdraw</button>
                        </div>
                    </div>
                    <Wallet className="absolute -right-6 -bottom-6 text-white/5 w-32 h-32 rotate-12" />
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Pending Clearance</p>
                    <h3 className="text-3xl font-bold text-slate-900">{pendingEarnings.toLocaleString()} pts</h3>
                    <p className="text-xs text-slate-400 mt-2">Held for {scheduledTutoring.length} upcoming sessions</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Tutoring Revenue</p>
                    <h3 className="text-3xl font-bold text-slate-900">{tutoringRevenue.toLocaleString()} pts</h3>
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <TrendingUp size={12} /> Growing steadily
                    </p>
                </div>
            </div>

            {/* Tutor Earnings History Section */}
            {user.role === 'tutor' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Tutoring Earnings History</h3>
                            <p className="text-sm text-slate-500">Earnings from private sessions with students.</p>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                            <GraduationCap size={20} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tutorSessions.filter(s => s.tutorId === user.id).length > 0 ? (
                                    tutorSessions.filter(s => s.tutorId === user.id).map(session => (
                                        <tr key={session.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-slate-900">Learner ID: {session.studentId}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{session.subject}</td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">{session.date}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    session.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                    session.status === 'scheduled' ? 'bg-indigo-100 text-indigo-700' : 
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {session.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                {session.price} pts
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic text-sm">
                                            No tutoring session history available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* General Transaction History */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="font-bold text-lg text-slate-900">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {myTransactions.length > 0 ? (
                                myTransactions.slice(0, 10).map((tx, idx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-sm text-slate-500">{tx.id}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{tx.description}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{tx.timestamp}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-900'}`}>
                                            {tx.type === 'credit' ? '+' : '-'}{tx.amount} pts
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Settled</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic text-sm">
                                        No recent transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  const renderContentPerformance = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
           <div>
               <h3 className="font-bold text-lg text-slate-900">Box Performance</h3>
               <p className="text-slate-500 text-sm">Detailed metrics for each of your learning boxes.</p>
           </div>
           <button className="text-primary-600 text-sm font-bold hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
               Download CSV
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <th className="px-6 py-4">Box Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Learners</th>
                <th className="px-6 py-4 text-center">Lessons</th>
                <th className="px-6 py-4 text-center">Completion Rate</th>
                <th className="px-6 py-4 text-right">Revenue</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allBoxes.map((box) => (
                <tr key={box.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedBoxId(box.id)}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{box.title}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                        {box.isPrivate ? <span className="text-amber-600">Private</span> : <span className="text-green-600">Public</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600">
                      {box.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-700 font-medium">{box.subscribers.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-slate-700">{box.lessons.length}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.floor(Math.random() * 40) + 50}%` }}></div>
                       </div>
                       <span className="text-xs font-medium text-slate-600">{Math.floor(Math.random() * 40) + 50}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900">
                    {box.isPrivate && box.price ? (box.subscribers * box.price).toLocaleString() : 0} pts
                  </td>
                  <td className="px-6 py-4 text-center">
                      <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100">
                          <MoreHorizontal size={16} />
                      </button>
                  </td>
                </tr>
              ))}
              {allBoxes.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">No content created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAudienceInsights = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographics */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-4">Learner Demographics</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEMOGRAPHICS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {DEMOGRAPHICS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-lg text-slate-900 mb-4">Top Locations</h3>
           <div className="space-y-4">
              {GEO_DATA.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <MapPin size={16} />
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-slate-900">{item.name}</span>
                              <span className="text-sm font-bold text-slate-700">{item.value}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${item.value}%` }}></div>
                          </div>
                      </div>
                  </div>
              ))}
           </div>
        </div>
      </div>

      {/* Activity Times */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-4">Active Hours (UTC)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ACTIVITY_DATA}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="time" axisLine={false} tickLine={false} />
                 <YAxis axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: '#f1f5f9'}} />
                 <Bar dataKey="users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Center</h1>
          <p className="text-slate-500">Track performance, audience growth, and revenue.</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
             {(['7d', '30d', '90d'] as const).map(range => (
                 <button 
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeRange === range ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '3 Months'}
                 </button>
             ))}
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Internal Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                <NavItem id="learning" label="My Learning" icon={GraduationCap} />
                <NavItem id="overview" label="Overview" icon={LayoutDashboard} />
                <NavItem id="content" label="Content Performance" icon={BoxIcon} />
                <NavItem id="audience" label="Audience Insights" icon={Users} />
                <NavItem id="financial" label="Financial Reports" icon={FileText} />
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wide mb-1">Pro Tip</p>
                    <h4 className="font-bold text-sm mb-2">Boost your reach?</h4>
                    <p className="text-xs text-indigo-100 mb-3 opacity-90">Creators who post quizzes get 40% more engagement.</p>
                    <button className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 rounded transition-colors">
                        Create Quiz
                    </button>
                </div>
                <PieChartIcon className="absolute -bottom-4 -right-4 text-white/10 w-24 h-24" />
            </div>
        </aside>

        {/* Main Report Area */}
        <div className="flex-1 min-w-0">
           {activeReport === 'learning' && renderMyLearning()}
           {activeReport === 'overview' && renderOverview()}
           {activeReport === 'content' && (selectedBoxId ? renderSingleBoxReport() : renderContentPerformance())}
           {activeReport === 'audience' && renderAudienceInsights()}
           {activeReport === 'financial' && renderFinancials()}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
