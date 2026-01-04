
import { storageService } from './storage';
import { User, Box, Lesson, Transaction, Notification, Conversation, TutorSession, ViewState, Comment, Event, Group } from '../types';

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
      await delay(500);
      const boxes = storageService.getBoxes();
      const updatedBoxes = boxes.map(b => {
        if (b.id === boxId) {
          return { ...b, lessons: [...(b.lessons || []), lesson] };
        }
        return b;
      });
      storageService.saveBoxes(updatedBoxes);
    },
    addComment: async (userId: string, lessonId: string, text: string): Promise<Comment> => {
      await delay(300);
      const users = storageService.getUsers();
      const currentUser = users.find(u => u.id === userId);
      const boxes = storageService.getBoxes();
      
      if (!currentUser) throw new Error("User not found");
      
      const newComment: Comment = {
        id: `c-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: text,
        timestamp: 'Just now'
      };

      let found = false;
      boxes.forEach(box => {
        box.lessons.forEach(lesson => {
          if (lesson.id === lessonId) {
            lesson.comments = [...(lesson.comments || []), newComment];
            found = true;
          }
        });
      });

      if (found) storageService.saveBoxes(boxes);
      return newComment;
    },
    completeLesson: async (userId: string, lessonId: string): Promise<void> => {
      const boxes = storageService.getBoxes();
      boxes.forEach(box => {
        const lesson = box.lessons.find(l => l.id === lessonId);
        if (lesson && !lesson.completedByUserIds?.includes(userId)) {
          lesson.completedByUserIds = [...(lesson.completedByUserIds || []), userId];
          lesson.completionCount = (lesson.completionCount || 0) + 1;
        }
      });
      storageService.saveBoxes(boxes);
    }
  },

  social: {
    toggleFollow: async (currentUserId: string, targetUserId: string): Promise<void> => {
      const users = storageService.getUsers();
      const currentUser = users.find(u => u.id === currentUserId);
      const targetUser = users.find(u => u.id === targetUserId);
      
      if (!currentUser || !targetUser) return;
      
      const isFollowing = currentUser.following.includes(targetUserId);
      if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
      } else {
        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);
        
        const notif: Notification = {
          id: `n-${Date.now()}`,
          type: 'follow',
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorAvatar: currentUser.avatar,
          content: 'started following you',
          timestamp: 'Just now',
          isRead: false
        };
        const notifs = storageService.getNotifications();
        storageService.saveNotifications([notif, ...notifs]);
      }
      
      storageService.saveUsers(users);
      storageService.saveCurrentUser(currentUser);
    },
    toggleFavorite: async (userId: string, boxId: string): Promise<boolean> => {
      const users = storageService.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return false;
      
      const favorites = user.favoriteBoxIds || [];
      const isFav = favorites.includes(boxId);
      if (isFav) {
        user.favoriteBoxIds = favorites.filter(id => id !== boxId);
      } else {
        user.favoriteBoxIds = [...favorites, boxId];
      }
      
      storageService.saveUsers(users);
      storageService.saveCurrentUser(user);
      return !isFav;
    },
    toggleSaveLesson: async (userId: string, lessonId: string): Promise<boolean> => {
        const users = storageService.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return false;
        
        const saved = user.savedLessonIds || [];
        const isSaved = saved.includes(lessonId);
        if (isSaved) {
            user.savedLessonIds = saved.filter(id => id !== lessonId);
        } else {
            user.savedLessonIds = [...saved, lessonId];
        }
        
        storageService.saveUsers(users);
        storageService.saveCurrentUser(user);
        return !isSaved;
    },
    // Networking Methods
    joinEvent: async (userId: string, eventId: string): Promise<void> => {
        await delay(300);
        const events = storageService.getEvents();
        const updatedEvents = events.map(ev => {
            if (ev.id === eventId) {
                const isJoined = ev.isJoined;
                return { 
                    ...ev, 
                    isJoined: !isJoined, 
                    attendees: isJoined ? ev.attendees - 1 : ev.attendees + 1 
                };
            }
            return ev;
        });
        storageService.saveEvents(updatedEvents);
    },
    createEvent: async (event: Event): Promise<void> => {
        await delay(600);
        const events = storageService.getEvents();
        storageService.saveEvents([event, ...events]);
    },
    updateEvent: async (event: Event): Promise<void> => {
        await delay(300);
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
    },
    bookTutorSession: async (session: TutorSession): Promise<void> => {
        await delay(1000);
        const users = storageService.getUsers();
        const student = users.find(u => u.id === session.studentId);
        const tutor = users.find(u => u.id === session.tutorId);
        
        if (!student || !tutor) throw new Error("Participant not found");
        if (student.points < session.price) throw new Error("Insufficient points");

        // Points Transaction
        student.points -= session.price;
        tutor.points += Math.round(session.price * 0.9); // 10% platform fee

        const studentTx: Transaction = {
            id: `t-book-s-${Date.now()}`,
            type: 'debit',
            amount: session.price,
            description: `Tutoring Session: ${session.subject} with ${tutor.name}`,
            timestamp: new Date().toLocaleDateString()
        };

        const tutorTx: Transaction = {
            id: `t-book-t-${Date.now()}`,
            type: 'credit',
            amount: Math.round(session.price * 0.9),
            description: `Tutoring Session: ${session.subject} with ${student.name}`,
            timestamp: new Date().toLocaleDateString()
        };

        const sessions = storageService.getTutorSessions();
        storageService.saveTutorSessions([...sessions, session]);
        storageService.saveUsers(users);
        storageService.saveTransactions([studentTx, tutorTx, ...storageService.getTransactions()]);
        storageService.saveCurrentUser(student.id === storageService.getCurrentUser()?.id ? student : storageService.getCurrentUser());
    }
  },

  wallet: {
    purchasePoints: async (userId: string, amount: number): Promise<void> => {
      await delay(800);
      const users = storageService.getUsers();
      const currentUser = users.find(u => u.id === userId);
      if (!currentUser) throw new Error("User not found");
      
      currentUser.points += amount;
      
      const tx: Transaction = {
        id: `t-buy-${Date.now()}`,
        type: 'credit',
        amount: amount,
        description: `Purchased ${amount} Points`,
        timestamp: new Date().toLocaleDateString()
      };
      
      storageService.saveUsers(users);
      storageService.saveCurrentUser(currentUser);
      storageService.saveTransactions([tx, ...storageService.getTransactions()]);
    }
  }
};
