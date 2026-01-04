
import { Box, User, Lesson, Transaction, Notification, Conversation, Event, Reminder, Language, Group } from './types';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' style='background-color: %23f1f5f9;'%3E%3Cg stroke='%2394a3b8' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/g%3E%3C/svg%3E";

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    myNetwork: 'My Network',
    explore: 'Explore',
    calendar: 'Calendar',
    myBoxes: 'My Boxes',
    reports: 'Reports',
    wallet: 'Wallet',
    messages: 'Messages',
    notifications: 'Notifications',
    profile: 'Profile',
    logOut: 'Log Out',
    searchPlaceholder: 'Search...',
    menu: 'Menu',
    account: 'Account'
  },
  ar: {
    home: 'الرئيسية',
    myNetwork: 'شبكتي',
    explore: 'استكشاف',
    calendar: 'التقويم',
    myBoxes: 'صناديقي',
    reports: 'التقارير',
    wallet: 'المحفظة',
    messages: 'الرسائل',
    notifications: 'الإشعارات',
    profile: 'الملف الشخصي',
    logOut: 'تسجيل الخروج',
    searchPlaceholder: 'بحث...',
    menu: 'القائمة',
    account: 'الحساب'
  }
};

// --- Filter Constants ---
export const CATEGORIES = ['Technology', 'History', 'Arts', 'Language', 'Business', 'Science', 'Health', 'Lifestyle'];
export const AGE_GROUPS = ['Kids (5-12)', 'Teens (13-18)', 'Adults', 'All Ages'];
export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
export const REGIONS = ['Global', 'USA', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania']; 
export const LANGUAGES = ['English', 'Arabic', 'Spanish', 'French', 'German'];
// Fix: Added missing GENDERS constant export
export const GENDERS = ['All', 'Female', 'Male'];

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  handle: '@alex_j',
  avatar: DEFAULT_AVATAR,
  banner: 'https://picsum.photos/seed/bg/1000/300',
  role: 'student',
  bio: 'Lifelong learner obsessed with tech and art. #coding #art',
  points: 1250,
  followers: ['u2', 'u4'], // Followed by Sarah and Emily (Pending)
  following: ['u2', 'u3', 'inst_1'], // Following Sarah, Mike, and Tech Uni
  subscribedBoxIds: ['b1', 'b2'], // React and History
  streak: 12, // Active streak
  // lastLoginDate intentionally left undefined to trigger "new day" logic on first app load
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  // --- Institutes ---
  {
    id: 'inst_1',
    name: 'Global Tech University',
    handle: '@gt_university',
    avatar: 'https://images.unsplash.com/photo-1592280771800-bcf9de2bf5a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    role: 'institute',
    instituteType: 'University',
    bio: 'Empowering the next generation of innovators through accessible technology education.',
    points: 50000,
    followers: ['u1', 'u2', 'u5'],
    following: [],
    subscribedBoxIds: [],
  },
  {
    id: 'inst_2',
    name: 'Ministry of Education',
    handle: '@edu_gov',
    avatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1577093226759-42c2dbf18478?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    role: 'institute',
    instituteType: 'Ministry',
    bio: 'Official learning resources and standards for K-12 education.',
    points: 100000,
    followers: ['u2', 'u3'],
    following: [],
    subscribedBoxIds: [],
  },
  {
    id: 'inst_3',
    name: 'Little Stars Kindergarten',
    handle: '@little_stars',
    avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    role: 'institute',
    instituteType: 'Kindergarten',
    bio: 'Fun and engaging activities for early childhood development.',
    points: 2500,
    followers: ['u3'],
    following: [],
    subscribedBoxIds: [],
  },
  // --- Individual Users ---
  {
    id: 'u2',
    name: 'Sarah Chen',
    handle: '@sarah_dev',
    avatar: DEFAULT_AVATAR,
    banner: 'https://picsum.photos/seed/tech/1000/300',
    role: 'tutor',
    bio: 'Physics enthusiast and educator. Love #science and #react',
    points: 3400,
    followers: ['u1', 'u3'],
    following: ['u1'], // Follows Alex back (Mate)
    subscribedBoxIds: ['b2', 'b5'], // History and Business
    streak: 45,
    isTutor: true,
    tutorSubjects: ['Physics', 'React', 'Calculus'],
    tutorRate: 500,
    tutorRegion: 'Asia',
    tutorLanguages: ['English', 'Chinese'],
    tutorRating: 4.9,
    tutorReviewCount: 15
  },
  {
    id: 'u3',
    name: 'Mike Ross',
    handle: '@mike_history',
    avatar: DEFAULT_AVATAR,
    banner: 'https://picsum.photos/seed/history/1000/300',
    role: 'enthusiast',
    bio: 'Learning history one bite at a time. #history buff.',
    points: 2100,
    followers: ['u1'],
    following: ['u2'],
    subscribedBoxIds: ['b1', 'b4'], // React and Spanish
    streak: 3
  },
  {
    id: 'u4',
    name: 'Emily Blunt',
    handle: '@emily_art',
    avatar: DEFAULT_AVATAR,
    role: 'student',
    bio: 'Art history major looking to connect.',
    points: 800,
    followers: [],
    following: ['u1'], // Follows Alex
    subscribedBoxIds: ['b1', 'b3'], // React and Writing
  },
  {
    id: 'u5',
    name: 'David Kim',
    handle: '@math_wizard',
    avatar: DEFAULT_AVATAR,
    role: 'tutor',
    bio: 'Mathematics wizard.',
    points: 4200,
    followers: [],
    following: [],
    subscribedBoxIds: ['b2'], // History
    isTutor: true,
    tutorSubjects: ['Mathematics', 'Statistics'],
    tutorRate: 400,
    tutorRegion: 'USA',
    tutorLanguages: ['English'],
    tutorRating: 4.7,
    tutorReviewCount: 22
  },
  // Added users for Viewers List
  {
    id: 'u6',
    name: 'Michael Scott',
    handle: '@worlds_best_boss',
    avatar: DEFAULT_AVATAR,
    role: 'professional',
    bio: 'Regional Manager. Threat Level Midnight.',
    points: 1500,
    followers: ['u7', 'u8', 'u9'],
    following: [],
    subscribedBoxIds: ['b5'], // Business Strategy
  },
  {
    id: 'u7',
    name: 'Pam Beesly',
    handle: '@pam_art',
    avatar: DEFAULT_AVATAR,
    role: 'student',
    bio: 'Artist and Office Administrator.',
    points: 950,
    followers: [],
    following: ['u6'],
    subscribedBoxIds: ['b3'], // Creative Writing
  },
  {
    id: 'u8',
    name: 'Jim Halpert',
    handle: '@big_tuna',
    avatar: DEFAULT_AVATAR,
    role: 'professional',
    bio: 'Sales. Pranks.',
    points: 2200,
    followers: [],
    following: ['u7'],
    subscribedBoxIds: ['b5'],
  },
  {
    id: 'u9',
    name: 'Dwight Schrute',
    handle: '@beet_king',
    avatar: DEFAULT_AVATAR,
    role: 'enthusiast',
    bio: 'Assistant to the Regional Manager.',
    points: 3000,
    followers: ['u6'],
    following: ['u6'],
    subscribedBoxIds: ['b2', 'b5'],
  },
  {
    id: 'u10',
    name: 'Stanley Hudson',
    handle: '@stanley_h',
    avatar: DEFAULT_AVATAR,
    role: 'professional',
    bio: 'Did I stutter?',
    points: 500,
    followers: [],
    following: [],
    subscribedBoxIds: [],
  },
  {
    id: 'u11',
    name: 'Kevin Malone',
    handle: '@kevin_m',
    avatar: DEFAULT_AVATAR,
    role: 'enthusiast',
    bio: 'Accountant. Musician.',
    points: 600,
    followers: [],
    following: [],
    subscribedBoxIds: ['b4'], // Spanish for Kids
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'like',
    actorId: 'u2',
    actorName: 'Sarah Chen',
    actorAvatar: DEFAULT_AVATAR,
    content: 'liked your comment in "React in Bites"',
    timestamp: '2 hours ago',
    isRead: false,
    targetId: 'l1'
  },
  {
    id: 'n2',
    type: 'follow',
    actorId: 'u4',
    actorName: 'Emily Blunt',
    actorAvatar: DEFAULT_AVATAR,
    content: 'started following you',
    timestamp: '5 hours ago',
    isRead: false
  },
  {
    id: 'n3',
    type: 'system',
    actorName: 'LrnBox',
    content: 'You earned 50 points for daily login!',
    timestamp: '1 day ago',
    isRead: true
  },
  {
    id: 'n4',
    type: 'comment',
    actorId: 'u3',
    actorName: 'Mike Ross',
    actorAvatar: DEFAULT_AVATAR,
    content: 'replied to your discussion about History',
    timestamp: '1 day ago',
    isRead: true
  },
  {
    id: 'n5',
    type: 'system',
    actorId: 'inst_1',
    actorName: 'Global Tech University',
    actorAvatar: 'https://images.unsplash.com/photo-1592280771800-bcf9de2bf5a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    content: 'posted a new box: "Data Science 101"',
    timestamp: '3 days ago',
    isRead: true
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participantId: 'u2',
    lastMessage: 'Sure, I can help you with that React hook question!',
    timestamp: '10 min ago',
    unreadCount: 1,
    messages: [
      { id: 'm1', senderId: 'u1', text: 'Hey @sarah_dev, do you have a minute?', timestamp: '10:00 AM' },
      { id: 'm2', senderId: 'u2', text: 'Hi @alex_j! Of course.', timestamp: '10:05 AM' },
      { id: 'm3', senderId: 'u2', text: 'Sure, I can help you with that #react hook question!', timestamp: '10:15 AM' }
    ]
  },
  {
    id: 'c2',
    participantId: 'u3',
    lastMessage: 'Did you check out the new History Box?',
    timestamp: 'Yesterday',
    unreadCount: 0,
    messages: [
      { id: 'm1', senderId: 'u3', text: 'Did you check out the new #history Box?', timestamp: 'Yesterday' }
    ]
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    type: 'credit',
    amount: 500,
    description: 'Purchased 500 Points Pack',
    timestamp: '2023-10-15',
  },
  {
    id: 't2',
    type: 'debit',
    amount: 150,
    description: 'Unlocked "Advanced Calculus"',
    timestamp: '2023-10-18',
    relatedBoxId: 'b_calc'
  },
  {
    id: 't3',
    type: 'credit',
    amount: 50,
    description: 'Daily Login Bonus',
    timestamp: '2023-10-19',
  }
];

export const MOCK_EVENTS: Event[] = [
  { 
    id: 'e1', 
    title: 'React Summit 2024', 
    date: 'Oct 25, 2024', 
    time: '10:00 AM EST', 
    attendees: 120, 
    image: 'https://picsum.photos/seed/event1/200/200', 
    type: 'Webinar',
    isPrivate: false,
    creatorId: 'u2'
  },
  { 
    id: 'e2', 
    title: 'History Buffs Meetup', 
    date: 'Oct 28, 2024', 
    time: '6:00 PM EST', 
    attendees: 45, 
    image: 'https://picsum.photos/seed/event2/200/200', 
    type: 'Meetup',
    isPrivate: false,
    creatorId: 'u3'
  },
  { 
    id: 'e3', 
    title: 'Future of EdTech Panel', 
    date: 'Nov 05, 2024', 
    time: '1:00 PM EST', 
    attendees: 300, 
    image: 'https://picsum.photos/seed/event3/200/200', 
    type: 'Conference',
    isPrivate: false,
    creatorId: 'inst_1' // Hosted by Tech University
  },
  {
    id: 'e4',
    title: 'Private Art Workshop',
    date: 'Nov 12, 2024', 
    time: '3:00 PM EST',
    attendees: 5,
    image: 'https://picsum.photos/seed/artshop/200/200',
    type: 'Workshop',
    isPrivate: true,
    creatorId: 'u1', // Created by Current User (Alex)
    invitedUserIds: ['u2']
  }
];

export const MOCK_REMINDERS: Reminder[] = [
  {
    id: 'r1',
    title: 'Finish React Quiz',
    date: 'Oct 26, 2024',
    time: '08:00 PM',
    type: 'study',
    isCompleted: false
  },
  {
    id: 'r2',
    title: 'Submit History Essay',
    date: 'Oct 28, 2024',
    time: '11:59 PM',
    type: 'deadline',
    isCompleted: false
  }
];

export const MOCK_FOLLOWED_TAGS = [
  { tag: '#react', posts: 1240 },
  { tag: '#javascript', posts: 8500 },
  { tag: '#history', posts: 450 },
  { tag: '#design', posts: 1200 },
  { tag: '#art', posts: 300 },
  { tag: '#learning', posts: 5000 },
  { tag: '#tech', posts: 9000 },
  { tag: '#science', posts: 670 },
  { tag: '#writing', posts: 890 },
  { tag: '#business', posts: 2100 },
  { tag: '#ai', posts: 15000 },
  { tag: '#startups', posts: 430 }
];

const INITIAL_LESSONS_REACT: Lesson[] = [
  {
    id: 'l1',
    boxId: 'b1',
    title: 'Components Basics',
    content: 'React components are the building blocks of any #React application. They let you split the UI into independent, reusable pieces.',
    type: 'text',
    likes: 45,
    completionCount: 120,
    completedByUserIds: ['u2', 'u3', 'u6'],
    comments: [
        { id: 'c1', userId: 'u2', userName: 'Sarah Chen', userAvatar: DEFAULT_AVATAR, content: 'Great explanation! @alex_j check this out.', timestamp: '10m ago' }
    ],
    timestamp: '2 hours ago'
  },
  // ... other lessons omitted for brevity but would exist in real app
];

const INITIAL_LESSONS_HISTORY: Lesson[] = [
  {
    id: 'l3',
    boxId: 'b2',
    title: 'The Renaissance',
    content: 'The Renaissance was a fervent period of European cultural, artistic, political and economic “rebirth” following the Middle Ages. #history #europe',
    type: 'text',
    likes: 120,
    completionCount: 230,
    completedByUserIds: ['u2', 'u3', 'u5', 'u9'],
    comments: [],
    timestamp: '1 day ago'
  },
  // ... other lessons
];

export const MOCK_BOXES: Box[] = [
  {
    id: 'b1',
    title: 'React in Bites',
    description: 'Master #React.js concepts one micro-lesson at a time. Perfect for beginners.',
    creatorId: 'u2',
    creatorName: 'Sarah Chen',
    creatorAvatar: DEFAULT_AVATAR,
    category: 'Technology',
    tags: ['#react', '#javascript', '#coding', '#frontend'],
    subscribers: 1240,
    lessons: INITIAL_LESSONS_REACT,
    isPrivate: false,
    price: 0,
    coverImage: 'https://picsum.photos/seed/react/800/400',
    ageGroup: 'Adults',
    difficulty: 'Beginner',
    region: 'Global',
    language: 'English',
    genderAudience: 'All',
    sharedWithUserIds: [],
    hasCertificate: true // Enabled for demo
  },
  {
    id: 'b2',
    title: 'World History Highlights',
    description: 'Quick dives into the most important events that shaped our world. #history',
    creatorId: 'u3',
    creatorName: 'Mike Ross',
    creatorAvatar: DEFAULT_AVATAR,
    category: 'History',
    tags: ['#history', '#world', '#culture', '#facts'],
    subscribers: 850,
    lessons: INITIAL_LESSONS_HISTORY,
    isPrivate: false,
    price: 0,
    coverImage: 'https://picsum.photos/seed/history/800/400',
    ageGroup: 'All Ages',
    difficulty: 'Intermediate',
    region: 'Global',
    language: 'English',
    genderAudience: 'All',
    sharedWithUserIds: [],
    hasCertificate: true // Enabled for demo
  },
  {
    id: 'b3',
    title: 'Premium Creative Writing',
    description: 'Exclusive prompts and tips. Monetized content for serious writers.',
    creatorId: 'u1',
    creatorName: 'Alex Johnson',
    creatorAvatar: DEFAULT_AVATAR,
    category: 'Arts',
    tags: ['#writing', '#creative', '#storytelling'],
    subscribers: 300,
    lessons: [],
    isPrivate: true,
    price: 500, // Monetized
    coverImage: 'https://picsum.photos/seed/writing/800/400',
    ageGroup: 'Teens (13-18)',
    difficulty: 'Advanced',
    region: 'USA',
    language: 'English',
    genderAudience: 'All',
    sharedWithUserIds: [],
    hasCertificate: true // Enabled for demo
  }
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'grp-1',
    creatorId: 'u1',
    name: 'Study Buddies',
    description: 'Group for discussing React daily.',
    memberIds: ['u2', 'u3'],
    createdAt: '2023-10-20'
  }
];
