
import React, { useState, useRef } from 'react';
/* Added TutorSession to imports from types */
import { User, Box, Group, TutorSession } from '../types';
/* Added Clock to the imports from lucide-react */
import { Package, Users, ArrowLeft, BookOpen, Building2, Download, Upload, Database, RefreshCw, Plus, Check, GraduationCap, Video, Clock } from 'lucide-react';
import BoxCard from '../components/BoxCard';
import ShareModal from '../components/ShareBoxModal';
import { storageService } from '../services/storage';

interface UserProfileProps {
  user: User;
  currentUser: User;
  allUsers: User[];
  onBack: () => void;
  onToggleFollow: (userId: string) => void;
  userBoxes: Box[]; // Boxes created by this user
  subscribedBoxes: Box[]; // Boxes this user is subscribed to
  onViewBox: (boxId: string) => void;
  onSubscribe: (boxId: string) => void;
  onUnsubscribe?: (boxId: string) => void;
  onShare: (boxId: string, userIds: string[], cohortIds: string[]) => void;
  favoriteBoxIds: string[];
  /* Removed duplicate onToggleFollow identifier */
  onToggleFavorite: (boxId: string) => void;
  groups?: Group[];
  /* Added tutorSessions to UserProfileProps to fix type error in App.tsx */
  tutorSessions?: TutorSession[];
}

const UserProfile: React.FC<UserProfileProps> = ({ 
    user, 
    currentUser, 
    allUsers,
    onBack, 
    onToggleFollow, 
    userBoxes,
    subscribedBoxes,
    onViewBox,
    onSubscribe,
    onUnsubscribe,
    onShare,
    favoriteBoxIds,
    onToggleFavorite,
    groups,
    tutorSessions = []
}) => {
  const isFollowing = currentUser.following.includes(user.id);
  const isOwnProfile = currentUser.id === user.id;
  const [activeTab, setActiveTab] = useState<'created' | 'subscribed' | 'sessions'>('created');
  
  const [sharingBox, setSharingBox] = useState<Box | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter tutoring sessions involving this user
  const relevantSessions = tutorSessions.filter(s => s.studentId === user.id || s.tutorId === user.id);

  const handleBackup = () => {
    const data = storageService.createBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lrnbox-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const success = storageService.restoreBackup(json);
        if (success) {
          alert('Backup restored successfully! refreshing...');
          window.location.reload();
        } else {
          alert('Failed to restore backup. Invalid file format.');
        }
      } catch (err) {
        console.error(err);
        alert('Error reading backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back
      </button>

      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8 shadow-sm">
        <div 
          className="h-48 bg-slate-200 bg-cover bg-center"
          style={{ backgroundImage: `url(${user.banner || 'https://picsum.photos/seed/bg/1000/300'})` }}
        />
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-4">
             <div className="flex items-end gap-4">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-full border-4 border-white bg-white object-cover shadow-sm"
                />
                <div className="mb-1">
                   <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                   <p className="text-slate-500 font-medium">{user.handle}</p>
                </div>
             </div>
             
             {!isOwnProfile && (
                <button 
                  onClick={() => onToggleFollow(user.id)}
                  className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
                    isFollowing 
                      ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                      : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20'
                  }`}
                >
                  {isFollowing ? (
                    <>Following</>
                  ) : (
                    <><Plus size={18} /> Follow</>
                  )}
                </button>
             )}
          </div>

          <div className="mb-6">
             {user.role === 'institute' && (
                <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold border border-indigo-100 mb-2">
                   {user.instituteType || 'Institute'}
                </span>
             )}
             <p className="text-slate-600 leading-relaxed max-w-2xl">{user.bio}</p>
          </div>

          <div className="flex gap-6 border-t border-slate-100 pt-4">
             <div className="text-center">
                <span className="block font-bold text-lg text-slate-900">{userBoxes.length}</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wide">Boxes</span>
             </div>
             <div className="text-center">
                <span className="block font-bold text-lg text-slate-900">{user.followers.length}</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wide">Followers</span>
             </div>
             <div className="text-center">
                <span className="block font-bold text-lg text-slate-900">{user.following.length}</span>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wide">Following</span>
             </div>
             {isOwnProfile && (
               <div className="ml-auto flex gap-2">
                  <button 
                    onClick={handleBackup}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    title="Backup Data"
                  >
                    <Download size={16} /> Backup
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    title="Restore Data"
                  >
                    <Upload size={16} /> Restore
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleRestore} 
                  />
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('created')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'created' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Package size={18} /> Created Boxes
        </button>
        <button 
          onClick={() => setActiveTab('subscribed')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'subscribed' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <BookOpen size={18} /> Subscribed
        </button>
        {isOwnProfile && (
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'sessions' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <GraduationCap size={18} /> Tutoring
          </button>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'created' && (
           userBoxes.length > 0 ? (
             userBoxes.map(box => (
               <BoxCard 
                 key={box.id} 
                 box={box} 
                 onClick={onViewBox}
                 onSubscribe={onSubscribe}
                 subscribed={false} // Created by user
                 onShare={() => setSharingBox(box)}
                 isFavorite={favoriteBoxIds.includes(box.id)}
                 onToggleFavorite={onToggleFavorite}
               />
             ))
           ) : (
             <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
               <Package size={48} className="mx-auto text-slate-300 mb-3" />
               <p className="font-medium">No boxes created yet.</p>
             </div>
           )
        )}
        {activeTab === 'subscribed' && (
           subscribedBoxes.length > 0 ? (
             subscribedBoxes.map(box => (
               <BoxCard 
                 key={box.id} 
                 box={box} 
                 onClick={onViewBox}
                 onSubscribe={onSubscribe}
                 onUnsubscribe={onUnsubscribe}
                 subscribed={true}
                 onShare={() => setSharingBox(box)}
                 isFavorite={favoriteBoxIds.includes(box.id)}
                 onToggleFavorite={onToggleFavorite}
               />
             ))
           ) : (
             <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
               <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
               <p className="font-medium">No subscriptions yet.</p>
             </div>
           )
        )}
        {activeTab === 'sessions' && isOwnProfile && (
            <div className="col-span-full space-y-4">
                {relevantSessions.length > 0 ? relevantSessions.map(session => {
                    const otherUser = allUsers.find(u => u.id === (session.studentId === user.id ? session.tutorId : session.studentId));
                    return (
                        <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 flex-1">
                                <img src={otherUser?.avatar} alt={otherUser?.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900">{session.subject}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${session.studentId === user.id ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                            {session.studentId === user.id ? 'Learning' : 'Teaching'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">{session.studentId === user.id ? `Tutor: ${otherUser?.name}` : `Student: ${otherUser?.name}`}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {session.date} at {session.time}</span>
                                        <span className="flex items-center gap-1">• {session.duration} mins</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 w-full sm:w-auto">
                                <a 
                                    href={session.meetingUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
                                >
                                    <Video size={18} /> Join Meeting
                                </a>
                                <button className="px-6 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-lg transition-colors">Reschedule</button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                        <GraduationCap size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="font-medium">No upcoming tutoring sessions.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {sharingBox && (
          <ShareModal
            isOpen={true}
            onClose={() => setSharingBox(null)}
            item={{ id: sharingBox.id, title: sharingBox.title, type: 'Box', sharedWithUserIds: sharingBox.sharedWithUserIds }}
            allUsers={allUsers}
            currentUser={currentUser}
            onShare={(boxId, userIds, cohortIds) => {
                onShare(boxId, userIds, cohortIds);
                setSharingBox(null);
            }}
            groups={groups}
          />
      )}
    </div>
  );
};

export default UserProfile;
