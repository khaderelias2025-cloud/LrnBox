
import React, { useState, useMemo, useEffect } from 'react';
import { Box, User, Lesson, Group, Forum, ForumPost, Poll, PollOption } from '../types';
import LessonCard from '../components/LessonCard';
import ViewersModal from '../components/ViewersModal';
import ShareModal from '../components/ShareBoxModal';
import CertificateModal from '../components/CertificateModal';
import { generateBoxSummary } from '../services/geminiService';
import { 
  ArrowLeft, Users, Lock, CheckCircle, Unlock, Info, Award, Plus, EyeOff, 
  Link as LinkIcon, UserPlus, MessageSquare, Send, ChevronRight, MessageCircle, 
  Clock, Search, Filter, X, Vote, Check, TrendingUp, DollarSign, PieChart, Activity, BarChart2,
  Sparkles, RefreshCw, FileText, Trophy, BrainCircuit
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend
} from 'recharts';

interface BoxDetailProps {
  box: Box;
  onBack: () => void;
  isOwner?: boolean;
  onAddLesson: () => void;
  onDeleteLesson?: (boxId: string, lessonId: string) => void;
  onAddComment: (lessonId: string, text: string) => void;
  onComplete: (lessonId: string) => void;
  allUsers: User[];
  currentUser: User;
  subscribed?: boolean;
  onSubscribe?: (boxId: string) => void;
  onUnsubscribe?: (boxId: string) => void;
  onShare?: (boxId: string, userIds: string[], groupIds: string[]) => void;
  groups?: Group[];
  onSaveLesson?: (lessonId: string) => void;
  onCreateForum?: (boxId: string, title: string, description: string) => void;
  onAddForumPost?: (boxId: string, forumId: string, content: string) => void;
  onAddForumReply?: (boxId: string, forumId: string, postId: string, content: string) => void;
  onCreatePoll?: (boxId: string, question: string, options: string[]) => void;
  onVotePoll?: (boxId: string, pollId: string, optionId: string) => void;
  onUpdateLesson?: (boxId: string, lessonId: string, updates: Partial<Lesson>) => void;
}

const BoxDetail: React.FC<BoxDetailProps> = ({ 
    box, 
    onBack, 
    isOwner = false, 
    onAddLesson,
    onDeleteLesson,
    onAddComment, 
    onComplete, 
    allUsers, 
    currentUser,
    subscribed = false,
    onSubscribe,
    onUnsubscribe,
    onShare,
    groups = [],
    onSaveLesson,
    onCreateForum,
    onAddForumPost,
    onAddForumReply,
    onCreatePoll,
    onVotePoll,
    onUpdateLesson
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'summary' | 'forums' | 'polls' | 'insights'>('lessons');
  const [selectedForumId, setSelectedForumId] = useState<string | null>(null);
  const [isCreateForumOpen, setIsCreateForumOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  
  // AI Summary State
  const [boxSummary, setBoxSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumDesc, setNewForumDesc] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [replyPostId, setReplyPostId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedForumId) return;
    onAddForumPost?.(box.id, selectedForumId, newPostContent);
    setNewPostContent('');
  };

  const handleReplySubmit = (postId: string) => {
    if (!replyContent.trim() || !selectedForumId) return;
    onAddForumReply?.(box.id, selectedForumId, postId, replyContent);
    setReplyContent('');
    setReplyPostId(null);
  };

  const handleCreateForumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForumTitle.trim()) return;
    onCreateForum?.(box.id, newForumTitle, newForumDesc);
    setNewForumTitle('');
    setNewForumDesc('');
    setIsCreateForumOpen(false);
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const options = newPollOptions.filter(o => o.trim() !== '');
    if (!newPollQuestion.trim() || options.length < 2) return;
    onCreatePoll?.(box.id, newPollQuestion, options);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
    setIsCreatePollOpen(false);
  };

  const [viewersModalState, setViewersModalState] = useState<{
      isOpen: boolean;
      title: string;
      users: any[];
  }>({
      isOpen: false,
      title: '',
      users: []
  });

  const handleOpenViewers = (title: string, users: any[]) => {
      setViewersModalState({
          isOpen: true,
          title,
          users
      });
  };
  
  const [sharingLesson, setSharingLesson] = useState<Lesson | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [isShareBoxOpen, setIsShareBoxOpen] = useState(false);

  const selectedForum = box.forums?.find(f => f.id === selectedForumId);

  // Auto-generate summary on component mount if user is subscribed
  useEffect(() => {
    if (subscribed && !boxSummary && box.lessons.length > 0) {
        handleGenerateSummary();
    }
  }, [subscribed, box.lessons.length]);

  const handleGenerateSummary = async () => {
    if (box.lessons.length === 0) return;
    setIsGeneratingSummary(true);
    try {
      const summary = await generateBoxSummary(box);
      setBoxSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // --- Insights Data Derivation ---
  const insightsData = useMemo(() => {
    if (!isOwner) return null;

    const engagement = [
        { day: 'Mon', views: 45, completions: 32 },
        { day: 'Tue', views: 52, completions: 38 },
        { day: 'Wed', views: 48, completions: 41 },
        { day: 'Thu', views: 70, completions: 55 },
        { day: 'Fri', views: 85, completions: 62 },
        { day: 'Sat', views: 65, completions: 45 },
        { day: 'Sun', views: 92, completions: 78 },
    ];

    const totalRevenue = box.isPrivate && box.price ? box.subscribers * box.price : 0;
    const lessonMetrics = box.lessons.map(l => ({
        id: l.id,
        title: l.title,
        views: (l.completionCount || 0) + Math.floor(Math.random() * 50),
        completions: l.completionCount || 0,
        likes: l.likes || 0,
        comments: l.comments?.length || 0,
        avgScore: l.type === 'quiz' ? Math.floor(Math.random() * 20) + 75 : null
    }));

    const activeSubscribers = allUsers.filter(u => u.subscribedBoxIds?.includes(box.id));
    return { engagement, totalRevenue, lessonMetrics, activeSubscribers };
  }, [box, isOwner, allUsers]);

  const accessLevel = box.accessLevel || (box.isPrivate ? (box.price && box.price > 0 ? 'premium' : 'invite_only') : 'public');

  if (accessLevel === 'private' && !isOwner) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <EyeOff size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
              <p className="text-slate-500 mb-6">This content is private and visible only to the creator.</p>
              <button onClick={onBack} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors">Go Back</button>
          </div>
      );
  }

  const isPaid = accessLevel === 'premium' && (box.price || 0) > 0;
  const isInviteOnly = accessLevel === 'invite_only';
  const isInvited = box.sharedWithUserIds?.includes(currentUser.id);
  const isSharedWithUserGroup = box.sharedWithGroupIds?.some(groupId => {
      const group = groups.find(g => g.id === groupId);
      return group ? group.memberIds.includes(currentUser.id) : false;
  });

  const isAccessAllowed = isOwner || subscribed || (!isInviteOnly && !isPaid) || (isInviteOnly && (isInvited || isSharedWithUserGroup));
  const isContentLocked = !isAccessAllowed;

  const completedLessonsCount = box.lessons.filter(l => l.isCompleted || l.completedByUserIds?.includes(currentUser.id)).length;
  const totalLessons = box.lessons.length;
  const isCourseCompleted = totalLessons > 0 && completedLessonsCount === totalLessons;

  const renderStatistics = () => {
    if (!insightsData) return null;
    const { engagement, totalRevenue, lessonMetrics, activeSubscribers } = insightsData;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={20} /></div>
                        <span className="text-sm font-bold text-slate-500">Active Learners</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900">{box.subscribers}</h3>
                        <span className="text-xs font-bold text-green-600 flex items-center gap-0.5"><TrendingUp size={12}/> +4%</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20} /></div>
                        <span className="text-sm font-bold text-slate-500">Total Revenue</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900">{totalRevenue} <span className="text-sm font-normal">pts</span></h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><CheckCircle size={20} /></div>
                        <span className="text-sm font-bold text-slate-500">Avg. Completion</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900">74%</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Activity size={20} /></div>
                        <span className="text-sm font-bold text-slate-500">Engagement</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900">High</h3>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-slate-900">Weekly Engagement Trends</h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-primary-600"></div> Views</div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-indigo-200"></div> Completions</div>
                    </div>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={engagement}>
                            <defs>
                                <linearGradient id="colorViews" x1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0a66c2" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#0a66c2" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="views" stroke="#0a66c2" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                            <Area type="monotone" dataKey="completions" stroke="#c7d2fe" strokeWidth={3} fill="#e0e7ff" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-lg text-slate-900">Lesson Performance</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">Lesson Title</th>
                                <th className="px-6 py-4 text-center">Views</th>
                                <th className="px-6 py-4 text-center">Completions</th>
                                <th className="px-6 py-4 text-center">Likes</th>
                                <th className="px-6 py-4 text-center">Avg. Score</th>
                                <th className="px-6 py-4 text-right">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {lessonMetrics.map(l => (
                                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-sm text-slate-800">{l.title}</td>
                                    <td className="px-6 py-4 text-center text-sm text-slate-600 font-medium">{l.views}</td>
                                    <td className="px-6 py-4 text-center text-sm text-slate-600 font-medium">{l.completions}</td>
                                    <td className="px-6 py-4 text-center text-sm text-slate-600 font-medium">{l.likes}</td>
                                    <td className="px-6 py-4 text-center">
                                        {l.avgScore ? (
                                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{l.avgScore}%</span>
                                        ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right"><TrendingUp size={16} className="ml-auto text-green-500" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-900">Learner Roster</h3>
                    {activeSubscribers.length > 0 && (
                        <button 
                            onClick={() => handleOpenViewers('Box Participants', activeSubscribers)}
                            className="text-sm font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1 transition-colors"
                        >
                            View All {activeSubscribers.length > 6 && `(${activeSubscribers.length})`} <ChevronRight size={16} />
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSubscribers.slice(0, 6).map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-primary-200 transition-colors">
                            <div className="flex items-center gap-3">
                                <img src={sub.avatar} className="w-10 h-10 rounded-full object-cover" alt={sub.name} />
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{sub.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase">{sub.role}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-primary-600">{Math.floor(Math.random() * 100)}% Done</p>
                                <p className="text-[10px] text-slate-400">Active recently</p>
                            </div>
                        </div>
                    ))}
                    {activeSubscribers.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
                            <Users size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 italic font-medium">No subscribers yet.</p>
                            <p className="text-xs text-slate-400">Invite people to join your learning box!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const renderSummary = () => (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
          <Sparkles size={120} className="text-primary-600" />
        </div>
        
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Curriculum Digest</h2>
              <p className="text-sm text-slate-500">AI-powered synthesis of all box posts</p>
            </div>
            {boxSummary && (
               <button 
                onClick={handleGenerateSummary}
                className="ml-auto p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                title="Regenerate summary"
               >
                 <RefreshCw size={20} className={isGeneratingSummary ? 'animate-spin' : ''} />
               </button>
            )}
          </div>

          {isGeneratingSummary ? (
            <div className="space-y-4 py-4">
              <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded-full w-5/6 animate-pulse"></div>
              <div className="pt-6 space-y-3">
                <div className="h-6 bg-slate-100 rounded-lg w-40 animate-pulse"></div>
                <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse"></div>
                <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse"></div>
              </div>
            </div>
          ) : boxSummary ? (
            <div className="prose prose-slate max-w-none">
              <div className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                {boxSummary}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><FileText size={14} /> {box.lessons.length} Posts</div>
                <div className="flex items-center gap-1.5"><Activity size={14} /> {box.difficulty} level</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
               <p className="text-slate-500 italic mb-4">
                 {box.lessons.length > 0 
                    ? "Click to synthesize a curriculum overview from all posts in this box."
                    : "Add some posts to this box first to generate an AI summary."}
               </p>
               <button 
                onClick={handleGenerateSummary}
                disabled={box.lessons.length === 0}
                className="bg-primary-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center gap-2 mx-auto disabled:opacity-50"
               >
                 <Sparkles size={20} /> Generate Synthesis
               </button>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary-50/50 to-transparent -ml-16 -mb-16 rounded-full"></div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
           <h4 className="font-bold text-indigo-900 mb-1 flex items-center gap-2"><Clock size={16} /> Time Investment</h4>
           <p className="text-sm text-indigo-700">Estimated {box.lessons.length * 5} minutes of focused learning.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
           <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-2"><Trophy size={16} /> Skill Level</h4>
           <p className="text-sm text-emerald-700">{box.difficulty} - suitable for {box.ageGroup}.</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
           <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-2"><CheckCircle size={16} /> Outcome</h4>
           <p className="text-sm text-amber-700">Receive a certificate upon completing {box.lessons.length} lessons.</p>
        </div>
      </div>
    </div>
  );

  const renderForumPost = (post: ForumPost, isReply = false) => (
    <div key={post.id} className={`${isReply ? 'ml-10 mt-3 border-l-2 border-slate-200 pl-4' : 'bg-white border border-slate-200 rounded-xl p-4 mb-4'}`}>
        <div className="flex gap-3">
            <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">{post.userName}</h4>
                    <span className="text-[10px] text-slate-400">{post.timestamp}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                {!isReply && (
                    <div className="mt-3 flex items-center gap-4">
                        <button onClick={() => setReplyPostId(replyPostId === post.id ? null : post.id)} className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"><MessageSquare size={12} /> Reply ({post.replies.length})</button>
                    </div>
                )}
                {replyPostId === post.id && (
                    <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                        <textarea className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900" placeholder="Write a reply..." rows={2} value={replyContent} onChange={e => setReplyContent(e.target.value)} />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setReplyPostId(null)} className="text-xs text-slate-500 font-bold hover:underline">Cancel</button>
                            <button onClick={() => handleReplySubmit(post.id)} disabled={!replyContent.trim()} className="bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors disabled:opacity-50">Send Reply</button>
                        </div>
                    </div>
                )}
                {post.replies.map(reply => renderForumPost(reply, true))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={18} className="mr-2" /> Back
        </button>
        {isOwner && (
            <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('insights')} 
                  className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'insights' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                >
                    <BarChart2 size={16} /> View Reports
                </button>
                <button onClick={onAddLesson} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <Plus size={16} /> Add Lesson
                </button>
            </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
        <div className="h-60 w-full relative">
          <img src={box.coverImage} alt={box.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-6 left-8 right-8 text-white flex justify-between items-end">
             <div className="flex-1 mr-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{box.category}</span>
                    {accessLevel === 'premium' && <span className="bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><Lock size={10} /> Premium</span>}
                </div>
                <h1 className="text-4xl font-bold">{box.title}</h1>
                <p className="text-slate-200 text-sm mt-2 opacity-90 line-clamp-2">{box.description}</p>
             </div>
             <div className="flex flex-col gap-3 shrink-0">
                {isCourseCompleted && !isContentLocked && box.hasCertificate && (
                    <button onClick={() => setShowCertificate(true)} className="bg-yellow-400 text-yellow-900 hover:bg-yellow-300 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-xl animate-enter">
                        <Award size={22} /> Get Certificate
                    </button>
                )}
             </div>
          </div>
        </div>
        
        {!isContentLocked && box.lessons.length > 0 && (
            <div className="bg-slate-50 border-b border-slate-200 p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-primary-600 shrink-0 mt-1">
                        <BrainCircuit size={18} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Curriculum Summary</h4>
                            {!boxSummary && (
                                <button 
                                    onClick={handleGenerateSummary}
                                    disabled={isGeneratingSummary}
                                    className="text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                                >
                                    {isGeneratingSummary ? 'Thinking...' : <><RefreshCw size={10} /> Generate</>}
                                </button>
                            )}
                        </div>
                        {isGeneratingSummary ? (
                            <div className="space-y-2">
                                <div className="h-3 bg-slate-200 rounded-full w-3/4 animate-pulse"></div>
                                <div className="h-3 bg-slate-200 rounded-full w-1/2 animate-pulse"></div>
                            </div>
                        ) : boxSummary ? (
                            <div className="relative group">
                                <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed italic">
                                    {boxSummary}
                                </p>
                                <button 
                                    onClick={() => setActiveTab('summary')}
                                    className="text-xs font-bold text-primary-600 mt-1 hover:underline"
                                >
                                    Read Full Synthesis →
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Curated curriculum overview ready for generation.</p>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div className="flex border-b border-slate-100 px-4 bg-white overflow-x-auto no-scrollbar">
            <button 
                onClick={() => setActiveTab('lessons')}
                className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'lessons' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Plus size={18} /> Lessons
            </button>
            <button 
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'summary' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Sparkles size={18} /> AI Summary
            </button>
            <button 
                onClick={() => setActiveTab('forums')}
                className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'forums' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <MessageSquare size={18} /> Forums
            </button>
            <button 
                onClick={() => setActiveTab('polls')}
                className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'polls' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Vote size={18} /> Polls
            </button>
            {isOwner && (
                <button 
                    onClick={() => setActiveTab('insights')}
                    className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'insights' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <TrendingUp size={18} /> Insights
                </button>
            )}
        </div>
      </div>

      {isContentLocked ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm max-w-2xl mx-auto mt-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <Lock size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Content Locked</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">Join this learning box to access all lessons, quizzes, and participate in community discussions.</p>
              <button onClick={() => onSubscribe?.(box.id)} className="bg-primary-600 text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-primary-600/30 hover:bg-primary-700 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto">
                  <Plus size={20} /> Join for Free
              </button>
          </div>
      ) : (
          <div className="animate-in fade-in duration-300">
            {activeTab === 'lessons' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900">Lessons ({box.lessons.length})</h2>
                    {box.lessons.length > 0 ? (
                        <div className="space-y-4">
                            {box.lessons.map(lesson => (
                                <LessonCard 
                                    key={lesson.id} 
                                    lesson={lesson} 
                                    box={box}
                                    onLike={() => {}} 
                                    onComplete={onComplete}
                                    onAddComment={onAddComment}
                                    friendsWhoCompleted={lesson.completedByUserIds?.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[]}
                                    onShowCompleters={(users) => handleOpenViewers('Completed by', users)}
                                    onShare={() => setSharingLesson(lesson)}
                                    isSaved={currentUser.savedLessonIds?.includes(lesson.id)}
                                    onSave={onSaveLesson}
                                    onDelete={isOwner ? (lid) => onDeleteLesson?.(box.id, lid) : undefined}
                                    onUpdateLesson={onUpdateLesson}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">No lessons added yet.</div>
                    )}
                </div>
            )}

            {activeTab === 'summary' && renderSummary()}

            {activeTab === 'forums' && (
                <div className="space-y-6">
                    {selectedForumId ? (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                             <div className="flex items-center gap-4 mb-6">
                                <button onClick={() => setSelectedForumId(null)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"><ArrowLeft size={20} /></button>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{selectedForum?.title}</h2>
                                    <p className="text-sm text-slate-500">{selectedForum?.description}</p>
                                </div>
                             </div>
                             <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><MessageCircle size={18} className="text-primary-600" /> Start a new discussion topic</h3>
                                <form onSubmit={handlePostSubmit}>
                                    <textarea className="w-full border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900 min-h-[100px] resize-none" placeholder="What would you like to discuss?" value={newPostContent} onChange={e => setNewPostContent(e.target.value)} />
                                    <div className="flex justify-end mt-3"><button type="submit" disabled={!newPostContent.trim()} className="bg-primary-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"><Send size={18} /> Post Topic</button></div>
                                </form>
                             </div>
                             <div className="space-y-4">
                                <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-2">Recent Discussions</h3>
                                {selectedForum?.posts.map(post => renderForumPost(post))}
                             </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-900">Discussion Forums</h2>{isOwner && <button onClick={() => setIsCreateForumOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-primary-700 shadow-sm"><Plus size={16} /> Create Forum</button>}</div>
                            <div className="grid grid-cols-1 gap-4">
                                {box.forums && box.forums.length > 0 ? box.forums.map(forum => (
                                    <div key={forum.id} onClick={() => setSelectedForumId(forum.id)} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-primary-200 cursor-pointer transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-colors"><MessageSquare size={24} /></div>
                                            <div><h3 className="font-bold text-slate-900 text-lg">{forum.title}</h3><p className="text-sm text-slate-500 mt-1">{forum.description}</p></div>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" size={24} />
                                    </div>
                                )) : <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500"><MessageSquare size={48} className="mx-auto mb-4 opacity-20" /><p className="font-medium">No discussion forums created yet.</p></div>}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'polls' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-900">Discussion Polls</h2>{isOwner && <button onClick={() => setIsCreatePollOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-primary-700 shadow-sm"><Plus size={16} /> Create Poll</button>}</div>
                    <div className="grid grid-cols-1 gap-6">
                        {box.polls && box.polls.length > 0 ? box.polls.map(poll => {
                            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                            const hasVoted = poll.options.some(opt => opt.voterIds.includes(currentUser.id));
                            return (
                                <div key={poll.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex justify-between items-start mb-4"><h3 className="font-bold text-slate-900 text-lg leading-tight">{poll.question}</h3>{hasVoted && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Check size={10} /> Voted</span>}</div>
                                    <div className="space-y-3 mb-4">
                                        {poll.options.map(option => {
                                            const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                                            const isSelected = option.voterIds.includes(currentUser.id);
                                            if (hasVoted || isOwner) return (
                                                <div key={option.id} className="relative">
                                                    <div className="flex justify-between items-center mb-1 text-sm"><span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-slate-700'}`}>{option.text}</span><span className="font-bold text-slate-900">{percentage}%</span></div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${isSelected ? 'bg-primary-600' : 'bg-slate-300'}`} style={{ width: `${percentage}%` }} /></div>
                                                </div>
                                            );
                                            return <button key={option.id} onClick={() => onVotePoll?.(box.id, poll.id, option.id)} className="w-full text-left p-3.5 border border-slate-200 rounded-xl text-sm font-medium hover:border-primary-50 hover:bg-white text-slate-900 transition-all">{option.text}</button>;
                                        })}
                                    </div>
                                    <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-50">{totalVotes} total votes • Created {poll.createdAt}</div>
                                </div>
                            );
                        }) : <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500"><Vote size={48} className="mx-auto mb-4 opacity-20" /><p className="font-medium">No polls available.</p></div>}
                    </div>
                </div>
            )}

            {activeTab === 'insights' && isOwner && renderStatistics()}
          </div>
      )}

      {isCreateForumOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateForumOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="font-bold text-lg text-slate-900">Create Discussion Forum</h2>
                    <button onClick={() => setIsCreateForumOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleCreateForumSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Forum Title</label>
                        <input required className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900" placeholder="e.g. General Help..." value={newForumTitle} onChange={e => setNewForumTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                        <textarea className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900 min-h-[80px]" placeholder="What is this forum for?" value={newForumDesc} onChange={e => setNewForumDesc(e.target.value)} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setIsCreateForumOpen(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all text-sm">Create Forum</button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {isCreatePollOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreatePollOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Vote size={20} className="text-primary-600" /> Create Poll</h2>
                    <button onClick={() => setIsCreatePollOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleCreatePollSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Question</label>
                        <textarea required className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900 min-h-[60px] resize-none" placeholder="What do you want to ask?" value={newPollQuestion} onChange={e => setNewPollQuestion(e.target.value)} />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Options</label>
                        {newPollOptions.map((opt, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input required={idx < 2} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => { const next = [...newPollOptions]; next[idx] = e.target.value; setNewPollOptions(next); }} />
                                {idx >= 2 && <button type="button" onClick={() => setNewPollOptions(newPollOptions.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><X size={20} /></button>}
                            </div>
                        ))}
                        {newPollOptions.length < 6 && <button type="button" onClick={() => setNewPollOptions([...newPollOptions, ''])} className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"><Plus size={14} /> Add another option</button>}
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsCreatePollOpen(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancel</button>
                        <button type="submit" disabled={!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all text-sm disabled:opacity-50">Create Poll</button>
                    </div>
                </form>
            </div>
          </div>
      )}

      <ViewersModal isOpen={viewersModalState.isOpen} onClose={() => setViewersModalState(prev => ({...prev, isOpen: false}))} viewers={viewersModalState.users} onViewProfile={(id) => console.log('Navigating to profile', id)} title={viewersModalState.title} />
      {sharingLesson && <ShareModal isOpen={true} onClose={() => setSharingLesson(null)} item={{ id: sharingLesson.id, title: sharingLesson.title, type: 'Lesson' }} allUsers={allUsers} currentUser={currentUser} onShare={() => setSharingLesson(null)} groups={groups} />}
      {isShareBoxOpen && <ShareModal isOpen={true} onClose={() => setIsShareBoxOpen(false)} item={{ id: box.id, title: box.title, type: 'Box', sharedWithUserIds: box.sharedWithUserIds }} allUsers={allUsers} currentUser={currentUser} onShare={(boxId, userIds, groupIds) => { if(onShare) onShare(boxId, userIds, groupIds); setIsShareBoxOpen(false); }} groups={groups} />}
      <CertificateModal isOpen={showCertificate} onClose={() => setShowCertificate(false)} user={currentUser} box={box} />
    </div>
  );
};

export default BoxDetail;
