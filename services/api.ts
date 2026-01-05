
import { storageService } from './storage';
import { User, Box, Lesson, Transaction, Notification, Conversation, Message, TutorSession, ViewState, Comment, Event, Group } from '../types';

const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    login: async (handle: string): Promise<User> => {
      await delay(600);
      const users = storageService.getUsers();
      const normalizedInput = handle.toLowerCase().trim();
      
      const user = users.find(u => {
        const uHandle = u.handle.toLowerCase();
        return uHandle === normalizedInput || uHandle === (normalizedInput.startsWith('@') ? normalizedInput : `@${normalizedInput}`);
      });

      if (!user) throw new Error("User not found");
      
      const today = new Date().toDateString();
      if (user.lastLoginDate !== today) {
        user.points += 50;
        user.streak = (user.streak || 0) + 1;
        user.lastLoginDate = today;
        
        const tx: Transaction = {
          id: `t-streak-${Date.now()}`,
          type: 'credit',
          amount: 50,
          description: `Daily Login Bonus (Day ${user.streak})`,
          timestamp: new Date().toLocaleDateString()
        };
        storageService.saveTransactions([tx, ...storageService.getTransactions()]);
      }
      
      storageService.saveCurrentUser(user);
      storageService.saveUsers(users.map(u => u.id === user.id ? user : u));
      return user;
    },
    signup: async (userData: Partial<User>): Promise<User> => {
      await delay(1000);
      const users = storageService.getUsers();
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: userData.name || '',
        handle: userData.handle?.startsWith('@') ? userData.handle : `@${userData.handle}`,
        avatar: userData.avatar || '',
        role: userData.role || 'student',
        bio: userData.bio || '',
        points: 100,
        followers: [],
        following: [],
        subscribedBoxIds: [],
        favoriteBoxIds: [],
        savedLessonIds: [],
        streak: 1,
        lastLoginDate: new Date().toDateString(),
        ...userData
      };
      
      storageService.saveUsers([...users, newUser]);
      storageService.saveCurrentUser(newUser);
      return newUser;
    }
  },

  content: {
    getBoxes: async (): Promise<Box[]> => {
      await delay(200);
      return storageService.getBoxes();
    },
    createBox: async (box: Box): Promise<Box> => {
      await delay(800);
      const boxes = storageService.getBoxes();
      storageService.saveBoxes([box, ...boxes]);
      return box;
    },
    updateBox: async (updatedBox: Box): Promise<Box> => {
      await delay(400);
      const boxes = storageService.getBoxes();
      storageService.saveBoxes(boxes.map(b => b.id === updatedBox.id ? updatedBox : b));
      return updatedBox;
    },
    deleteBox: async (boxId: string): Promise<void> => {
      await delay(500);
      const boxes = storageService.getBoxes();
      storageService.saveBoxes(boxes.filter(b => b.id !== boxId));
    },
    addLesson: async (boxId: string, lesson: Lesson): Promise<void> => {
      await delay(600);
      const boxes = storageService.getBoxes();
      const updatedBoxes = boxes.map(box => {
        if (box.id === boxId) {
          const lessonWithId = { ...lesson, boxId };
          return { ...box, lessons: [...box.lessons, lessonWithId] };
        }
        return box;
      });
      storageService.saveBoxes(updatedBoxes);
    },
    addComment: async (userId: string, lessonId: string, content: string): Promise<void> => {
      await delay(300);
      const boxes = storageService.getBoxes();
      const users = storageService.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const newComment: Comment = {
        id: `c-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        content: content,
        timestamp: 'Just now'
      };
      
      storageService.saveBoxes(boxes.map(box => ({
        ...box,
        lessons: box.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return { ...lesson, comments: [...(lesson.comments || []), newComment] };
          }
          return lesson;
        })
      })));
    },
    completeLesson: async (userId: string, lessonId: string): Promise<void> => {
      await delay(300);
      const boxes = storageService.getBoxes();
      storageService.saveBoxes(boxes.map(box => ({
        ...box,
        lessons: box.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            const completedByUserIds = lesson.completedByUserIds || [];
            if (!completedByUserIds.includes(userId)) {
              return { 
                ...lesson, 
                isCompleted: true, 
                completionCount: (lesson.completionCount || 0) + 1,
                completedByUserIds: [...completedByUserIds, userId]
              };
            }
          }
          return lesson;
        })
      })));
    }
  },

  social: {
    toggleFavorite: async (userId: string, boxId: string): Promise<void> => {
      await delay(300);
      const users = storageService.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const favorites = user.favoriteBoxIds || [];
      if (favorites.includes(boxId)) {
        user.favoriteBoxIds = favorites.filter(id => id !== boxId);
      } else {
        user.favoriteBoxIds = [...favorites, boxId];
      }
      
      storageService.saveUsers(users.map(u => u.id === userId ? user : u));
      storageService.saveCurrentUser(user);
    },
    toggleFollow: async (userId: string, targetId: string): Promise<void> => {
      await delay(300);
      const users = storageService.getUsers();
      const currentUser = users.find(u => u.id === userId);
      const targetUser = users.find(u => u.id === targetId);
      
      if (!currentUser || !targetUser) return;
      
      const following = currentUser.following || [];
      if (following.includes(targetId)) {
        currentUser.following = following.filter(id => id !== targetId);
        targetUser.followers = (targetUser.followers || []).filter(id => id !== userId);
      } else {
        currentUser.following = [...following, targetId];
        targetUser.followers = [...(targetUser.followers || []), userId];
      }
      
      storageService.saveUsers(users.map(u => {
        if (u.id === userId) return currentUser;
        if (u.id === targetId) return targetUser;
        return u;
      }));
      storageService.saveCurrentUser(currentUser);
    },
    toggleSaveLesson: async (userId: string, lessonId: string): Promise<void> => {
      await delay(300);
      const users = storageService.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const saved = user.savedLessonIds || [];
      if (saved.includes(lessonId)) {
        user.savedLessonIds = saved.filter(id => id !== lessonId);
      } else {
        user.savedLessonIds = [...saved, lessonId];
      }
      
      storageService.saveUsers(users.map(u => u.id === userId ? user : u));
      storageService.saveCurrentUser(user);
    },
    bookTutorSession: async (session: TutorSession): Promise<void> => {
      await delay(600);
      const sessions = storageService.getTutorSessions();
      storageService.saveTutorSessions([session, ...sessions]);
    },
    joinEvent: async (userId: string, eventId: string): Promise<void> => {
      await delay(400);
      const events = storageService.getEvents();
      storageService.saveEvents(events.map(e => e.id === eventId ? { ...e, isJoined: !e.isJoined, attendees: e.isJoined ? e.attendees - 1 : e.attendees + 1 } : e));
    },
    createEvent: async (event: Event): Promise<void> => {
      await delay(600);
      const events = storageService.getEvents();
      storageService.saveEvents([event, ...events]);
    },
    updateEvent: async (event: Event): Promise<void> => {
      await delay(400);
      const events = storageService.getEvents();
      storageService.saveEvents(events.map(e => e.id === event.id ? event : e));
    },
    createGroup: async (group: Group): Promise<void> => {
      await delay(600);
      const groups = storageService.getGroups();
      storageService.saveGroups([group, ...groups]);
    },
    updateGroup: async (group: Group): Promise<void> => {
      await delay(400);
      const groups = storageService.getGroups();
      storageService.saveGroups(groups.map(g => g.id === group.id ? group : g));
    },
    deleteGroup: async (groupId: string): Promise<void> => {
      await delay(400);
      const groups = storageService.getGroups();
      storageService.saveGroups(groups.filter(g => g.id !== groupId));
    }
  },

  messaging: {
    sendMessage: async (senderId: string, participantId: string, text: string, groupId?: string): Promise<void> => {
      await delay(300);
      const conversations = storageService.getConversations();
      const users = storageService.getUsers();
      const user = users.find(u => u.id === senderId);
      if (!user) return;

      const newMessage: Message = {
        id: `m-${Date.now()}`,
        senderId: user.id,
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      };

      let convo = conversations.find(c => groupId ? c.groupId === groupId : (c.participantId === participantId && !c.groupId));

      if (convo) {
        convo.messages.push(newMessage);
        convo.lastMessage = text;
        convo.timestamp = 'Just now';
        storageService.saveConversations(conversations.map(c => c.id === convo!.id ? convo! : c));
      } else {
        const newConvo: Conversation = {
          id: `c-${Date.now()}`,
          participantId: groupId ? '' : participantId,
          groupId: groupId,
          lastMessage: text,
          timestamp: 'Just now',
          unreadCount: 0,
          messages: [newMessage]
        };
        storageService.saveConversations([newConvo, ...conversations]);
      }
    }
  },

  wallet: {
    purchasePoints: async (userId: string, amount: number): Promise<void> => {
      await delay(1000);
      const users = storageService.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      user.points += amount;
      
      const tx: Transaction = {
        id: `t-buy-${Date.now()}`,
        type: 'credit',
        amount: amount,
        description: `Purchased ${amount} Points`,
        timestamp: new Date().toLocaleDateString()
      };
      
      storageService.saveTransactions([tx, ...storageService.getTransactions()]);
      storageService.saveUsers(users.map(u => u.id === userId ? user : u));
      storageService.saveCurrentUser(user);
    }
  }
};
