export interface UserProfile {
  id: number | string; // Allow string IDs for Firebase Auth UIDs
  name: string;
  title: string;
  location: string;
  bio: string;
  joinedAt: string;
  skills: string[];
  badges: Badge[];
  stats: UserStats;
  history: HistoryItem[];
  joinedSessions?: number[]; // Track IDs of joined sessions
  votedSessions?: number[]; // Track IDs of sessions where feedback was given
  tokens?: number;
  lastRewardClaimDate?: string; // Track the last date the daily reward was claimed
}

export interface Badge {
  id: number;
  name: string;
  icon: string;
  desc: string;
  date: string;
}

export interface UserStats {
  lessonsGiven: number;
  lessonsTaken: number;
  totalHours: number;
  reputation: number;
}

export interface HistoryItem {
  id: number;
  type: 'earned' | 'spent';
  text: string;
  amount: string;
  date: string;
}

export interface MarketItem {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  desc: string;
  qty?: number;
}

export interface RequestItem {
  id: number;
  title: string;
  description: string;
  requester: string;
  category: string;
  createdAt: string;
  priority: string;
  tags: string[];
  docId?: string; // Firebase Document ID needed for deletion/updates
}

export interface SessionItem {
  id: number;
  title: string;
  mentor: string;
  mentorId: number | string;
  originalRequester: string;
  date: string;
  time: string;
  participants: number;
  category: string;
  link: string;
  status: string;
  attended: boolean; // UI only property
  docId?: string; // Firebase Document ID
}

export interface Participation {
  id?: string;
  userId: string;
  userName: string;
  sessionId: number;
  sessionTitle: string;
  joinedAt: string;
}

export interface ResourceItem {
  id: number;
  title: string;
  type: 'video' | 'pdf';
  mentor: string;
  duration: string;
  downloads: number;
  category: string;
  description: string;
}

export interface Message {
  id: number;
  senderId?: number;
  senderName?: string;
  sender: 'me' | 'them' | 'bot' | 'user';
  text: string;
  time?: string;
  unread?: boolean;
}

export interface LeaderboardUser {
  id: number | string;
  name: string;
  points: number;
  role: string;
  expertise: string;
  badges: string[];
  avatarColor: string;
}

export interface Kudo {
  id: number | string;
  from: string;
  to: string;
  message: string;
  time: string;
  category: string;
}

export interface Theme {
  id: string;
  label: string;
  appBg: string;
  shell: string;
  pill: string;
  primaryBtn: string;
  secondaryBtn: string;
  chip: string;
  input: string;
  card: string;
}