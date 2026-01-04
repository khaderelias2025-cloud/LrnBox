
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [targetMessageUserId, setTargetMessageUserId] = useState<string | null>(null);
  
  const [language, setLanguage] = useState<Language>('en');

  // State synchronized with "Backend"
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

  // Initial Data Load
  useEffect(() => {
    storageService.initialize();
    refreshData();
    const savedUser = storageService.getCurrentUser();
    if (savedUser) {
       handleLogin(savedUser.handle);
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
    const currentUser = storageService.getCurrentUser();
    if (currentUser) setUser(currentUser);
  };

  const handleLogin = async (handle: string) => {
    try {
      const loggedInUser = await api.auth.login(handle);
      setUser(loggedInUser);
      refreshData();
      setCurrentView(ViewState.DASHBOARD);
    } catch (err) {
      alert("Login failed: " + (err as Error).message);
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
    setUser(null);
    storageService.clearSession();
    setCurrentView(ViewState.LOGIN);
    setIsMobileMenuOpen(false);
  };

  const handleViewChange = (view: ViewState) => {
    if (view === ViewState.CREATE) { setIsCreatorModalOpen(true); return; }
    setCurrentView(view);
    setSelectedBoxId(null);
    setViewingProfileId(null);
    setTargetMessageUserId(null); 
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  };

  const handleBoxSelect = (boxId: string) => { 
    setSelectedBoxId(boxId); 
    setCurrentView(ViewState.BOX_DETAIL); 
    window.scrollTo(0, 0); 
  };

  const handleCreateBox = async (newBox: Box) => {
    await api.content.createBox(newBox);
    if (user) {
      const updatedUser = { ...user, subscribedBoxIds: [...(user.subscribedBoxIds || []), newBox.id] };
      storageService.saveCurrentUser(updatedUser);
      storageService.saveUsers(storageService.getUsers().map(u => u.id === user.id ? updatedUser : u));
    }
    refreshData();
    setCurrentView(ViewState.MY_BOXES);
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

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user) return;
    await api.social.toggleFollow(user.id, targetUserId);
    refreshData();
  };

  const handleBuyPoints = (amount: number, cost: number) => {
    setPendingPurchase({ amount, cost });
  };

  const handleConfirmPayment = async () => {
    if (!user || !pendingPurchase) return;
    await api.wallet.purchasePoints(user.id, pendingPurchase.amount);
    setPendingPurchase(null);
    refreshData();
  };

  const handleSubscribe = async (boxId: string) => {
    if (!user) return;
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    
    const price = (box.accessLevel === 'premium' && box.price) ? box.price : 0;
    if (user.points < price) {
      alert("Not enough points!");
      return;
    }

    if (price > 0 && !window.confirm(`Unlock for ${price} pts?`)) return;

    const updatedUser = { ...user, points: user.points - price, subscribedBoxIds: [...(user.subscribedBoxIds || []), boxId] };
    storageService.saveCurrentUser(updatedUser);
    storageService.saveUsers(storageService.getUsers().map(u => u.id === user.id ? updatedUser : u));
    
    if (price > 0) {
      const tx: Transaction = {
        id: `t-sub-${Date.now()}`,
        type: 'debit',
        amount: price,
        description: `Unlocked box: ${box.title}`,
        timestamp: new Date().toLocaleDateString()
      };
      storageService.saveTransactions([tx, ...storageService.getTransactions()]);
    }

    await api.content.updateBox({ ...box, subscribers: box.subscribers + 1 });
    refreshData();
  };

  const subscribedBoxes = useMemo(() => 
    boxes.filter(b => user?.subscribedBoxIds?.includes(b.id)), 
    [boxes, user]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
       {user && ( <Sidebar user={user} currentView={currentView} onChangeView={handleViewChange} isMobileOpen={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} language={language} /> )}
       {user && currentView !== ViewState.LOGIN && currentView !== ViewState.SIGNUP && currentView !== ViewState.FORGOT_PASSWORD && ( <Header user={user} currentView={currentView} onChangeView={handleViewChange} onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} onLogout={handleLogout} onSearch={(t) => { setExploreSearchTerm(t); setCurrentView(ViewState.EXPLORE); }} notificationCount={notifications.filter(n=>!n.isRead).length} messageCount={conversations.reduce((a,c)=>a+c.unreadCount,0)} language={language} /> )}
       <main className="flex-1">
          {currentView === ViewState.LOGIN && <Login onLogin={handleLogin} onNavigate={handleViewChange} />}
          {currentView === ViewState.SIGNUP && <Signup onSignup={handleSignup} onNavigate={handleViewChange} />}
          {currentView === ViewState.FORGOT_PASSWORD && <ForgotPassword onNavigate={handleViewChange} />}
          {user && (
              <>
              {currentView === ViewState.DASHBOARD && <Dashboard user={user} subscribedBoxes={subscribedBoxes} allBoxes={boxes} allUsers={users} myTransactions={transactions} onAddComment={()=>{}} onHashtagClick={handleViewChange as any} onSubscribe={handleSubscribe} onViewBox={handleBoxSelect} onCreateBox={() => setIsCreatorModalOpen(true)} onEditProfile={() => setIsEditProfileModalOpen(true)} onComplete={handleCompleteLesson} onViewProfile={setViewingProfileId as any} onExplore={() => handleViewChange(ViewState.EXPLORE)} groups={groups} tutorSessions={tutorSessions} />}
              {currentView === ViewState.MY_BOXES && <MyBoxes createdBoxes={boxes.filter(b => b.creatorId === user.id)} subscribedBoxes={subscribedBoxes} sharedWithMeBoxes={[]} allBoxes={boxes} allUsers={users} onTogglePrivacy={()=>{}} onUpdatePrice={()=>{}} onViewBox={handleBoxSelect} onCreateBox={() => setIsCreatorModalOpen(true)} onUpdateBox={api.content.updateBox} onDeleteBox={api.content.deleteBox} onPromote={()=>{}} onShare={()=>{}} userPoints={user.points} currentUser={user} favoriteBoxIds={user.favoriteBoxIds} onToggleFavorite={()=>{}} onNavigateToExplore={() => handleViewChange(ViewState.EXPLORE)} groups={groups} />}
              {currentView === ViewState.EXPLORE && <Explore allBoxes={boxes} subscribedIds={user.subscribedBoxIds || []} onSubscribe={handleSubscribe} onViewBox={handleBoxSelect} initialSearchTerm={exploreSearchTerm} allUsers={users} currentUser={user} onShare={()=>{}} onToggleFollow={handleFollowToggle} onViewProfile={setViewingProfileId as any} groups={groups} />}
              {currentView === ViewState.LEADERBOARD && <Leaderboard users={users} onViewProfile={setViewingProfileId as any} onMessage={()=>{}} />}
              {currentView === ViewState.WALLET && <Wallet user={user} transactions={transactions} onBuyPoints={handleBuyPoints} />}
              {currentView === ViewState.BOX_DETAIL && selectedBoxId && <BoxDetail box={boxes.find(b => b.id === selectedBoxId)!} onBack={() => setCurrentView(ViewState.DASHBOARD)} isOwner={boxes.find(b => b.id === selectedBoxId)?.creatorId === user.id} onAddLesson={() => setIsAddLessonModalOpen(true)} onAddComment={()=>{}} onComplete={handleCompleteLesson} allUsers={users} currentUser={user} subscribed={user.subscribedBoxIds?.includes(selectedBoxId)} onSubscribe={handleSubscribe} groups={groups} />}
              {currentView === ViewState.PROFILE && <UserProfile user={user} currentUser={user} allUsers={users} onBack={() => setCurrentView(ViewState.DASHBOARD)} onToggleFollow={handleFollowToggle} userBoxes={boxes.filter(b => b.creatorId === user.id)} subscribedBoxes={subscribedBoxes} onViewBox={handleBoxSelect} onSubscribe={handleSubscribe} onShare={()=>{}} favoriteBoxIds={user.favoriteBoxIds || []} onToggleFavorite={()=>{}} groups={groups} tutorSessions={tutorSessions} />}
              </>
          )}
       </main>
       {user && <Footer language={language} onLanguageChange={setLanguage} />}
       <AICreatorModal isOpen={isCreatorModalOpen} onClose={() => setIsCreatorModalOpen(false)} onSave={handleCreateBox} currentUser={user} />
       {selectedBoxId && <LessonCreatorModal isOpen={isAddLessonModalOpen} onClose={() => setIsAddLessonModalOpen(false)} onSave={handleAddLesson} boxTitle={boxes.find(b => b.id === selectedBoxId)?.title || ''} />}
       {user && <EditProfileModal isOpen={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} onSave={api.social.toggleFollow as any} user={user} />}
       {pendingPurchase && <PaymentModal isOpen={!!pendingPurchase} onClose={() => setPendingPurchase(null)} onConfirm={handleConfirmPayment} amount={pendingPurchase.amount} cost={pendingPurchase.cost} />}
    </div>
  );
}

export default App;
