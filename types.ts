
export interface User {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  banner?: string;
  followers: string[];
  following: string[];
  streak: number;
  points: number;
  role: 'student' | 'tutor' | 'institute' | 'professional';
  subscribedBoxIds: string[];
  instituteType?: string;
  isTutor?: boolean;
  tutorSubjects?: string[];
  tutorRate?: number;
  tutorRegion?: string;
  tutorLanguages?: string[];
  tutorRating?: number;
  tutorReviewCount?: number;
}

export enum QuizType {
    SINGLE_CHOICE = 'SINGLE_CHOICE',
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
    FREE_FORM = 'FREE_FORM',
    CODE = 'CODE',
}

export interface AssessmentResultDetail {
    qId: string;
    question_en: string;
    question_ar: string;
    type: QuizType;
    userAns: any;
    correctAns: any;
    isCorrect: boolean;
    feedback_en?: string;
    feedback_ar?: string;
    options_en?: string[];
    options_ar?: string[];
}

export interface AssessmentResult {
    score: number;
    passed: boolean;
    details: AssessmentResultDetail[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  assessmentResult?: AssessmentResult;
}

export interface Box {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  lessons: Lesson[];
}

export interface Conversation {
  id: string;
  participantId: string;
  lastMessage: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
}
