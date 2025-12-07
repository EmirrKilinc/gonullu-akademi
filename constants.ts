import { Theme, UserProfile, MarketItem, RequestItem, SessionItem, LeaderboardUser, Badge } from './types';
import { 
  Code, BookOpen, Dumbbell, Music, PenTool, BrainCircuit, HeartPulse 
} from 'lucide-react';

export const RULES = {
  LESSON_COST: 3,            
  MENTOR_REWARD: 5,         
  ATTENDANCE_REWARD: 2,     
  DAILY_LOGIN_REWARD: 1
};

export const LIMITED_ITEMS_IDS = [1, 2];

export const SEMANTIC_MAP: Record<string, string[]> = {
  'teknoloji': ['yazılım', 'kodlama', 'java', 'python', 'react', 'yapay zeka', 'veri', 'html', 'css', 'tasarım', 'figma', 'photoshop', 'excel', 'robotik'],
  'dil': ['ingilizce', 'ispanyolca', 'almanca', 'fransızca', 'korece', 'konuşma', 'gramer', 'ielts', 'toefl', 'yabancı dil', 'tercüme'],
  'sanat': ['gitar', 'piyano', 'resim', 'çizim', 'fotoğraf', 'tiyatro', 'sinema', 'kurgu', 'bağlama', 'müzik', 'sanat tarihi'],
  'sinav': ['matematik', 'türkçe', 'fizik', 'kimya', 'biyoloji', 'tarih', 'coğrafya', 'lgs', 'yks', 'tyt', 'ayt', 'kpss', 'ales', 'geometri'],
  'gelisim': ['liderlik', 'girişimcilik', 'iletişim', 'diksiyon', 'zaman yönetimi', 'özgüven', 'kariyer', 'mülakat', 'cv', 'sunum'],
  'saglik': ['fitness', 'yoga', 'beslenme', 'diyet', 'meditasyon', 'psikoloji', 'pilates', 'koşu', 'sağlıklı yaşam']
};

export const USER_SKILLS = ['teknoloji', 'react', 'javascript', 'python', 'frontend']; 

export const CATEGORIES = [
  { id: 'all', name: 'Tümü', icon: null },
  { id: 'teknoloji', name: 'Teknoloji & Yazılım', icon: 'Code' },
  { id: 'dil', name: 'Yabancı Dil', icon: 'BookOpen' },
  { id: 'sinav', name: 'Sınavlara Hazırlık', icon: 'PenTool' },
  { id: 'sanat', name: 'Sanat & Tasarım', icon: 'Music' },
  { id: 'gelisim', name: 'Kişisel Gelişim', icon: 'BrainCircuit' },
  { id: 'saglik', name: 'Sağlık & Spor', icon: 'HeartPulse' },
];

export const THEMES: Record<string, Theme> = {
  glass: {
    id: 'glass',
    label: 'Glass Neon',
    appBg: 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100',
    shell: 'bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_18px_60px_rgba(15,23,42,0.6)]',
    pill: 'bg-white/10 text-slate-100 border border-white/20',
    primaryBtn: 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-emerald-500/20',
    secondaryBtn: 'bg-white/5 border border-white/30 text-slate-100 hover:bg-white/10',
    chip: 'bg-white/10 text-slate-100 border border-white/20',
    input: 'bg-black/30 border border-white/10 text-white placeholder-slate-400 focus:border-emerald-500/50',
    card: 'bg-white/5 border border-white/10 hover:border-white/20'
  }
};

// --- PREDEFINED BADGES ---
export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 1,
    name: "Gönüllü Kahraman",
    icon: "🦸‍♂️",
    desc: "Topluluğa katılarak ilk adımı attın.",
    date: new Date().toLocaleDateString('tr-TR')
  },
  {
    id: 2,
    name: "Bilgi Kaşifi",
    icon: "🧭",
    desc: "İlk dersine katılım sağladın.",
    date: new Date().toLocaleDateString('tr-TR')
  },
  {
    id: 3,
    name: "Topluluk Yıldızı",
    icon: "⭐",
    desc: "5'ten fazla derste aktif rol aldın.",
    date: "2023-10-15"
  }
];

// --- MOCK DATA ---

// Kullanıcı profili artık boş rozetlerle başlıyor
export const INITIAL_USER_PROFILE: UserProfile = {
  id: 0,
  name: "",
  title: "",
  location: "",
  bio: "",
  joinedAt: "",
  skills: [],
  badges: [], // Başlangıçta rozet yok, başarımla kazanılacak
  stats: { lessonsGiven: 0, lessonsTaken: 0, totalHours: 0, reputation: 0 },
  history: [],
  tokens: 20
};

export const MARKET_ITEMS: MarketItem[] = [
  { id: 1, name: "Gönüllü Akademi Hoodie", price: 50, category: "giyim", stock: 20, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", desc: "Siyah, kapüşonlu, %100 organik pamuklu ve logolu özel tasarım." },
  { id: 2, name: "Premium Termos Kupa", price: 25, category: "aksesuar", stock: 50, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", desc: "Sıcak veya soğuk tutan, mat siyah çelik termos." },
  { id: 3, name: "1 Fidan Bağışı (TEMA)", price: 10, category: "bağış", stock: 9999, image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", desc: "Geleceğe nefes ol. Senin adına bir fidan dikiyoruz." },
  { id: 4, name: "Patilere Mama Desteği", price: 5, category: "bağış", stock: 9999, image: "https://images.unsplash.com/photo-1589924691195-41432c84c161?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", desc: "Sokaktaki dostlarımız için günlük mama bağışı." },
  { id: 5, name: "Köy Okuluna Kırtasiye", price: 30, category: "bağış", stock: 500, image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", desc: "Bir öğrencinin defter, kalem, silgi setini karşıla." },
  { id: 6, name: "LÖSEV Bağışı", price: 20, category: "bağış", stock: 9999, image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", desc: "Minik kahramanlarımızın mücadelesine destek ol." },
  { id: 7, name: "Askıda Eğitim (Token)", price: 5, category: "bağış", stock: 9999, image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", desc: "Tokeni olmayan öğrencilerin ders alabilmesi için havuza katkı." },
  { id: 8, name: "Netflix Hediye Kartı", price: 100, category: "dijital", stock: 10, image: "https://images.unsplash.com/photo-1574375927938-d5a98e8efe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", desc: "1 Aylık standart paket hediye kartı. (Stoklarla sınırlı)" }
];

export const INITIAL_REQUESTS: RequestItem[] = [];

export const INITIAL_SESSIONS: SessionItem[] = [];

export const LEADERBOARD: LeaderboardUser[] = [];

export const KUDOS_FEED = [];