
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
  const [activeMessagingUserId, setActiveMessagingUserId] = useState<string | null>(null);
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
    setActiveMessagingUserId(null);
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

  const handleSendMessage = async (pid: string, text: string) => {
      if (!user) return;
      await api.messaging.sendMessage(user.id, pid, text);
      refreshData();
  };

  const handleGroupMessage = async (gid: string, text: string) => {
      if (!user) return;
      await api.messaging.sendMessage(user.id, '', text, gid);
      refreshData();
  };

  const handleShare = async (id: string, userIds: string[], groupIds: string[]) => {
      const box = boxes.find(b => b.id === id);
      if (box) {
          await api.content.updateBox({
              ...box,
              sharedWithUserIds: Array.from(new Set([...(box.sharedWithUserIds || []), ...userIds])),
              sharedWithGroupIds: Array.from(new Set([...(box.sharedWithGroupIds || []), ...groupIds]))
          });
          refreshData();
          alert("Box shared successfully!");
          return;
      }

      const event = events.find(e => e.id === id);
      if (event) {
          await api.social.updateEvent({
              ...event,
              invitedUserIds: Array.from(new Set([...(event.invitedUserIds || []), ...userIds])),
              sharedWithGroupIds: Array.from(new Set([...(event.sharedWithGroupIds || []), ...groupIds]))
          });
          refreshData();
          alert("Event shared successfully!");
          return;
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
                  onExplore={() => setCurrentView(ViewState.EXPLORE)}
                  groups={groups} tutorSessions={tutorSessions}
                  onSaveLesson={handleSaveLesson}
                />
              )}
              {currentView === ViewState.EXPLORE && (
                <Explore 
                  allBoxes={boxes} subscribedIds={user.subscribedBoxIds || []} 
                  onSubscribe={handleSubscribe} onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }}
                  initialSearchTerm={exploreSearchTerm} allUsers={users} currentUser={user}
                  onShare={handleShare} favoriteBoxIds={user.favoriteBoxIds || []}
                  onToggleFavorite={handleToggleFavorite} onToggleFollow={handleToggleFollow}
                  onViewProfile={(id) => { setViewingProfileId(id); setCurrentView(ViewState.USER_PROFILE); }}
                  onBookTutor={handleBookTutor} groups={groups} tutorSessions={tutorSessions}
                />
              )}
              {currentView === ViewState.LEADERBOARD && (
                <Leaderboard 
                  users={users} onViewProfile={(id) => { setViewingProfileId(id); setCurrentView(ViewState.USER_PROFILE); }}
                  onMessage={(id) => { setActiveMessagingUserId(id); setCurrentView(ViewState.MESSAGING); }}
                />
              )}
              {currentView === ViewState.BOX_DETAIL && selectedBoxId && (
                <BoxDetail 
                  box={boxes.find(b => b.id === selectedBoxId)!}
                  onBack={() => setCurrentView(ViewState.DASHBOARD)}
                  isOwner={boxes.find(b => b.id === selectedBoxId)?.creatorId === user.id}
                  onAddLesson={() => setIsAddLessonModalOpen(true)}
                  onDeleteLesson={async (bid, lid) => {
                    const box = boxes.find(b => b.id === bid);
                    if (box) {
                      const updated = { ...box, lessons: box.lessons.filter(l => l.id !== lid) };
                      await api.content.updateBox(updated);
                      refreshData();
                    }
                  }}
                  onAddComment={handleAddComment}
                  onComplete={handleCompleteLesson}
                  allUsers={users} currentUser={user}
                  subscribed={user.subscribedBoxIds?.includes(selectedBoxId)}
                  onSubscribe={handleSubscribe}
                  onUnsubscribe={async (id) => {
                    const updated = { ...user, subscribedBoxIds: user.subscribedBoxIds?.filter(bid => bid !== id) || [] };
                    storageService.saveCurrentUser(updated);
                    storageService.saveUsers(users.map(u => u.id === user.id ? updated : u));
                    refreshData();
                  }}
                  groups={groups} onSaveLesson={handleSaveLesson}
                  onToggleFollow={handleToggleFollow}
                  onMessageUser={(id) => { setActiveMessagingUserId(id); setCurrentView(ViewState.MESSAGING); }}
                  onViewProfile={(id) => { setViewingProfileId(id); setCurrentView(ViewState.USER_PROFILE); }}
                  onShare={handleShare}
                />
              )}
              {currentView === ViewState.MY_BOXES && (
                <MyBoxes 
                  createdBoxes={boxes.filter(b => b.creatorId === user.id)}
                  subscribedBoxes={subscribedBoxes}
                  sharedWithMeBoxes={boxes.filter(b => b.sharedWithUserIds?.includes(user.id))}
                  allBoxes={boxes} allUsers={users}
                  onTogglePrivacy={async (id) => {
                    const box = boxes.find(b => b.id === id);
                    if (box) {
                      await api.content.updateBox({ ...box, isPrivate: !box.isPrivate });
                      refreshData();
                    }
                  }}
                  onUpdatePrice={async (id, price) => {
                    const box = boxes.find(b => b.id === id);
                    if (box) {
                      await api.content.updateBox({ ...box, price });
                      refreshData();
                    }
                  }}
                  onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }}
                  onCreateBox={() => setIsCreatorModalOpen(true)}
                  onUpdateBox={async (updated) => { await api.content.updateBox(updated); refreshData(); }}
                  onDeleteBox={async (id) => { await api.content.deleteBox(id); refreshData(); }}
                  onPromote={(id, cost, plan) => { setPendingPurchase({ amount: cost, cost: 0 }); handleSubscribe(id); }}
                  onShare={handleShare}
                  userPoints={user.points} currentUser={user}
                  favoriteBoxIds={user.favoriteBoxIds} onToggleFavorite={handleToggleFavorite}
                  onNavigateToExplore={() => setCurrentView(ViewState.EXPLORE)}
                  onUnsubscribe={async (id) => {
                    const updated = { ...user, subscribedBoxIds: user.subscribedBoxIds?.filter(bid => bid !== id) || [] };
                    storageService.saveCurrentUser(updated);
                    storageService.saveUsers(users.map(u => u.id === user.id ? updated : u));
                    refreshData();
                  }}
                  groups={groups} onSaveLesson={handleSaveLesson}
                />
              )}
              {currentView === ViewState.NETWORK && (
                <Network 
                  currentUser={user} allUsers={users} onToggleFollow={handleToggleFollow}
                  onMessage={(id) => { setActiveMessagingUserId(id); setCurrentView(ViewState.MESSAGING); }}
                  events={events} onJoinEvent={async (id) => { await api.social.joinEvent(user.id, id); refreshData(); }}
                  onCreateEvent={async (ev) => { await api.social.createEvent(ev); refreshData(); }}
                  onUpdateEvent={async (ev) => { await api.social.updateEvent(ev); refreshData(); }}
                  groups={groups} 
                  onCreateGroup={async (g) => { await api.social.createGroup(g); refreshData(); }}
                  onUpdateGroup={async (g) => { await api.social.updateGroup(g); refreshData(); }}
                  onDeleteGroup={async (id) => { await api.social.deleteGroup(id); refreshData(); }}
                  boxes={boxes} conversations={conversations}
                  onGroupMessage={handleGroupMessage}
                  onGroupViewBox={(bid) => { setSelectedBoxId(bid); setCurrentView(ViewState.BOX_DETAIL); }}
                />
              )}
              {currentView === ViewState.WALLET && (
                <Wallet user={user} transactions={transactions} onBuyPoints={(pts, cost) => setPendingPurchase({ amount: pts, cost })} />
              )}
              {currentView === ViewState.MESSAGING && (
                <Messaging 
                  currentUser={user} conversations={conversations} users={users} 
                  initialParticipantId={activeMessagingUserId}
                  onSendMessage={handleSendMessage}
                  onGroupMessage={handleGroupMessage}
                  groups={groups}
                />
              )}
              {currentView === ViewState.NOTIFICATIONS && (
                <Notifications notifications={notifications} onMarkAllRead={() => { 
                  storageService.saveNotifications(notifications.map(n => ({...n, isRead: true})));
                  refreshData();
                }} />
              )}
              {currentView === ViewState.ANALYTICS && (
                <Analytics 
                  user={user} allBoxes={boxes.filter(b => b.creatorId === user.id)}
                  subscribedBoxes={subscribedBoxes}
                  onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }}
                  tutorSessions={tutorSessions} myTransactions={transactions}
                />
              )}
              {currentView === ViewState.CALENDAR && (
                <Calendar 
                  currentUser={user} events={events} reminders={reminders}
                  onAddReminder={(r) => { storageService.saveReminders([r, ...reminders]); refreshData(); }}
                  onToggleReminder={(id) => { 
                    storageService.saveReminders(reminders.map(r => r.id === id ? {...r, isCompleted: !r.isCompleted} : r));
                    refreshData();
                  }}
                  tutorSessions={tutorSessions}
                />
              )}
              {currentView === ViewState.PROFILE && (
                <UserProfile 
                  user={user} currentUser={user} allUsers={users}
                  onBack={() => setCurrentView(ViewState.DASHBOARD)}
                  onToggleFollow={handleToggleFollow}
                  userBoxes={boxes.filter(b => b.creatorId === user.id)}
                  subscribedBoxes={subscribedBoxes}
                  onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }}
                  onSubscribe={handleSubscribe}
                  onUnsubscribe={async (id) => {
                    const updated = { ...user, subscribedBoxIds: user.subscribedBoxIds?.filter(bid => bid !== id) || [] };
                    storageService.saveCurrentUser(updated);
                    storageService.saveUsers(users.map(u => u.id === user.id ? updated : u));
                    refreshData();
                  }}
                  onShare={handleShare}
                  favoriteBoxIds={user.favoriteBoxIds || []}
                  onToggleFavorite={handleToggleFavorite}
                  groups={groups} tutorSessions={tutorSessions}
                />
              )}
              {currentView === ViewState.USER_PROFILE && viewingProfileId && (
                <UserProfile 
                  user={users.find(u => u.id === viewingProfileId)!} currentUser={user} allUsers={users}
                  onBack={() => setCurrentView(ViewState.DASHBOARD)}
                  onToggleFollow={handleToggleFollow}
                  userBoxes={boxes.filter(b => b.creatorId === viewingProfileId)}
                  subscribedBoxes={boxes.filter(b => users.find(u => u.id === viewingProfileId)?.subscribedBoxIds?.includes(b.id))}
                  onViewBox={(id) => { setSelectedBoxId(id); setCurrentView(ViewState.BOX_DETAIL); }}
                  onSubscribe={handleSubscribe}
                  onShare={handleShare}
                  favoriteBoxIds={user.favoriteBoxIds || []}
                  onToggleFavorite={handleToggleFavorite}
                  groups={groups} tutorSessions={tutorSessions}
                />
              )}
            </>
          )}
       </main>

       {user && <Footer language={language} onLanguageChange={setLanguage} />}

       {/* Modals */}
       <AICreatorModal 
          isOpen={isCreatorModalOpen} 
          onClose={() => setIsCreatorModalOpen(false)} 
          onSave={async (box) => { await api.content.createBox(box); refreshData(); }}
          currentUser={user}
       />
       
       <LessonCreatorModal 
          isOpen={isAddLessonModalOpen}
          onClose={() => setIsAddLessonModalOpen(false)}
          onSave={handleAddLesson}
          boxTitle={boxes.find(b => b.id === selectedBoxId)?.title || ''}
          questionBank={[]}
       />

       {user && (
         <EditProfileModal 
            isOpen={isEditProfileModalOpen}
            onClose={() => setIsEditProfileModalOpen(false)}
            onSave={handleSaveProfile}
            user={user}
         />
       )}

       {pendingPurchase && user && (
         <PaymentModal 
            isOpen={true}
            onClose={() => setPendingPurchase(null)}
            onConfirm={async () => {
              await api.wallet.purchasePoints(user.id, pendingPurchase.amount);
              setPendingPurchase(null);
              refreshData();
            }}
            amount={pendingPurchase.amount}
            cost={pendingPurchase.cost}
         />
       )}
    </div>
  );
}

export default App;
