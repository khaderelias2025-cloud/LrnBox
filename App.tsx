
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Leaderboard from './pages/Leaderboard';
import BoxDetail from './pages/BoxDetail';
import MyBoxes from './pages/MyBoxes';
import Network from './pages/Network';
import Wallet from './pages/Wallet';
import Messaging from './pages/Messaging';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import UserProfile from './pages/UserProfile';
import AICreatorModal from './components/AICreatorModal';
import LessonCreatorModal from './components/LessonCreatorModal';
import EditProfileModal from './components/EditProfileModal';
import PaymentModal from './components/PaymentModal';
import { ViewState, Box, User, Lesson, Transaction, Notification, Conversation, Reminder, Event, Language, Group, TutorSession } from './types';
import { storageService } from './services/storage';
import { api } from './services/api';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{amount: number, cost: number} | null>(null);
  const [exploreSearchTerm, setExploreSearchTerm] = useState('');
  const [language, setLanguage] = useState<Language>('en');

  // Unified System State
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [events, setEvents] = useState<Event[]>([]); 
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tutorSessions, setTutorSessions] = useState<TutorSession[]>([]);

  useEffect(() => {
    storageService.initialize();
    refreshData();
    const saved = storageService.getCurrentUser();
    if (saved) {
      handleLogin(saved.handle);
    }
  }, []);

  const refreshData = () => {
    setBoxes(storageService.getBoxes());
    setUsers(storageService.getUsers());
    setTransactions(storageService.getTransactions());
    setNotifications(storageService.getNotifications());
    setConversations(storageService.getConversations());
    setEvents(storageService.getEvents());
    setReminders(storageService.getReminders());
    setGroups(storageService.getGroups());
    setTutorSessions(storageService.getTutorSessions());
    const current = storageService.getCurrentUser();
    setUser(current);
  };

  const handleLogin = async (handle: string): Promise<void> => {
    try {
      const loggedIn = await api.auth.login(handle);
      setUser(loggedIn);
      refreshData();
      setCurrentView(ViewState.DASHBOARD);
    } catch (err) {
      throw err;
    }
  };

  const handleSignup = async (userData: User) => {
    try {
      const newUser = await api.auth.signup(userData);
      setUser(newUser);
      refreshData();
      setCurrentView(ViewState.DASHBOARD);
    } catch (err) {
      alert("Signup failed: " + (err as Error).message);
    }
  };

  const handleLogout = () => {
    storageService.clearSession();
    setUser(null);
    setCurrentView(ViewState.LOGIN);
  };

  const handleViewChange = (view: ViewState) => {
    if (view === ViewState.CREATE) { setIsCreatorModalOpen(true); return; }
    setCurrentView(view);
    setViewingProfileId(null);
    setIsMobileMenuOpen(false);
  };

  const handleAddComment = async (lessonId: string, text: string) => {
    if (!user) return;
    await api.content.addComment(user.id, lessonId, text);
    refreshData();
  };

  const handleToggleFavorite = async (boxId: string) => {
    if (!user) return;
    await api.social.toggleFavorite(user.id, boxId);
    refreshData();
  };

  const handleToggleFollow = async (targetId: string) => {
    if (!user) return;
    await api.social.toggleFollow(user.id, targetId);
    refreshData();
  };

  const handleSaveLesson = async (lessonId: string) => {
      if (!user) return;
      await api.social.toggleSaveLesson(user.id, lessonId);
      refreshData();
  };

  const handleBookTutor = async (session: TutorSession) => {
      if (!user) return;
      try {
          await api.social.bookTutorSession(session);
          refreshData();
      } catch (err) {
          alert("Booking failed: " + (err as Error).message);
      }
  };

  const handleSubscribe = async (boxId: string) => {
    if (!user) return;
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    const price = box.price || 0;
    if (user.points < price) {
      alert("Insufficient points! Visit the wallet to top up.");
      return;
    }

    if (price > 0 && !window.confirm(`Unlock for ${price} points?`)) return;

    const updatedUser = { 
      ...user, 
      points: user.points - price, 
      subscribedBoxIds: [...(user.subscribedBoxIds || []), boxId] 
    };
    
    if (price > 0) {
      const tx: Transaction = {
        id: `t-sub-${Date.now()}`,
        type: 'debit',
        amount: price,
        description: `Subscribed to: ${box.title}`,
        timestamp: new Date().toLocaleDateString()
      };
      storageService.saveTransactions([tx, ...storageService.getTransactions()]);
    }

    storageService.saveCurrentUser(updatedUser);
    storageService.saveUsers(storageService.getUsers().map(u => u.id === user.id ? updatedUser : u));
    await api.content.updateBox({ ...box, subscribers: box.subscribers + 1 });
    refreshData();
  };

  const handleAddLesson = async (newLesson: Lesson) => {
    if (!selectedBoxId) return;
    await api.content.addLesson(selectedBoxId, newLesson);
    refreshData();
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!user) return;
    await api.content.completeLesson(user.id, lessonId);
    refreshData();
  };

  const handleSaveProfile = async (updatedUser: User) => {
    storageService.saveCurrentUser(updatedUser);
    storageService.saveUsers(storageService.getUsers().map(u => u.id === updatedUser.id ? updatedUser : u));
    refreshData();
  };

  const subscribedBoxes = useMemo(() => boxes.filter(b => user?.subscribedBoxIds?.includes(b.id)), [boxes, user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
       {user && <Sidebar user={user} currentView={currentView} onChangeView={handleViewChange} isMobileOpen={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} language={language} />}
       {user && currentView !== ViewState.LOGIN && currentView !== ViewState.SIGNUP && (
         <Header 
          user={user} 
          currentView={currentView} 
          onChangeView={handleViewChange} 
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          onLogout={handleLogout} 
          onSearch={(t) => { setExploreSearchTerm(t); setCurrentView(ViewState.EXPLORE); }} 
          notificationCount={notifications.filter(n=>!n.isRead).length} 
          messageCount={conversations.reduce((a,c)=>a+c.unreadCount,0)} 
          language={language} 
         />
       )}
       
       <main className="flex-1">
          {currentView === ViewState.LOGIN && <Login onLogin={handleLogin} onNavigate={handleViewChange} />}
          {currentView === ViewState.SIGNUP && <Signup onSignup={handleSignup} onNavigate={handleViewChange} />}
          {currentView === ViewState.FORGOT_PASSWORD && <ForgotPassword onNavigate={handleViewChange} />}
          
          {user && (
            <>
              {currentView === ViewState.DASHBOARD && (
                <Dashboard 
                  user={user} subscribedBoxes={subscribedBoxes} allBoxes={boxes} allUsers={users} myTransactions={transactions}
                  onAddComment={handleAddComment} onHashtagClick={(tag) => { setExploreSearchTerm(tag); setCurrentView(ViewState.EXPLORE); }}
                  onSubscribe={handleSubscribe} onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }}
                  onCreateBox={() => setIsCreatorModalOpen(true)} onEditProfile={() => setIsEditProfileModalOpen(true)}
                  onComplete={handleCompleteLesson} onViewProfile={(id) => { setViewingProfileId(id); setCurrentView(ViewState.USER_PROFILE); }}
                  onExplore={() => setCurrentView(ViewState.EXPLORE)} groups={groups} tutorSessions={tutorSessions}
                  onSaveLesson={handleSaveLesson}
                />
              )}
              {currentView === ViewState.EXPLORE && (
                <Explore 
                  allBoxes={boxes} subscribedIds={user.subscribedBoxIds || []} onSubscribe={handleSubscribe}
                  onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }}
                  initialSearchTerm={exploreSearchTerm} allUsers={users} currentUser={user} onShare={()=>{}}
                  onToggleFollow={handleToggleFollow} onViewProfile={(id) => { setViewingProfileId(id); setCurrentView(ViewState.USER_PROFILE); }}
                  groups={groups} favoriteBoxIds={user.favoriteBoxIds} onToggleFavorite={handleToggleFavorite}
                  onBookTutor={handleBookTutor} tutorSessions={tutorSessions}
                />
              )}
              {currentView === ViewState.MY_BOXES && (
                <MyBoxes 
                  createdBoxes={boxes.filter(b => b.creatorId === user.id)} subscribedBoxes={subscribedBoxes} sharedWithMeBoxes={[]}
                  allBoxes={boxes} allUsers={users} userPoints={user.points} currentUser={user} favoriteBoxIds={user.favoriteBoxIds}
                  onTogglePrivacy={()=>{}} onUpdatePrice={()=>{}} onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }}
                  onCreateBox={() => setIsCreatorModalOpen(true)} onUpdateBox={api.content.updateBox} onDeleteBox={api.content.deleteBox}
                  onPromote={()=>{}} onShare={()=>{}} onToggleFavorite={handleToggleFavorite} onNavigateToExplore={() => setCurrentView(ViewState.EXPLORE)}
                  onSaveLesson={handleSaveLesson}
                />
              )}
              {currentView === ViewState.NETWORK && (
                <Network 
                    currentUser={user} allUsers={users} onToggleFollow={handleToggleFollow} onMessage={(id) => setCurrentView(ViewState.MESSAGING)}
                    events={events} onJoinEvent={async (id) => { await api.social.joinEvent(user.id, id); refreshData(); }}
                    onCreateEvent={async (e) => { await api.social.createEvent(e); refreshData(); }}
                    onUpdateEvent={async (e) => { await api.social.updateEvent(e); refreshData(); }}
                    groups={groups} onCreateGroup={async (g) => { await api.social.createGroup(g); refreshData(); }}
                    onUpdateGroup={async (g) => { await api.social.updateGroup(g); refreshData(); }}
                    onDeleteGroup={async (id) => { await api.social.deleteGroup(id); refreshData(); }}
                />
              )}
              {currentView === ViewState.BOX_DETAIL && selectedBoxId && (
                <BoxDetail 
                  box={boxes.find(b => b.id === selectedBoxId)!} onBack={() => setCurrentView(ViewState.DASHBOARD)}
                  isOwner={boxes.find(b => b.id === selectedBoxId)?.creatorId === user.id} allUsers={users} currentUser={user}
                  subscribed={user.subscribedBoxIds?.includes(selectedBoxId)} onSubscribe={handleSubscribe}
                  onAddLesson={() => setIsAddLessonModalOpen(true)} onAddComment={handleAddComment} onComplete={handleCompleteLesson}
                  onSaveLesson={handleSaveLesson}
                />
              )}
              {currentView === ViewState.PROFILE && (
                <UserProfile 
                  user={user} currentUser={user} allUsers={users} onBack={() => setCurrentView(ViewState.DASHBOARD)}
                  onToggleFollow={handleToggleFollow} userBoxes={boxes.filter(b => b.creatorId === user.id)} subscribedBoxes={subscribedBoxes}
                  onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }} onSubscribe={handleSubscribe}
                  onShare={()=>{}} favoriteBoxIds={user.favoriteBoxIds || []} onToggleFavorite={handleToggleFavorite} tutorSessions={tutorSessions}
                  onSaveLesson={handleSaveLesson}
                />
              )}
              {currentView === ViewState.USER_PROFILE && viewingProfileId && (
                <UserProfile 
                  user={users.find(u => u.id === viewingProfileId)!} currentUser={user} allUsers={users} onBack={() => setCurrentView(ViewState.DASHBOARD)}
                  onToggleFollow={handleToggleFollow} userBoxes={boxes.filter(b => b.creatorId === viewingProfileId)} subscribedBoxes={boxes.filter(b => users.find(u=>u.id===viewingProfileId)?.subscribedBoxIds?.includes(b.id))}
                  onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }} onSubscribe={handleSubscribe}
                  onShare={()=>{}} favoriteBoxIds={user.favoriteBoxIds || []} onToggleFavorite={handleToggleFavorite} tutorSessions={tutorSessions}
                  onSaveLesson={handleSaveLesson}
                />
              )}
              {currentView === ViewState.WALLET && <Wallet user={user} transactions={transactions} onBuyPoints={(a, c) => setPendingPurchase({amount: a, cost: c})} />}
              {currentView === ViewState.NOTIFICATIONS && <Notifications notifications={notifications} onMarkAllRead={() => { storageService.saveNotifications(notifications.map(n => ({...n, isRead: true}))); refreshData(); }} />}
              {currentView === ViewState.LEADERBOARD && <Leaderboard users={users} onViewProfile={(id) => { setViewingProfileId(id); setCurrentView(ViewState.USER_PROFILE); }} onMessage={()=>{}} />}
              {currentView === ViewState.ANALYTICS && <Analytics user={user} allBoxes={boxes.filter(b=>b.creatorId===user.id)} subscribedBoxes={subscribedBoxes} onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }} tutorSessions={tutorSessions} myTransactions={transactions} />}
              {currentView === ViewState.MESSAGING && <Messaging currentUser={user} conversations={conversations} users={users} onSendMessage={(pid, txt) => { /* Mock logic */ }} groups={groups} />}
              {currentView === ViewState.CALENDAR && <Calendar currentUser={user} events={events} reminders={reminders} onAddReminder={(r) => { storageService.saveReminders([...reminders, r]); refreshData(); }} onToggleReminder={(id) => { storageService.saveReminders(reminders.map(r => r.id === id ? {...r, isCompleted: !r.isCompleted} : r)); refreshData(); }} tutorSessions={tutorSessions} />}
            </>
          )}
       </main>

       {user && <Footer language={language} onLanguageChange={setLanguage} />}

       <AICreatorModal isOpen={isCreatorModalOpen} onClose={() => setIsCreatorModalOpen(false)} onSave={async (b) => { await api.content.createBox(b); refreshData(); handleViewChange(ViewState.MY_BOXES); }} currentUser={user} />
       {selectedBoxId && <LessonCreatorModal isOpen={isAddLessonModalOpen} onClose={() => setIsAddLessonModalOpen(false)} onSave={handleAddLesson} boxTitle={boxes.find(b => b.id === selectedBoxId)?.title || ''} />}
       {user && <EditProfileModal isOpen={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} onSave={handleSaveProfile} user={user} />}
       {pendingPurchase && <PaymentModal isOpen={!!pendingPurchase} onClose={() => setPendingPurchase(null)} amount={pendingPurchase.amount} cost={pendingPurchase.cost} onConfirm={async () => { await api.wallet.purchasePoints(user!.id, pendingPurchase.amount); setPendingPurchase(null); refreshData(); }} />}
    </div>
  );
}

export default App;
