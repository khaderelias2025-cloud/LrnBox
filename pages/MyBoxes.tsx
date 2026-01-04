
import React, { useState } from 'react';
import { Box, User, Group, Lesson } from '../types';
import BoxCard from '../components/BoxCard';
import LessonCard from '../components/LessonCard';
import EditBoxModal from '../components/EditBoxModal';
import PromoteBoxModal from '../components/PromoteBoxModal';
import ShareModal from '../components/ShareBoxModal';
import ViewersModal from '../components/ViewersModal';
import { Lock, Globe, Plus, DollarSign, Search, Filter, X, Edit2, Package, BookOpen, Rocket, Share2, Users, Star, Bookmark, Trash2 } from 'lucide-react';

interface MyBoxesProps {
  createdBoxes: Box[];
  subscribedBoxes: Box[];
  sharedWithMeBoxes: Box[];
  allBoxes: Box[];
  allUsers: User[];
  onTogglePrivacy: (boxId: string) => void;
  onUpdatePrice: (boxId: string, price: number) => void;
  onViewBox: (boxId: string) => void;
  onCreateBox: () => void;
  onUpdateBox: (box: Box) => void;
  onDeleteBox?: (boxId: string) => void;
  onPromote: (boxId: string, cost: number, plan: string) => void;
  onShare: (boxId: string, userIds: string[], groupIds: string[]) => void;
  userPoints: number;
  currentUser: User;
  favoriteBoxIds?: string[];
  onToggleFavorite?: (boxId: string) => void;
  onNavigateToExplore: () => void;
  onUnsubscribe?: (boxId: string) => void;
  groups?: Group[];
  onSaveLesson?: (lessonId: string) => void;
  onDeleteLesson?: (boxId: string, lessonId: string) => void;
}

const MyBoxes: React.FC<MyBoxesProps> = ({ 
    createdBoxes, 
    subscribedBoxes,
    sharedWithMeBoxes,
    allBoxes,
    allUsers,
    onTogglePrivacy, 
    onUpdatePrice, 
    onViewBox, 
    onCreateBox, 
    onUpdateBox, 
    onDeleteBox,
    onPromote, 
    onShare, 
    userPoints, 
    currentUser, 
    favoriteBoxIds = [], 
    onToggleFavorite, 
    onNavigateToExplore, 
    onUnsubscribe, 
    groups,
    onSaveLesson,
    onDeleteLesson
}) => {
  const [activeTab, setActiveTab] = useState<'created' | 'subscribed' | 'shared' | 'favorites' | 'saved_posts'>('created');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [promotingBox, setPromotingBox] = useState<Box | null>(null);
  const [sharingBox, setSharingBox] = useState<Box | null>(null);
  
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

  // Filter States
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'public' | 'private'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  // Derive Favorites List
  const favoriteBoxes = allBoxes.filter(b => favoriteBoxIds.includes(b.id));

  // Determine current list to display
  let currentBoxes: Box[] = [];
  if (activeTab === 'created') currentBoxes = createdBoxes;
  else if (activeTab === 'subscribed') currentBoxes = subscribedBoxes;
  else if (activeTab === 'shared') currentBoxes = sharedWithMeBoxes;
  else if (activeTab === 'favorites') currentBoxes = favoriteBoxes;

  // Filter Logic
  const filteredBoxes = currentBoxes.filter(box => {
      const matchesSearch = box.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            box.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesPrivacy = true;
      if (filterPrivacy === 'public') matchesPrivacy = !box.isPrivate;
      if (filterPrivacy === 'private') matchesPrivacy = box.isPrivate;

      const matchesCategory = selectedCategory === 'All' || box.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || box.difficulty === selectedDifficulty;

      return matchesSearch && matchesPrivacy && matchesCategory && matchesDifficulty;
  });

  const categories = Array.from(new Set(allBoxes.map(b => b.category))).sort();
  const difficulties = Array.from(new Set(allBoxes.map(b => b.difficulty || 'Beginner'))).sort();

  // Saved Posts Logic
  const savedLessons = React.useMemo(() => {
      if (activeTab !== 'saved_posts' || !currentUser.savedLessonIds) return [];
      
      const savedIds = new Set(currentUser.savedLessonIds);
      const results: { lesson: Lesson, box: Box }[] = [];
      
      allBoxes.forEach(box => {
          box.lessons.forEach(lesson => {
              if (savedIds.has(lesson.id)) {
                  if (searchTerm) {
                      if (lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lesson.content.toLowerCase().includes(searchTerm.toLowerCase())) {
                          results.push({ lesson, box });
                      }
                  } else {
                      results.push({ lesson, box });
                  }
              }
          });
      });
      return results;
  }, [allBoxes, currentUser.savedLessonIds, searchTerm, activeTab]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
              <button onClick={() => setActiveTab('created')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'created' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  <Package size={16} /> Created
              </button>
              <button onClick={() => setActiveTab('subscribed')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'subscribed' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  <BookOpen size={16} /> Learning
              </button>
              <button onClick={() => setActiveTab('shared')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'shared' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  <Users size={16} /> Shared with me
              </button>
              <button onClick={() => setActiveTab('favorites')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'favorites' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  <Star size={16} /> Favorites
              </button>
              <button onClick={() => setActiveTab('saved_posts')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'saved_posts' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                  <Bookmark size={16} /> Saved Posts
              </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={onCreateBox}
                className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                  <Plus size={16} /> New Box
              </button>
          </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                  type="text" 
                  placeholder={activeTab === 'saved_posts' ? "Search saved posts..." : "Search boxes..."}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          {activeTab !== 'saved_posts' && (
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold border flex items-center gap-2 transition-colors ${showFilters ? 'bg-slate-100 border-slate-300 text-slate-800' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                  <Filter size={16} /> Filters
              </button>
          )}
      </div>

      {/* Expanded Filters */}
      {showFilters && activeTab !== 'saved_posts' && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Privacy</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                    value={filterPrivacy}
                    onChange={(e) => setFilterPrivacy(e.target.value as any)}
                  >
                      <option value="all">All</option>
                      <option value="public">Public</option>
                      <option value="private">Private / Premium</option>
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                      <option value="All">All Categories</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Difficulty</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none"
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                  >
                      <option value="All">All Levels</option>
                      {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
              </div>
          </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'saved_posts' ? (
              savedLessons.length > 0 ? (
                  <div className="col-span-full space-y-4">
                      {savedLessons.map(({ lesson, box }) => (
                          <div key={lesson.id} className="max-w-2xl mx-auto">
                              <LessonCard 
                                  lesson={lesson}
                                  box={box}
                                  onLike={() => {}} 
                                  onComplete={() => {}} 
                                  onAddComment={() => {}} 
                                  onShare={() => {}} 
                                  isSaved={true}
                                  onSave={onSaveLesson}
                                  onDelete={box.creatorId === currentUser.id ? (lid) => onDeleteLesson?.(box.id, lid) : undefined}
                                  friendsWhoCompleted={lesson.completedByUserIds?.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[]}
                                  onShowCompleters={(users) => handleOpenViewers('Completed by', users)}
                              />
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <Bookmark size={32} className="mx-auto mb-2 text-slate-300" />
                      <h3 className="text-lg font-bold text-slate-700 mb-1">No saved posts yet</h3>
                      <p className="text-slate-500 mb-4">Bookmark lessons to read them later.</p>
                      <button onClick={onNavigateToExplore} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-700 transition-colors">
                          Explore Content
                      </button>
                  </div>
              )
          ) : (
              filteredBoxes.length > 0 ? (
                  filteredBoxes.map(box => (
                      <div key={box.id} className="relative">
                          <BoxCard 
                              box={box}
                              onClick={onViewBox}
                              onSubscribe={() => onViewBox(box.id)}
                              onUnsubscribe={activeTab === 'subscribed' ? onUnsubscribe : undefined}
                              subscribed={activeTab === 'subscribed' || activeTab === 'created'}
                              onShare={() => setSharingBox(box)}
                              isFavorite={favoriteBoxIds.includes(box.id)}
                              onToggleFavorite={onToggleFavorite}
                          />
                          {/* Creator Actions Overlay */}
                          {activeTab === 'created' && (
                              <div className="absolute top-[108px] left-2 flex gap-1 z-20">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setPromotingBox(box); }}
                                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-md shadow-sm text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                    title="Promote Box"
                                  >
                                      <Rocket size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingBox(box); }}
                                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-md shadow-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                    title="Edit Box"
                                  >
                                      <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteBox?.(box.id); }}
                                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-md shadow-sm text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                                    title="Delete Box"
                                  >
                                      <Trash2 size={14} />
                                  </button>
                              </div>
                          )}
                      </div>
                  ))
              ) : (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <div className="mx-auto w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                          {activeTab === 'created' ? <Package size={32} /> : activeTab === 'subscribed' ? <BookOpen size={32} /> : activeTab === 'favorites' ? <Star size={32} /> : <Users size={32} />}
                      </div>
                      <h3 className="text-lg font-bold text-slate-700 mb-1">
                          {activeTab === 'created' ? 'No boxes created yet' : 
                           activeTab === 'subscribed' ? 'No subscriptions yet' : 
                           activeTab === 'favorites' ? 'No favorites yet' : 'No boxes shared with you'}
                      </h3>
                      <p className="text-slate-500 mb-4">
                          {activeTab === 'created' ? 'Start sharing your knowledge today.' : 
                           activeTab === 'subscribed' ? 'Explore content to start learning.' : 
                           activeTab === 'favorites' ? 'Mark content as favorite to see it here.' : 'Content shared with you will appear here.'}
                      </p>
                      {activeTab === 'created' ? (
                          <button onClick={onCreateBox} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-700 transition-colors">
                              Create First Box
                          </button>
                      ) : activeTab === 'subscribed' ? (
                          <button onClick={onNavigateToExplore} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-700 transition-colors">
                              Explore Content
                          </button>
                      ) : null}
                  </div>
              )
          )}
      </div>

      {/* Modals */}
      {editingBox && (
          <EditBoxModal 
            isOpen={true}
            onClose={() => setEditingBox(null)}
            box={editingBox}
            onSave={onUpdateBox}
          />
      )}

      {promotingBox && (
          <PromoteBoxModal 
            isOpen={true}
            onClose={() => setPromotingBox(null)}
            box={promotingBox}
            onConfirm={(cost, plan) => onPromote(promotingBox.id, cost, plan)}
            userPoints={userPoints}
          />
      )}

      {sharingBox && (
          <ShareModal
            isOpen={true}
            onClose={() => setSharingBox(null)}
            item={{ id: sharingBox.id, title: sharingBox.title, type: 'Box', sharedWithUserIds: sharingBox.sharedWithUserIds }}
            allUsers={allUsers}
            currentUser={currentUser}
            onShare={(boxId, userIds, groupIds) => {
                onShare(boxId, userIds, groupIds);
                setSharingBox(null);
            }}
            groups={groups}
          />
      )}
      
      <ViewersModal 
        isOpen={viewersModalState.isOpen} 
        onClose={() => setViewersModalState(prev => ({...prev, isOpen: false}))} 
        viewers={viewersModalState.users}
        onViewProfile={(id) => console.log('View profile', id)} // In real app, navigate
        title={viewersModalState.title}
      />
    </div>
  );
};

export default MyBoxes;
