
import React, { useState, useEffect, useCallback } from 'react';
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
import { ViewState, Box, User, Lesson, Comment, Transaction, Notification, Conversation, Reminder, Event, Message, Language, Group, Forum, ForumPost, Poll, PollOption, TutorSession } from './types';
import { storageService } from './services/storage';
import { X, Edit } from 'lucide-react';

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

  const [subscribedBoxIds, setSubscribedBoxIds] = useState<string[]>([]); 

  useEffect(() => {
    storageService.initialize();
    setBoxes(storageService.getBoxes());
    const rawUsers = storageService.getUsers();
    const mockTutors = rawUsers.map(u => {
        if (u.handle === '@sarah_dev' || u.handle === '@mike_history') {
            return {
                ...u,
                isTutor: true,
                tutorSubjects: u.handle === '@sarah_dev' ? ['Physics', 'React', 'Calculus'] : ['World History', 'Art Theory'],
                tutorRate: u.handle === '@sarah_dev' ? 500 : 300,
                tutorRating: 4.9,
                tutorReviewCount: 15
            };
        }
        return u;
    });
    setUsers(mockTutors);
    setTransactions(storageService.getTransactions());
    setNotifications(storageService.getNotifications());
    setConversations(storageService.getConversations());
    setEvents(storageService.getEvents().map(e => ({...e, isJoined: e.isJoined || false})));
    setReminders(storageService.getReminders());
    setGroups(storageService.getGroups());
    const savedUser = storageService.getCurrentUser();
    if (savedUser) {
       const freshUserData = storageService.getUsers().find(u => u.id === savedUser.id) || savedUser;
       processDailyLogin(freshUserData);
       if (freshUserData.subscribedBoxIds) setSubscribedBoxIds(freshUserData.subscribedBoxIds);
       setCurrentView(ViewState.DASHBOARD);
    }
  }, []);

  useEffect(() => { if (boxes.length) storageService.saveBoxes(boxes); }, [boxes]);
  useEffect(() => { if (users.length) storageService.saveUsers(users); }, [users]);
  useEffect(() => { if (user) storageService.saveCurrentUser(user); }, [user]);
  useEffect(() => { if (transactions.length) storageService.saveTransactions(transactions); }, [transactions]);
  useEffect(() => { if (notifications.length) storageService.saveNotifications(notifications); }, [notifications]);
  useEffect(() => { if (conversations.length) storageService.saveConversations(conversations); }, [conversations]);
  useEffect(() => { if (events.length) storageService.saveEvents(events); }, [events]);
  useEffect(() => { if (reminders.length) storageService.saveReminders(reminders); }, [reminders]);
  useEffect(() => { if (groups.length) storageService.saveGroups(groups); }, [groups]);

  const subscribedBoxes = boxes.filter(b => subscribedBoxIds.includes(b.id));
  const sharedWithMeBoxes = user ? boxes.filter(b => b.sharedWithUserIds?.includes(user.id)) : [];
  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;
  const unreadMessageCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const addNotification = useCallback((type: Notification['type'], content: string, actor: User, targetId?: string) => {
      const newNotif: Notification = {
          id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type, actorId: actor.id, actorName: actor.name, actorAvatar: actor.avatar,
          content, timestamp: 'Just now', isRead: false, targetId
      };
      setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const processDailyLogin = useCallback((userData: User) => {
    const today = new Date().toDateString();
    if (userData.lastLoginDate === today) { setUser(userData); return userData; }
    const currentStreak = (userData.streak || 0) + 1;
    const bonus = 50;
    const updatedUser = { ...userData, points: userData.points + bonus, streak: currentStreak, lastLoginDate: today };
    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setNotifications(prev => [{ id: `n-streak-${Date.now()}`, type: 'system', actorName: 'Daily Bonus', content: `🔥 ${currentStreak} Day Streak! +${bonus} pts`, timestamp: 'Just now', isRead: false }, ...prev]);
    setTransactions(prev => [{ id: `t-streak-${Date.now()}`, type: 'credit', amount: bonus, description: `Daily Login Bonus (Day ${currentStreak})`, timestamp: new Date().toLocaleDateString() }, ...prev]);
    return updatedUser;
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
        const randomChance = Math.random();
        const networkUsers = users.filter(u => u.id !== user.id);
        if (networkUsers.length === 0) return;
        const randomUser = networkUsers[Math.floor(Math.random() * networkUsers.length)];
        if (randomChance > 0.7) {
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            if (randomEvent) addNotification('event_join', `joined the event "${randomEvent.title}"`, randomUser, randomEvent.id);
        } else if (randomChance > 0.4) {
            const fakeTopics = ['Advanced React Patterns', 'Urban Gardening 101', 'Quantum Physics Intro', 'Digital Marketing'];
            const topic = fakeTopics[Math.floor(Math.random() * fakeTopics.length)];
            addNotification('system', `created a new learning box: "${topic}"`, randomUser);
        } else {
            addNotification('like', 'liked your recent activity', randomUser);
        }
    }, 45000); 
    return () => clearInterval(interval);
  }, [user, users, events, addNotification]);

  const handleLogin = (handle: string) => {
    const currentUsers = users.length ? users : storageService.getUsers();
    const existingUser = currentUsers.find(u => u.handle === handle || u.handle === `@${handle}`);
    if (existingUser) {
        const safeUser = { ...existingUser, favoriteBoxIds: existingUser.favoriteBoxIds || [], savedLessonIds: existingUser.savedLessonIds || [] };
        const updatedUser = processDailyLogin(safeUser);
        setUser(updatedUser);
        if (updatedUser.subscribedBoxIds) setSubscribedBoxIds(updatedUser.subscribedBoxIds);
        setCurrentView(ViewState.DASHBOARD);
    } else { alert("User not found (Try @alex_j)"); }
  };

  const handleSignup = (newUser: User) => {
      const userWithStreak = { ...newUser, streak: 1, lastLoginDate: new Date().toDateString(), savedLessonIds: [] };
      setUsers([...users, userWithStreak]); setUser(userWithStreak); setSubscribedBoxIds([]); setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
      setUser(null); setSubscribedBoxIds([]); storageService.clearSession(); setCurrentView(ViewState.LOGIN); setIsMobileMenuOpen(false);
  };

  const handleViewChange = (view: ViewState) => {
    if (view === ViewState.CREATE) { setIsCreatorModalOpen(true); return; }
    setCurrentView(view); setSelectedBoxId(null); setViewingProfileId(null); setTargetMessageUserId(null); 
    window.scrollTo(0, 0); setIsMobileMenuOpen(false);
  };

  const handleBoxSelect = (boxId: string) => { setSelectedBoxId(boxId); setCurrentView(ViewState.BOX_DETAIL); window.scrollTo(0, 0); };

  const handleViewUserProfile = (userId: string) => {
    if (user && userId === user.id) { handleViewChange(ViewState.PROFILE); } 
    else { setViewingProfileId(userId); setCurrentView(ViewState.USER_PROFILE); window.scrollTo(0, 0); }
  };

  const handleSearchTag = (tag: string) => { setExploreSearchTerm(tag); setCurrentView(ViewState.EXPLORE); window.scrollTo(0, 0); };
  const handleGlobalSearch = (term: string) => { setExploreSearchTerm(term); setCurrentView(ViewState.EXPLORE); window.scrollTo(0, 0); };
  const handleMessageUser = (userId: string) => { setTargetMessageUserId(userId); setCurrentView(ViewState.MESSAGING); window.scrollTo(0, 0); };

  const handleSendMessage = (participantId: string, text: string) => {
    if (!user) return;
    setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.participantId === participantId && !c.groupId);
        const newMessage: Message = { id: `m-${Date.now()}`, senderId: user.id, text: text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        if (existingIndex > -1) {
            const existing = prev[existingIndex];
            const updatedConversation = { ...existing, messages: [...existing.messages, newMessage], lastMessage: text, timestamp: 'Just now' };
            const others = prev.filter((_, idx) => idx !== existingIndex);
            return [updatedConversation, ...others];
        } else {
            const updatedConversation = { id: `c-new-${Date.now()}`, participantId: participantId, lastMessage: text, timestamp: 'Just now', unreadCount: 0, messages: [newMessage] };
            return [updatedConversation, ...prev];
        }
    });
    setTimeout(() => {
        const replier = users.find(u => u.id === participantId);
        if (!replier) return;
        const replyText = `That's interesting! Tell me more about "${text.substring(0, 10)}..."`;
        setConversations(prev => {
            const idx = prev.findIndex(c => c.participantId === participantId && !c.groupId);
            if (idx === -1) return prev;
            const targetConvo = prev[idx];
            const replyMsg: Message = { id: `m-reply-${Date.now()}`, senderId: participantId, text: replyText, timestamp: 'Just now' };
            const updatedConvo = { ...targetConvo, messages: [...targetConvo.messages, replyMsg], lastMessage: replyText, unreadCount: targetConvo.unreadCount + 1, timestamp: 'Just now' };
            const others = prev.filter((_, i) => i !== idx);
            return [updatedConvo, ...others];
        });
        addNotification('comment', 'replied to your message', replier);
    }, 3000);
  };

  const handleGroupMessage = (groupId: string, text: string) => {
      if (!user) return;
      setConversations(prev => {
          const existingIndex = prev.findIndex(c => c.groupId === groupId);
          const newMessage: Message = { id: `m-${Date.now()}`, senderId: user.id, text: text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          if (existingIndex > -1) {
              const existing = prev[existingIndex];
              const updatedConversation = { ...existing, messages: [...existing.messages, newMessage], lastMessage: text, timestamp: 'Just now' };
              const others = prev.filter((_, idx) => idx !== existingIndex);
              return [updatedConversation, ...others];
          } else {
              const newConversation: Conversation = { id: `c-group-${Date.now()}`, participantId: 'group', groupId: groupId, lastMessage: text, timestamp: 'Just now', unreadCount: 0, messages: [newMessage] };
              return [newConversation, ...prev];
          }
      });
  };

  const handleSubscribe = (boxId: string) => {
    if (!user) return;
    if (subscribedBoxIds.includes(boxId)) { handleBoxSelect(boxId); return; }
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    const performSubscription = (cost: number) => {
        const newSubscribedIds = [...subscribedBoxIds, boxId];
        setSubscribedBoxIds(newSubscribedIds);
        const updatedUser = { ...user, points: user.points - cost, subscribedBoxIds: newSubscribedIds };
        setUser(updatedUser); setUsers(users.map(u => u.id === user.id ? updatedUser : u));
        setBoxes(boxes.map(b => b.id === boxId ? { ...b, subscribers: b.subscribers + 1 } : b));
    };
    if (box.isPrivate && box.price && box.price > 0) {
        if (user.points >= box.price) {
            if (window.confirm(`Unlock "${box.title}" for ${box.price} points?`)) {
                setUsers(prevUsers => prevUsers.map(u => u.id === box.creatorId ? { ...u, points: u.points + (box.price || 0) } : u));
                const debitTransaction: Transaction = { id: `t-${Date.now()}`, type: 'debit', amount: box.price, description: `Unlocked "${box.title}"`, timestamp: new Date().toLocaleDateString(), relatedBoxId: box.id };
                setTransactions([debitTransaction, ...transactions]); performSubscription(box.price);
            }
        } else { alert(`Insufficient points! You need ${box.price} pts.`); }
    } else { performSubscription(0); }
  };

  const handleUnsubscribe = (boxId: string) => {
    if (!user) return;
    const box = boxes.find(b => b.id === boxId);
    if (window.confirm(`Are you sure you want to unjoin "${box?.title}"?`)) {
        const newSubscribedIds = subscribedBoxIds.filter(id => id !== boxId);
        setSubscribedBoxIds(newSubscribedIds);
        const updatedUser = { ...user, subscribedBoxIds: newSubscribedIds };
        setUser(updatedUser); setUsers(users.map(u => u.id === user.id ? updatedUser : u));
        setBoxes(boxes.map(b => b.id === boxId ? { ...b, subscribers: Math.max(0, b.subscribers - 1) } : b));
    }
  };

  const handleCreateBox = (newBox: Box) => {
    setBoxes([newBox, ...boxes]);
    if (user) {
        const newSubscribedIds = [...subscribedBoxIds, newBox.id];
        setSubscribedBoxIds(newSubscribedIds);
        const updatedUser = { ...user, subscribedBoxIds: newSubscribedIds };
        setUser(updatedUser); setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    }
    setCurrentView(ViewState.MY_BOXES);
  };

  const handleUpdateBox = (updatedBox: Box) => setBoxes(prevBoxes => prevBoxes.map(b => b.id === updatedBox.id ? updatedBox : b));
  const handleDeleteBox = (boxId: string) => { if (window.confirm("Are you sure?")) { setBoxes(prev => prev.filter(b => b.id !== boxId)); if (subscribedBoxIds.includes(boxId)) setSubscribedBoxIds(prev => prev.filter(id => id !== boxId)); } };
  const handleUpdateProfile = (updatedUser: User) => { setUser(updatedUser); setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u)); };
  const handleAddLesson = (newLesson: Lesson) => { if (!selectedBoxId) return; setBoxes(prevBoxes => prevBoxes.map(box => box.id === selectedBoxId ? { ...box, lessons: [...box.lessons, { ...newLesson, boxId: box.id }] } : box)); };
  const handleDeleteLesson = (boxId: string, lessonId: string) => { setBoxes(prevBoxes => prevBoxes.map(box => box.id === boxId ? { ...box, lessons: box.lessons.filter(l => l.id !== lessonId) } : box)); };
  const handleUpdateLesson = (boxId: string, lessonId: string, updates: Partial<Lesson>) => { setBoxes(prevBoxes => prevBoxes.map(box => box.id === boxId ? { ...box, lessons: box.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l) } : box)); };

  const handleAddComment = (lessonId: string, content: string) => {
    if (!user) return;
    setBoxes(prevBoxes => prevBoxes.map(box => {
      const lessonIndex = box.lessons.findIndex(l => l.id === lessonId);
      if (lessonIndex > -1) {
        const updatedLessons = [...box.lessons];
        const newComment: Comment = { id: `c-${Date.now()}`, userId: user.id, userName: user.name, userAvatar: user.avatar, content: content, timestamp: 'Just now' };
        updatedLessons[lessonIndex] = { ...updatedLessons[lessonIndex], comments: [...updatedLessons[lessonIndex].comments, newComment] };
        return { ...box, lessons: updatedLessons };
      }
      return box;
    }));
  };
  
  const handleCompleteLesson = (lessonId: string) => {
    if (!user) return;
    setBoxes(prevBoxes => prevBoxes.map(box => {
      const lessonIndex = box.lessons.findIndex(l => l.id === lessonId);
      if (lessonIndex > -1) {
        const updatedLessons = [...box.lessons];
        const isAlreadyCompleted = updatedLessons[lessonIndex].isCompleted;
        updatedLessons[lessonIndex] = { ...updatedLessons[lessonIndex], isCompleted: true, completionCount: (updatedLessons[lessonIndex].completionCount || 0) + (isAlreadyCompleted ? 0 : 1), completedByUserIds: Array.from(new Set([...(updatedLessons[lessonIndex].completedByUserIds || []), user.id])) };
        return { ...box, lessons: updatedLessons };
      }
      return box;
    }));
  };

  const handleTogglePrivacy = (boxId: string) => setBoxes(prevBoxes => prevBoxes.map(box => box.id === boxId ? { ...box, isPrivate: !box.isPrivate, price: !box.isPrivate ? (box.price || 0) : 0 } : box));
  const handleUpdatePrice = (boxId: string, price: number) => setBoxes(prevBoxes => prevBoxes.map(box => box.id === boxId ? { ...box, price: price } : box));
  const handleShareBox = (boxId: string, userIds: string[], groupIds: string[]) => { setBoxes(prevBoxes => prevBoxes.map(box => box.id === boxId ? { ...box, sharedWithUserIds: Array.from(new Set([...(box.sharedWithUserIds || []), ...userIds])), sharedWithGroupIds: Array.from(new Set([...(box.sharedWithGroupIds || []), ...groupIds])) } : box)); alert('Invites sent!'); };

  const handleFollowToggle = (targetUserId: string) => {
    if (!user) return;
    const isFollowing = user.following.includes(targetUserId);
    setUsers(prevUsers => {
      const nextUsers = prevUsers.map(u => {
        if (u.id === user.id) {
          const newFollowing = isFollowing ? u.following.filter(id => id !== targetUserId) : [...u.following, targetUserId];
          let newFollowers = u.followers;
          if (!isFollowing && !newFollowers.includes(targetUserId)) newFollowers = [...newFollowers, targetUserId];
          return { ...u, following: newFollowing, followers: newFollowers };
        }
        if (u.id === targetUserId) {
          const newFollowers = isFollowing ? u.followers.filter(id => id !== user.id) : [...u.followers, user.id];
          let newFollowing = u.following;
          if (!isFollowing && !newFollowing.includes(user.id)) newFollowing = [...newFollowing, user.id];
          return { ...u, followers: newFollowers, following: newFollowing };
        }
        return u;
      });
      const updatedCurrentUser = nextUsers.find(u => u.id === user.id);
      if (updatedCurrentUser) setUser(updatedCurrentUser);
      return nextUsers;
    });
  };

  const handleToggleSaveLesson = (lessonId: string) => {
      if (!user) return;
      const currentSaved = user.savedLessonIds || [];
      const newSaved = currentSaved.includes(lessonId) ? currentSaved.filter(id => id !== lessonId) : [...currentSaved, lessonId];
      const updatedUser = { ...user, savedLessonIds: newSaved };
      setUser(updatedUser); setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updatedUser : u));
  };

  const handleBookTutor = (session: TutorSession) => {
      if (!user) return;
      const tutor = users.find(u => u.id === session.tutorId);
      
      const updatedUser = { ...user, points: user.points - session.price };
      setUser(updatedUser); 
      setUsers(users.map(u => u.id === user.id ? updatedUser : (u.id === session.tutorId ? { ...u, points: u.points + session.price } : u)));
      
      // Debit transaction for student
      const debitTx: Transaction = { 
        id: `t-tutor-d-${Date.now()}`, 
        type: 'debit', 
        amount: session.price, 
        description: `Tutoring session booked with ${tutor?.name}`, 
        timestamp: new Date().toLocaleDateString() 
      };
      
      // Credit transaction for tutor (Ensures earnings tracking works in Dashboard/Analytics)
      const creditTx: Transaction = {
        id: `t-tutor-c-${Date.now()}`,
        type: 'credit',
        amount: session.price,
        description: `Tutoring Income from ${user.name}: ${session.subject}`,
        timestamp: new Date().toLocaleDateString()
      };
      
      setTransactions([debitTx, creditTx, ...transactions]); 
      setTutorSessions([...tutorSessions, session]);
      addNotification('system', 'New tutoring session booked!', user);
  };

  const handleCreateForum = (boxId: string, title: string, description: string) => setBoxes(prev => prev.map(box => box.id !== boxId ? box : { ...box, forums: [...(box.forums || []), { id: `f-${Date.now()}`, title, description, posts: [], createdAt: new Date().toLocaleDateString() }] }));
  const handleAddForumPost = (boxId: string, forumId: string, content: string) => { if (!user) return; setBoxes(prev => prev.map(box => box.id !== boxId ? box : { ...box, forums: (box.forums || []).map(forum => forum.id !== forumId ? forum : { ...forum, posts: [{ id: `fp-${Date.now()}`, userId: user.id, userName: user.name, userAvatar: user.avatar, content, timestamp: 'Just now', replies: [] }, ...forum.posts] }) })); };
  const handleAddForumReply = (boxId: string, forumId: string, postId: string, content: string) => { if (!user) return; setBoxes(prev => prev.map(box => box.id !== boxId ? box : { ...box, forums: (box.forums || []).map(forum => forum.id !== forumId ? forum : { ...forum, posts: forum.posts.map(post => post.id !== postId ? post : { ...post, replies: [...post.replies, { id: `fr-${Date.now()}`, userId: user.id, userName: user.name, userAvatar: user.avatar, content, timestamp: 'Just now', replies: [] }] }) }) })); };
  const handleCreatePoll = (boxId: string, question: string, options: string[]) => { if (!user) return; setBoxes(prev => prev.map(box => box.id !== boxId ? box : { ...box, polls: [...(box.polls || []), { id: `poll-${Date.now()}`, question, options: options.map((opt, idx) => ({ id: `opt-${idx}-${Date.now()}`, text: opt, votes: 0, voterIds: [] })), createdAt: new Date().toLocaleDateString(), creatorId: user.id }] })); };
  const handleVotePoll = (boxId: string, pollId: string, optionId: string) => { if (!user) return; setBoxes(prev => prev.map(box => box.id !== boxId ? box : { ...box, polls: (box.polls || []).map(poll => poll.id !== pollId ? poll : { ...poll, options: poll.options.map(opt => { const filteredVoters = opt.voterIds.filter(id => id !== user.id); let newVoters = filteredVoters; let newVotes = filteredVoters.length; if (opt.id === optionId) { newVoters = [...filteredVoters, user.id]; newVotes = newVoters.length; } return { ...opt, voterIds: newVoters, votes: newVotes }; }) }) })); };
  const handleBuyPoints = (amount: number, cost: number) => { if (!user) return; setPendingPurchase({ amount, cost }); };
  const handleConfirmPayment = () => { if (!user || !pendingPurchase) return; const { amount, cost } = pendingPurchase; const updatedUser = { ...user, points: user.points + amount }; setUser(updatedUser); setUsers(users.map(u => u.id === user.id ? updatedUser : u)); setTransactions([{ id: `t-buy-${Date.now()}`, type: 'credit', amount: amount, description: `Purchased ${amount} Points Pack`, timestamp: new Date().toLocaleDateString() }, ...transactions]); setPendingPurchase(null); };
  const handlePromoteBox = (boxId: string, cost: number, plan: string) => { if (!user) return; if (user.points >= cost) { const updatedUser = { ...user, points: user.points - cost }; setUser(updatedUser); setUsers(users.map(u => u.id === user.id ? updatedUser : u)); setTransactions([{ id: `t-promo-${Date.now()}`, type: 'debit', amount: cost, description: `Promoted box (${plan})`, timestamp: new Date().toLocaleDateString() }, ...transactions]); alert('Promoted!'); } };
  const handleToggleFavorite = (boxId: string) => { if (!user) return; const currentFavs = user.favoriteBoxIds || []; const newFavs = currentFavs.includes(boxId) ? currentFavs.filter(id => id !== boxId) : [...currentFavs, boxId]; handleUpdateProfile({ ...user, favoriteBoxIds: newFavs }); };
  const handleNotifyFriends = (type: string, content: string) => { if (!user) return; setNotifications([{ id: `n-${Date.now()}`, type: type as any, actorName: 'System', content: `Your followers have been notified that you ${content}`, timestamp: 'Just now', isRead: false }, ...notifications]); };
  const handleAddReminder = (reminder: Reminder) => setReminders([...reminders, reminder]);
  const handleToggleReminder = (reminderId: string) => setReminders(prev => prev.map(r => r.id === reminderId ? {...r, isCompleted: !r.isCompleted} : r));
  const handleJoinEvent = (eventId: string) => setEvents(prevEvents => prevEvents.map(ev => ev.id === eventId ? { ...ev, isJoined: !ev.isJoined, attendees: ev.attendees + (!ev.isJoined ? 1 : -1) } : ev));
  const handleCreateEvent = (newEvent: Event) => setEvents([newEvent, ...events]);
  const handleUpdateEvent = (updatedEvent: Event) => setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  const handleCreateGroup = (newGroup: Group) => setGroups([...groups, newGroup]);
  const handleUpdateGroup = (updatedGroup: Group) => setGroups(groups.map(c => c.id === updatedGroup.id ? updatedGroup : c));
  const handleDeleteGroup = (groupId: string) => setGroups(groups.filter(c => c.id !== groupId));
  const markAllNotificationsRead = () => setNotifications(prev => prev.map(n => ({...n, isRead: true})));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
       {user && ( <Sidebar user={user} currentView={currentView} onChangeView={handleViewChange} isMobileOpen={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} language={language} /> )}
       {user && currentView !== ViewState.LOGIN && currentView !== ViewState.SIGNUP && currentView !== ViewState.FORGOT_PASSWORD && ( <Header user={user} currentView={currentView} onChangeView={handleViewChange} onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} onLogout={handleLogout} onSearch={handleGlobalSearch} notificationCount={unreadNotificationCount} messageCount={unreadMessageCount} language={language} /> )}
       <main className="flex-1 animate-in fade-in duration-300">
          <div key={currentView} className="animate-fade-in"> 
            {currentView === ViewState.LOGIN && <Login onLogin={handleLogin} onNavigate={handleViewChange} />}
            {currentView === ViewState.SIGNUP && <Signup onSignup={handleSignup} onNavigate={handleViewChange} />}
            {currentView === ViewState.FORGOT_PASSWORD && <ForgotPassword onNavigate={handleViewChange} />}
            {user && (
                <>
                {currentView === ViewState.DASHBOARD && ( <Dashboard user={user} subscribedBoxes={subscribedBoxes} allBoxes={boxes} allUsers={users} myTransactions={transactions} onAddComment={handleAddComment} onHashtagClick={handleSearchTag} onSubscribe={handleSubscribe} onViewBox={handleBoxSelect} onCreateBox={() => setIsCreatorModalOpen(true)} onEditProfile={() => setIsEditProfileModalOpen(true)} onComplete={handleCompleteLesson} onViewProfile={handleViewUserProfile} onExplore={() => handleViewChange(ViewState.EXPLORE)} groups={groups} onSaveLesson={handleToggleSaveLesson} onDeleteLesson={handleDeleteLesson} tutorSessions={tutorSessions} /> )}
                {currentView === ViewState.EXPLORE && ( <Explore allBoxes={boxes} subscribedIds={subscribedBoxIds} onSubscribe={handleSubscribe} onUnsubscribe={handleUnsubscribe} onViewBox={handleBoxSelect} initialSearchTerm={exploreSearchTerm} allUsers={users} currentUser={user} onShare={handleShareBox} favoriteBoxIds={user.favoriteBoxIds} onToggleFavorite={handleToggleFavorite} onToggleFollow={handleFollowToggle} onViewProfile={handleViewUserProfile} onBookTutor={handleBookTutor} groups={groups} tutorSessions={tutorSessions} /> )}
                {currentView === ViewState.LEADERBOARD && ( <Leaderboard users={users} onViewProfile={handleViewUserProfile} onMessage={handleMessageUser} /> )}
                {currentView === ViewState.MY_BOXES && ( <MyBoxes createdBoxes={boxes.filter(b => b.creatorId === user.id)} subscribedBoxes={subscribedBoxes} sharedWithMeBoxes={sharedWithMeBoxes} allBoxes={boxes} allUsers={users} onTogglePrivacy={handleTogglePrivacy} onUpdatePrice={handleUpdatePrice} onViewBox={handleBoxSelect} onCreateBox={() => setIsCreatorModalOpen(true)} onUpdateBox={handleUpdateBox} onDeleteBox={handleDeleteBox} onPromote={handlePromoteBox} onShare={handleShareBox} userPoints={user.points} currentUser={user} favoriteBoxIds={user.favoriteBoxIds} onToggleFavorite={handleToggleFavorite} onNavigateToExplore={() => handleViewChange(ViewState.EXPLORE)} onUnsubscribe={handleUnsubscribe} groups={groups} onSaveLesson={handleToggleSaveLesson} onDeleteLesson={handleDeleteLesson} /> )}
                {currentView === ViewState.NETWORK && ( <Network currentUser={user} allUsers={users} onToggleFollow={handleFollowToggle} onMessage={handleMessageUser} onNotify={handleNotifyFriends} events={events} onJoinEvent={handleJoinEvent} onCreateEvent={handleCreateEvent} onUpdateEvent={handleUpdateEvent} groups={groups} onCreateGroup={handleCreateGroup} onUpdateGroup={handleUpdateGroup} onDeleteGroup={handleDeleteGroup} boxes={boxes} conversations={conversations} onGroupMessage={handleGroupMessage} onGroupViewBox={handleBoxSelect} /> )}
                {currentView === ViewState.WALLET && ( <Wallet user={user} transactions={transactions} onBuyPoints={handleBuyPoints} /> )}
                {currentView === ViewState.MESSAGING && ( <Messaging currentUser={user} conversations={conversations} users={users} initialParticipantId={targetMessageUserId} onSendMessage={handleSendMessage} groups={groups} onGroupMessage={handleGroupMessage} /> )}
                {currentView === ViewState.NOTIFICATIONS && ( <Notifications notifications={notifications} onMarkAllRead={markAllNotificationsRead} /> )}
                {currentView === ViewState.ANALYTICS && ( <Analytics user={user} allBoxes={boxes.filter(b => b.creatorId === user.id)} subscribedBoxes={subscribedBoxes} onViewBox={handleBoxSelect} tutorSessions={tutorSessions} myTransactions={transactions} /> )}
                {currentView === ViewState.CALENDAR && ( <Calendar currentUser={user} events={events} reminders={reminders} onAddReminder={handleAddReminder} onToggleReminder={handleToggleReminder} tutorSessions={tutorSessions} /> )}
                {currentView === ViewState.BOX_DETAIL && selectedBoxId && ( <BoxDetail box={boxes.find(b => b.id === selectedBoxId)!} onBack={() => setCurrentView(ViewState.DASHBOARD)} isOwner={boxes.find(b => b.id === selectedBoxId)?.creatorId === user.id} onAddLesson={() => setIsAddLessonModalOpen(true)} onDeleteLesson={handleDeleteLesson} onAddComment={handleAddComment} onComplete={handleCompleteLesson} allUsers={users} currentUser={user} subscribed={subscribedBoxIds.includes(selectedBoxId)} onSubscribe={handleSubscribe} onUnsubscribe={handleUnsubscribe} onShare={handleShareBox} groups={groups} onSaveLesson={handleToggleSaveLesson} onCreateForum={handleCreateForum} onAddForumPost={handleAddForumPost} onAddForumReply={handleAddForumReply} onCreatePoll={handleCreatePoll} onVotePoll={handleVotePoll} onUpdateLesson={handleUpdateLesson} /> )}
                {currentView === ViewState.PROFILE && ( <UserProfile user={user} currentUser={user} allUsers={users} onBack={() => setCurrentView(ViewState.DASHBOARD)} onToggleFollow={handleFollowToggle} userBoxes={boxes.filter(b => b.creatorId === user.id)} subscribedBoxes={subscribedBoxes} onViewBox={handleBoxSelect} onSubscribe={handleSubscribe} onUnsubscribe={handleUnsubscribe} onShare={handleShareBox} favoriteBoxIds={user.favoriteBoxIds || []} onToggleFavorite={handleToggleFavorite} groups={groups} tutorSessions={tutorSessions} /> )}
                {currentView === ViewState.USER_PROFILE && viewingProfileId && ( <UserProfile user={users.find(u => u.id === viewingProfileId)!} currentUser={user} allUsers={users} onBack={() => setCurrentView(ViewState.DASHBOARD)} onToggleFollow={handleFollowToggle} userBoxes={boxes.filter(b => b.creatorId === viewingProfileId)} subscribedBoxes={boxes.filter(u => users.find(u => u.id === viewingProfileId)?.subscribedBoxIds?.includes(u.id))} onViewBox={handleBoxSelect} onSubscribe={handleSubscribe} onUnsubscribe={handleUnsubscribe} onShare={handleShareBox} favoriteBoxIds={user.favoriteBoxIds || []} onToggleFavorite={handleToggleFavorite} groups={groups} /> )}
                </>
            )}
          </div>
       </main>
       {currentView !== ViewState.LOGIN && currentView !== ViewState.SIGNUP && currentView !== ViewState.FORGOT_PASSWORD && ( <Footer language={language} onLanguageChange={setLanguage} /> )}
       <AICreatorModal isOpen={isCreatorModalOpen} onClose={() => setIsCreatorModalOpen(false)} onSave={handleCreateBox} currentUser={user} />
       {selectedBoxId && boxes.find(b => b.id === selectedBoxId) && ( <LessonCreatorModal isOpen={isAddLessonModalOpen} onClose={() => setIsAddLessonModalOpen(false)} onSave={handleAddLesson} boxTitle={boxes.find(b => b.id === selectedBoxId)!.title} /> )}
       {user && ( <EditProfileModal isOpen={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} onSave={handleUpdateProfile} user={user} /> )}
       {pendingPurchase && ( <PaymentModal isOpen={!!pendingPurchase} onClose={() => setPendingPurchase(null)} onConfirm={handleConfirmPayment} amount={pendingPurchase.amount} cost={pendingPurchase.cost} /> )}
    </div>
  );
}

export default App;
