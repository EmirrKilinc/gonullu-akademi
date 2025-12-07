import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Code,
  Dumbbell,
  Music,
  PenTool,
  Calendar,
  Users,
  PlusCircle,
  CheckCircle,
  Search,
  User as UserIcon,
  Trophy,
  Heart,
  Coins,
  Gift,
  Sparkles,
  X,
  Bell,
  MapPin,
  Edit3,
  Award,
  BrainCircuit,
  Save,
  Plus,
  FileBadge,
  Printer,
  ShoppingBag,
  ArrowRight,
  Clock,
  ShoppingCart,
  Trash2,
  Send,
  LogIn,
  LogOut,
  Mail,
  Lock,
  AlertCircle,
  ShieldAlert,
  Star,
  MessageSquare,
  Link,
  CalendarDays,
  Phone,
  Menu,
  Info,
  Zap,
} from "lucide-react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
  where,
  limit,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { auth, googleProvider, db } from "./firebaseConfig";

import {
  RULES,
  LIMITED_ITEMS_IDS,
  SEMANTIC_MAP,
  CATEGORIES,
  THEMES,
  INITIAL_USER_PROFILE,
  MARKET_ITEMS,
  INITIAL_REQUESTS,
  INITIAL_SESSIONS,
  BADGE_DEFINITIONS,
} from "./constants";
import {
  MarketItem,
  RequestItem,
  Badge as BadgeType,
  UserProfile,
  LeaderboardUser,
  SessionItem,
  Participation,
  HistoryItem,
  Kudo,
} from "./types";

// --- KNOWLEDGE GRAPH FOR AI RECOMMENDATIONS ---
// Bu grafik, srodne terimleri ve yetenekleri birbirine bağlar.
const KNOWLEDGE_GRAPH: Record<string, string[]> = {
  yazilim: [
    "react",
    "javascript",
    "frontend",
    "backend",
    "python",
    "java",
    "c#",
    "kodlama",
    "web",
    "mobil",
    "app",
    "sql",
    "veri",
    "html",
    "css",
    "nodejs",
  ],
  tasarim: [
    "figma",
    "photoshop",
    "ui",
    "ux",
    "grafik",
    "logo",
    "art",
    "sanat",
    "çizim",
    "illüstrasyon",
    "adobe",
    "video",
    "kurgu",
  ],
  dil: [
    "ingilizce",
    "almanca",
    "ispanyolca",
    "fransızca",
    "konuşma",
    "gramer",
    "çeviri",
    "hazırlık",
    "toefl",
    "ielts",
    "yabancı dil",
  ],
  spor: [
    "fitness",
    "yoga",
    "pilates",
    "futbol",
    "basketbol",
    "yüzme",
    "beslenme",
    "sağlık",
    "diyet",
    "koşu",
  ],
  muzik: [
    "gitar",
    "piyano",
    "keman",
    "nota",
    "şarkı",
    "vokal",
    "beste",
    "davul",
    "saz",
    "bağlama",
  ],
  akademik: [
    "matematik",
    "fizik",
    "kimya",
    "biyoloji",
    "tarih",
    "coğrafya",
    "edebiyat",
    "tyt",
    "ayt",
    "lgs",
    "sınav",
  ],
};

// --- MOCK DATA FOR DEMO MODE ---
const MOCK_USER: any = {
  uid: "mock-user-123",
  displayName: "Demo Kullanıcı",
  email: "demo@gonulluakademi.com",
  photoURL: null,
  isAnonymous: false,
  emailVerified: true,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
};

// Helper to format date
const getCurrentFormattedDate = () => {
  return new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  // Custom Alert State
  const [alertState, setAlertState] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  // Custom Alert Helper
  const showAlert = (message: string) => {
    setAlertState({ show: true, message });
  };

  const closeAlert = () => {
    setAlertState({ show: false, message: "" });
  };

  // Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mobile Menu State
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Theme state
  const [activeTheme, setActiveTheme] = useState("glass");
  const theme = THEMES[activeTheme];

  // Data States
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  // Local/User states
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [kudosList, setKudosList] = useState<Kudo[]>([]);
  const [userProfile, setUserProfile] =
    useState<UserProfile>(INITIAL_USER_PROFILE);
  const [cart, setCart] = useState<MarketItem[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<number[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [userTokens, setUserTokens] = useState(20);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);
  const [recommendedMentors, setRecommendedMentors] = useState<
    LeaderboardUser[]
  >([]);

  const [showCartModal, setShowCartModal] = useState(false);
  const [newReqTitle, setNewReqTitle] = useState("");
  const [newReqDesc, setNewReqDesc] = useState("");
  const [newReqCat, setNewReqCat] = useState("yazilim");

  // Donate
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donateUser, setDonateUser] = useState<{
    id: number | string;
    name: string;
  } | null>(null);
  const [donationAmount, setDonationAmount] = useState("");

  // Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSession, setFeedbackSession] = useState<SessionItem | null>(
    null
  );
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Mentor Approval Modal
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [selectedRequestToMentor, setSelectedRequestToMentor] =
    useState<RequestItem | null>(null);
  const [mentorForm, setMentorForm] = useState({
    date: "",
    time: "",
    link: "",
  });

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // MENTOR SELECTION FOR NOTIFICATIONS
  const [selectedMentors, setSelectedMentors] = useState<(number | string)[]>(
    []
  );

  // Profile Edit
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    title: "",
    location: "",
    bio: "",
    skills: [] as string[],
  });
  const [newSkillInput, setNewSkillInput] = useState("");

  // Certificates
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<{
    title: string;
    date: string;
    recipient: string;
    description: string;
  } | null>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  // --- SEED DATABASE ---
  const seedDatabase = async () => {
    if (isMockMode) return;

    try {
      // Seed Market
      const marketSnap = await getDocs(collection(db, "market"));
      if (marketSnap.empty) {
        const batch = writeBatch(db);
        MARKET_ITEMS.forEach((item) => {
          const docRef = doc(collection(db, "market"));
          batch.set(docRef, item);
        });
        await batch.commit();
        console.log("Market seeded");
      }
    } catch (e) {
      console.error("Seeding error:", e);
    }
  };

  // --- REALTIME LISTENERS ---
  useEffect(() => {
    // If Mock Mode, load constants directly
    if (isMockMode) {
      setRequests(INITIAL_REQUESTS);
      setSessions(INITIAL_SESSIONS);
      setMarketItems(MARKET_ITEMS);
      setLeaderboard([
        {
          id: 1,
          name: "Selin D.",
          points: 1250,
          role: "Yazılım Mentörü",
          expertise: "yazilim",
          badges: ["Top Contributor"],
          avatarColor: "bg-purple-100 text-purple-600",
        },
        {
          id: 2,
          name: "Barış M.",
          points: 980,
          role: "Müzik Eğitmeni",
          expertise: "sanat",
          badges: ["Super Star"],
          avatarColor: "bg-orange-100 text-orange-600",
        },
      ]);
      return;
    }

    try {
      // Run seeding check once
      seedDatabase();

      // Listen Requests
      const qReq = query(collection(db, "requests"), orderBy("id", "desc"));
      const unsubReq = onSnapshot(qReq, (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ ...d.data(), docId: d.id } as RequestItem)
        );
        setRequests(data);
      });

      // Listen Sessions
      const qSess = query(collection(db, "sessions"), orderBy("date", "asc"));
      const unsubSess = onSnapshot(qSess, (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ ...d.data(), docId: d.id } as SessionItem)
        );
        setSessions(data);
      });

      // Listen Market
      const unsubMarket = onSnapshot(collection(db, "market"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data() } as MarketItem));
        // Filter duplicates by ID locally just in case
        const uniqueData = data.filter(
          (v, i, a) => a.findIndex((v2) => v2.id === v.id) === i
        );
        uniqueData.sort((a, b) => a.id - b.id);
        setMarketItems(uniqueData);
      });

      // Listen Leaderboard (Users ordered by reputation)
      const qUsers = query(
        collection(db, "users"),
        orderBy("stats.reputation", "desc"),
        limit(20)
      );
      const unsubUsers = onSnapshot(qUsers, (snapshot) => {
        const users = snapshot.docs.map((d) => {
          const data = d.data() as UserProfile;
          return {
            id: d.id,
            name: data.name,
            points: data.stats.reputation, // Mapping reputation to points
            role: data.title || "Gönüllü",
            expertise:
              data.skills && data.skills.length > 0 ? data.skills[0] : "Genel", // Use first skill as main expertise
            badges: data.badges.map((b) => b.name),
            avatarColor: "bg-indigo-100 text-indigo-600",
          } as LeaderboardUser;
        });
        setLeaderboard(users);
      });

      // Listen Kudos
      const qKudos = query(
        collection(db, "kudos"),
        orderBy("id", "desc"),
        limit(10)
      );
      const unsubKudos = onSnapshot(qKudos, (snapshot) => {
        const kudos = snapshot.docs.map((d) => ({ ...d.data() } as Kudo));
        setKudosList(kudos);
      });

      return () => {
        unsubReq();
        unsubSess();
        unsubMarket();
        unsubUsers();
        unsubKudos();
      };
    } catch (e) {
      console.error("Error setting up listeners:", e);
      // Fallback to mock data on error
      setRequests(INITIAL_REQUESTS);
      setSessions(INITIAL_SESSIONS);
      setMarketItems(MARKET_ITEMS);
    }
  }, [isMockMode]);

  // Firestore User Document Creation Helper
  const createUserDocument = async (user: User, additionalData: any = {}) => {
    if (isMockMode || !user) {
      return {
        ...INITIAL_USER_PROFILE,
        name: user?.displayName || "Demo Kullanıcı",
        email: user?.email || "demo@example.com",
        ...additionalData,
      };
    }

    const userRef = doc(db, "users", user.uid);
    try {
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) {
        const { email } = user;
        const displayName =
          user.displayName || email?.split("@")[0] || "İsimsiz Kullanıcı";

        // Yeni kullanıcı için profil, başlangıçta rozet yok
        const newUserProfile = {
          id: user.uid,
          name: displayName,
          email,
          title: "",
          location: "",
          bio: "",
          joinedAt: new Date().toLocaleDateString("tr-TR", {
            month: "long",
            year: "numeric",
          }),
          skills: [],
          badges: [], // Başlangıçta boş
          stats: {
            lessonsGiven: 0,
            lessonsTaken: 0,
            totalHours: 0,
            reputation: 0,
          },
          history: [
            {
              id: Date.now(),
              type: "earned",
              text: "Aramıza katıldın!",
              amount: "+20",
              date: getCurrentFormattedDate(),
            },
          ],
          joinedSessions: [],
          votedSessions: [],
          tokens: 20, // Initial Token 20
          lastRewardClaimDate: "",
          ...additionalData,
        };

        await setDoc(userRef, newUserProfile);
        return newUserProfile;
      }
      return snapshot.data();
    } catch (error) {
      console.error("Error creating user document", error);
      return { ...INITIAL_USER_PROFILE, ...additionalData };
    }
  };

  // --- GAMIFICATION LOGIC: Calculate Stats & Award Badges ---
  useEffect(() => {
    if (!currentUser || sessions.length === 0) return;

    // 1. Calculate Stats Dynamically from Sessions
    const myJoinedSessions = userProfile.joinedSessions || [];
    const lessonsGiven = sessions.filter(
      (s) => String(s.mentorId) === String(currentUser.uid)
    ).length;
    const lessonsTaken = myJoinedSessions.length;
    const totalHours = (lessonsGiven + lessonsTaken) * 1; // Assuming 1 hour per session for simplicity

    // 2. Check for New Badges
    const currentBadges = [...userProfile.badges];
    const newBadges: BadgeType[] = [];

    // Badge ID 1: Gönüllü Kahraman (İlk dersi verme)
    if (lessonsGiven >= 1 && !currentBadges.find((b) => b.id === 1)) {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === 1);
      if (badge)
        newBadges.push({
          ...badge,
          date: new Date().toLocaleDateString("tr-TR"),
        });
    }

    // Badge ID 2: Bilgi Kaşifi (İlk derse katılma)
    if (lessonsTaken >= 1 && !currentBadges.find((b) => b.id === 2)) {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === 2);
      if (badge)
        newBadges.push({
          ...badge,
          date: new Date().toLocaleDateString("tr-TR"),
        });
    }

    // Badge ID 3: Topluluk Yıldızı (5+ Aktivite)
    if (
      lessonsGiven + lessonsTaken >= 5 &&
      !currentBadges.find((b) => b.id === 3)
    ) {
      const badge = BADGE_DEFINITIONS.find((b) => b.id === 3);
      if (badge)
        newBadges.push({
          ...badge,
          date: new Date().toLocaleDateString("tr-TR"),
        });
    }

    // 3. Update Profile Logic (Only if changes detected to prevent loop)
    const statsChanged =
      lessonsGiven !== userProfile.stats.lessonsGiven ||
      lessonsTaken !== userProfile.stats.lessonsTaken ||
      totalHours !== userProfile.stats.totalHours;

    if (statsChanged || newBadges.length > 0) {
      // Notify user about new badge
      if (newBadges.length > 0) {
        newBadges.forEach((b) =>
          showAlert(`Tebrikler! Yeni bir rozet kazandın: ${b.name}`)
        );
      }

      const updatedProfile = {
        ...userProfile,
        badges: [...currentBadges, ...newBadges],
        stats: {
          ...userProfile.stats,
          lessonsGiven,
          lessonsTaken,
          totalHours,
          // Reputation is kept as is from DB (updated via feedback)
        },
      };

      setUserProfile(updatedProfile);

      // Persist to Firestore
      if (!isMockMode) {
        const updates: any = {
          "stats.lessonsGiven": lessonsGiven,
          "stats.lessonsTaken": lessonsTaken,
          "stats.totalHours": totalHours,
        };
        if (newBadges.length > 0) {
          updates.badges = [...currentBadges, ...newBadges];
        }

        updateDoc(doc(db, "users", currentUser.uid), updates).catch((err) =>
          console.error("Error updating stats", err)
        );
      }
    }
  }, [sessions, currentUser, userProfile.joinedSessions, isMockMode]);

  // Firebase Auth Listener
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          if (isMockMode) return;

          setCurrentUser(user);
          if (user) {
            setLoading(true);
            try {
              const userDoc = await getDoc(doc(db, "users", user.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data() as UserProfile;
                setUserProfile(userData);
                if ((userData as any).tokens !== undefined)
                  setUserTokens((userData as any).tokens);

                // Check daily reward status
                const today = new Date().toDateString();
                if (userData.lastRewardClaimDate === today) {
                  setDailyRewardClaimed(true);
                } else {
                  setDailyRewardClaimed(false);
                }
              } else {
                setUserProfile((prev) => ({
                  ...prev,
                  name:
                    user.displayName || user.email?.split("@")[0] || prev.name,
                }));
              }
            } catch (err) {
              console.error("Error fetching user data:", err);
            }
            setShowLoginModal(false);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Auth listener error:", error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase Auth not configured correctly.", e);
      setLoading(false);
    }
  }, [isMockMode]);

  const updateUserInFirestore = async (newData: Partial<UserProfile>) => {
    if (isMockMode) {
      setUserProfile((prev) => ({ ...prev, ...newData }));
      return;
    }
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), newData);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  // --- SMART MENTOR MATCHING ALGORITHM ---
  useEffect(() => {
    if (activeTab === "create") {
      // 1. Filter by Expertise/Category
      // 2. Sort by Reputation (Points) - Highest First
      const mentors = leaderboard
        .filter((m) => {
          const expertiseMatch =
            m.expertise &&
            m.expertise.toLowerCase().includes(newReqCat.toLowerCase());
          const roleMatch =
            m.role && m.role.toLowerCase().includes(newReqCat.toLowerCase());

          // Check Knowledge Graph for related skills
          const relatedSkills = KNOWLEDGE_GRAPH[newReqCat.toLowerCase()] || [];
          const knowledgeMatch = relatedSkills.some(
            (skill) =>
              m.expertise.toLowerCase().includes(skill) ||
              m.role.toLowerCase().includes(skill)
          );

          return expertiseMatch || roleMatch || knowledgeMatch;
        })
        .sort((a, b) => b.points - a.points); // Sort by points descending

      setRecommendedMentors(mentors);
      // Reset selection when category changes
      setSelectedMentors([]);
    }
  }, [newReqCat, activeTab, leaderboard]);

  // --- AI RELEVANCE SCORE CALCULATION ---
  const calculateRelevanceScore = (
    userSkills: string[],
    request: RequestItem
  ): number => {
    let score = 0;
    const skillsLower = userSkills.map((s) => s.toLowerCase());
    const titleLower = request.title.toLowerCase();
    const descLower = request.description.toLowerCase();
    const catLower = request.category.toLowerCase();
    const tagsLower = (request.tags || []).map((t) => t.toLowerCase());

    // 1. Direct Skill Match (Highest Weight)
    skillsLower.forEach((skill) => {
      if (titleLower.includes(skill)) score += 30;
      if (descLower.includes(skill)) score += 15;
      if (tagsLower.includes(skill)) score += 20;
    });

    // 2. Category Match
    if (skillsLower.includes(catLower)) score += 25;

    // 3. Knowledge Graph / Semantic Match (Smart AI)
    skillsLower.forEach((skill) => {
      // Find which domain this skill belongs to in Knowledge Graph
      Object.entries(KNOWLEDGE_GRAPH).forEach(([domain, terms]) => {
        if (terms.includes(skill) || domain === skill) {
          // If the request matches this domain or any term in it
          if (
            catLower === domain ||
            terms.some((t) => titleLower.includes(t) || tagsLower.includes(t))
          ) {
            score += 10;
          }
        }
      });
    });

    return Math.min(score, 100); // Cap at 100%
  };

  const handleRestrictedAction = (action: () => void) => {
    if (!currentUser) {
      setShowLoginModal(true);
    } else {
      action();
    }
  };

  const activateMockMode = (displayName = "Demo Kullanıcı") => {
    setIsMockMode(true);
    const mockUser = { ...MOCK_USER, displayName };
    setCurrentUser(mockUser);
    setUserProfile({ ...INITIAL_USER_PROFILE, name: displayName });
    setShowLoginModal(false);
    setAuthError("");
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthError("");
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await createUserDocument(result.user);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      if (
        error.code === "auth/api-key-not-valid" ||
        error.message.includes("api-key-not-valid") ||
        error.code === "auth/configuration-not-found"
      ) {
        activateMockMode("Google Kullanıcısı (Demo)");
      } else {
        setAuthError("Giriş hatası: " + error.message);
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!email || !password) {
      setAuthError("Lütfen email ve şifre giriniz.");
      return;
    }

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (userCredential.user) {
          const displayName = email.split("@")[0];
          await updateProfile(userCredential.user, { displayName });
          await createUserDocument(userCredential.user, { name: displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      if (
        error.code === "auth/api-key-not-valid" ||
        error.message.includes("api-key-not-valid")
      ) {
        activateMockMode(email.split("@")[0]);
        return;
      }
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    if (isMockMode) {
      setIsMockMode(false);
      setCurrentUser(null);
      setActiveTab("home");
      setUserProfile(INITIAL_USER_PROFILE);
      return;
    }
    try {
      await signOut(auth);
      setActiveTab("home");
      setEmail("");
      setPassword("");
      setUserProfile(INITIAL_USER_PROFILE);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleClaimDailyReward = async () => {
    const today = new Date().toDateString();

    if (dailyRewardClaimed) {
      showAlert("Bugünkü ödülünü zaten aldın. Yarın tekrar gel!");
      return;
    }

    if (!currentUser && !isMockMode) {
      setShowLoginModal(true);
      return;
    }

    const newTokens = userTokens + RULES.DAILY_LOGIN_REWARD;
    setUserTokens(newTokens);
    setDailyRewardClaimed(true);

    const historyItem: HistoryItem = {
      id: Date.now(),
      type: "earned",
      text: "Günlük Giriş Ödülü",
      amount: `+${RULES.DAILY_LOGIN_REWARD}`,
      date: getCurrentFormattedDate(),
    };

    const newHistory = [historyItem, ...(userProfile.history || [])];
    setUserProfile((prev) => ({
      ...prev,
      history: newHistory,
      lastRewardClaimDate: today,
    }));

    if (currentUser && !isMockMode) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          tokens: newTokens,
          lastRewardClaimDate: today,
          history: newHistory,
        });
      } catch (e) {
        console.error("Error claiming reward:", e);
      }
    }

    showAlert(`Hoş geldin! +${RULES.DAILY_LOGIN_REWARD} Token kazandın.`);
  };

  const handleAddToCart = (item: MarketItem) => {
    setOrderSuccess(false);
    if (LIMITED_ITEMS_IDS.includes(item.id)) {
      const alreadyPurchased = purchasedItems.includes(item.id);
      const alreadyInCart = cart.some((cartItem) => cartItem.id === item.id);
      if (alreadyPurchased || alreadyInCart) {
        showAlert("Limit: Kişi başı 1 adet.");
        return;
      }
    }
    if (item.stock <= 0) {
      showAlert("Üzgünüz, bu ürün tükenmiş.");
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, qty: (i.qty || 0) + 1 } : i
        );
      } else {
        return [...prevCart, { ...item, qty: 1 }];
      }
    });
    setShowCartModal(true);
  };

  const handleRemoveFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleCheckout = async () => {
    const total = cart.reduce(
      (acc, item) => acc + item.price * (item.qty || 1),
      0
    );
    if (userTokens >= total) {
      const newTokens = userTokens - total;
      setUserTokens(newTokens);
      setPurchasedItems((prev) => [...prev, ...cart.map((i) => i.id)]);

      const historyItem: HistoryItem = {
        id: Date.now(),
        type: "spent",
        text: "Market Alışverişi",
        amount: `-${total}`,
        date: getCurrentFormattedDate(),
      };

      const newHistory = [historyItem, ...(userProfile.history || [])];
      setUserProfile((prev) => ({ ...prev, history: newHistory }));

      if (currentUser && !isMockMode) {
        const batch = writeBatch(db);
        const userRef = doc(db, "users", currentUser.uid);
        batch.update(userRef, {
          tokens: newTokens,
          history: newHistory,
        });
        await batch.commit();
      }

      setCart([]);
      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        setShowCartModal(false);
      }, 2000);
    } else {
      showAlert("Yetersiz Token!");
    }
  };

  const toggleMentorSelection = (mentorId: number | string) => {
    setSelectedMentors((prev) => {
      if (prev.includes(mentorId)) {
        return prev.filter((id) => id !== mentorId);
      } else {
        return [...prev, mentorId];
      }
    });
  };

  const handleBecomeMentorClick = (req: RequestItem) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    setSelectedRequestToMentor(req);
    setMentorForm({ date: "", time: "", link: "" });
    setShowMentorModal(true);
  };

  const handleConfirmMentor = async () => {
    if (!currentUser || !selectedRequestToMentor) return;
    if (!mentorForm.date || !mentorForm.time || !mentorForm.link) {
      showAlert("Lütfen tüm alanları doldurun: Tarih, Saat ve Toplantı Linki");
      return;
    }

    const req = selectedRequestToMentor;

    const newSession: SessionItem = {
      id: Date.now(),
      title: req.title,
      mentor: userProfile.name,
      mentorId: currentUser.uid,
      originalRequester: req.requester,
      date: mentorForm.date,
      time: mentorForm.time,
      participants: 0,
      category: req.category,
      link: mentorForm.link,
      status: "Planlandı",
      attended: false,
    };

    if (isMockMode) {
      setSessions([newSession, ...sessions]);
      setRequests(requests.filter((r) => r.id !== req.id));
    } else {
      try {
        await addDoc(collection(db, "sessions"), newSession);
        if (req.docId) {
          await deleteDoc(doc(db, "requests", req.docId));
        }
      } catch (e) {
        console.error("Error converting request to session:", e);
      }
    }

    setShowMentorModal(false);
    showAlert("Harika! Dersi oluşturdun. Link katılımcılarla paylaşılacak.");
    setActiveTab("sessions");
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqTitle || !newReqDesc) return;

    if (userTokens < RULES.LESSON_COST) {
      showAlert("Yetersiz Token!");
      return;
    }

    const newRequest: RequestItem = {
      id: Date.now(),
      title: newReqTitle,
      description: newReqDesc,
      requester: userProfile.name,
      category: newReqCat,
      createdAt: getCurrentFormattedDate(),
      priority: "Normal",
      tags: [newReqCat],
    };

    if (isMockMode) {
      setRequests([newRequest, ...requests]);
    } else {
      try {
        await addDoc(collection(db, "requests"), newRequest);

        // --- SEND NOTIFICATIONS TO SELECTED MENTORS ---
        // Mentörleri uyar: "Seni bir ilana davet etti"
        if (selectedMentors.length > 0) {
          const batch = writeBatch(db);
          selectedMentors.forEach((mentorId) => {
            if (typeof mentorId === "string") {
              const mentorRef = doc(db, "users", mentorId);
              const notification: HistoryItem = {
                id: Date.now() + Math.random(),
                type: "earned", // Using 'earned' for positive notification color
                text: `${userProfile.name} seni "${newReqTitle}" ilanına davet etti.`,
                amount: "Bildirim",
                date: getCurrentFormattedDate(),
              };
              // Note: We are using arrayUnion for history/notifications
              batch.update(mentorRef, {
                history: arrayUnion(notification),
              });
            }
          });
          await batch.commit();
        }
      } catch (e) {
        console.error("Error creating request:", e);
      }
    }

    const newTokens = userTokens - RULES.LESSON_COST;
    setUserTokens(newTokens);

    const historyText =
      selectedMentors.length > 0
        ? `İlan açtın (${selectedMentors.length} mentöre bildirildi)`
        : "İlan açtın";
    const historyItem = {
      id: Date.now(),
      type: "spent",
      text: historyText,
      amount: `-${RULES.LESSON_COST}`,
      date: getCurrentFormattedDate(),
    } as any;

    const newHistory = [historyItem, ...userProfile.history];
    setUserProfile((prev) => ({ ...prev, history: newHistory }));

    if (currentUser && !isMockMode) {
      updateDoc(doc(db, "users", currentUser.uid), {
        tokens: newTokens,
        history: newHistory,
      });
    }

    let message = "Talep oluşturuldu!";
    if (selectedMentors.length > 0) {
      message += `\n\nSeçilen ${selectedMentors.length} mentöre bildirim gönderildi.`;
    }

    setNewReqTitle("");
    setNewReqDesc("");
    setSelectedMentors([]);
    setActiveTab("requests");
    showAlert(message);
  };

  const handleJoinSession = async (session: SessionItem) => {
    const alreadyJoined = userProfile.joinedSessions?.includes(session.id);
    if (alreadyJoined) {
      showAlert("Zaten katıldınız.");
      return;
    }

    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    const historyItem: HistoryItem = {
      id: Date.now(),
      type: "earned",
      text: `"${session.title}" dersine katıldın`,
      amount: "0",
      date: getCurrentFormattedDate(),
    };

    if (!isMockMode && session.docId) {
      try {
        const sessionRef = doc(db, "sessions", session.docId);
        await updateDoc(sessionRef, { participants: session.participants + 1 });

        const participationData: Participation = {
          userId: currentUser.uid,
          userName: userProfile.name,
          sessionId: session.id,
          sessionTitle: session.title,
          joinedAt: new Date().toISOString(),
        };
        await addDoc(collection(db, "participations"), participationData);

        if (currentUser) {
          const newJoined = [...(userProfile.joinedSessions || []), session.id];
          const newHistory = [historyItem, ...(userProfile.history || [])];

          await updateDoc(doc(db, "users", currentUser.uid), {
            joinedSessions: newJoined,
            history: newHistory,
          });

          setUserProfile((prev) => ({
            ...prev,
            joinedSessions: newJoined,
            history: newHistory,
          }));
        }
      } catch (e) {
        console.error("Join error:", e);
      }
    } else {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === session.id) {
            return { ...s, participants: s.participants + 1 };
          }
          return s;
        })
      );
      const newJoined = [...(userProfile.joinedSessions || []), session.id];
      const newHistory = [historyItem, ...(userProfile.history || [])];

      setUserProfile((prev) => ({
        ...prev,
        joinedSessions: newJoined,
        history: newHistory,
      }));
    }

    showAlert("Derse kaydoldun! Başlamadan önce link aktif olacak.");
  };

  const handleOpenFeedback = (session: SessionItem) => {
    setFeedbackSession(session);
    setFeedbackRating(5);
    setFeedbackMessage("");
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackSession || !currentUser) return;
    if (isMockMode) {
      showAlert("Demo modunda geri bildirim simülasyonu yapıldı.");
      setShowFeedbackModal(false);
      return;
    }

    try {
      const batch = writeBatch(db);

      const mentorId = String(feedbackSession.mentorId);
      const mentorRef = doc(db, "users", mentorId);

      batch.update(mentorRef, {
        "stats.reputation": increment(feedbackRating * 10),
        tokens: increment(RULES.MENTOR_REWARD),
      });

      const kudoData: Kudo = {
        id: Date.now(),
        from: userProfile.name,
        to: feedbackSession.mentor,
        message: feedbackMessage || "Ders için teşekkürler! 🌟",
        time: getCurrentFormattedDate(),
        category: feedbackSession.category,
      };
      const kudosRef = doc(collection(db, "kudos"));
      batch.set(kudosRef, kudoData);

      const userRef = doc(db, "users", currentUser.uid);
      const newVoted = [
        ...(userProfile.votedSessions || []),
        feedbackSession.id,
      ];
      batch.update(userRef, { votedSessions: newVoted });

      await batch.commit();

      setUserProfile((prev) => ({ ...prev, votedSessions: newVoted }));

      showAlert("Puan ve yorumunuz mentöre iletildi!");
      setShowFeedbackModal(false);
    } catch (e) {
      console.error("Feedback error:", e);
      showAlert("Bir hata oluştu.");
    }
  };

  const handleDonate = (userId: number | string, userName: string) => {
    setDonateUser({ id: userId, name: userName });
    setDonationAmount("");
    setShowDonateModal(true);
  };

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(donationAmount);
    if (isNaN(amount) || amount <= 0) return showAlert("Geçersiz miktar");
    if (userTokens < amount) return showAlert("Yetersiz bakiye");
    if (!donateUser) return;

    const newTokens = userTokens - amount;
    setUserTokens(newTokens);
    setShowDonateModal(false);

    const senderHistoryItem: HistoryItem = {
      id: Date.now(),
      type: "spent",
      text: `${donateUser.name} kullanıcısına bağış`,
      amount: `-${amount}`,
      date: getCurrentFormattedDate(),
    };

    const receiverHistoryItem: HistoryItem = {
      id: Date.now() + 1,
      type: "earned",
      text: `${userProfile.name} kullanıcısından bağış`,
      amount: `+${amount}`,
      date: getCurrentFormattedDate(),
    };

    const newHistory = [senderHistoryItem, ...(userProfile.history || [])];
    setUserProfile((prev) => ({ ...prev, history: newHistory }));

    if (currentUser && !isMockMode) {
      try {
        const batch = writeBatch(db);
        const senderRef = doc(db, "users", currentUser.uid);
        const receiverRef = doc(db, "users", String(donateUser.id));

        batch.update(senderRef, {
          tokens: newTokens,
          history: newHistory,
        });

        batch.update(receiverRef, {
          tokens: increment(amount),
          history: arrayUnion(receiverHistoryItem),
        });

        await batch.commit();
      } catch (e) {
        console.error("Donation error:", e);
        showAlert("Bağış sırasında bir hata oluştu.");
      }
    }

    showAlert(`${amount} Token başarıyla gönderildi!`);
  };

  const handleEditProfileClick = () => {
    setEditFormData({
      name: userProfile.name,
      title: userProfile.title,
      location: userProfile.location,
      bio: userProfile.bio,
      skills: [...userProfile.skills],
    });
    setNewSkillInput("");
    setShowEditProfileModal(true);
  };

  const handleAddSkill = () => {
    if (
      newSkillInput.trim() &&
      !editFormData.skills.includes(newSkillInput.trim())
    ) {
      setEditFormData({
        ...editFormData,
        skills: [...editFormData.skills, newSkillInput.trim()],
      });
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (indexToRemove: number) => {
    setEditFormData({
      ...editFormData,
      skills: editFormData.skills.filter((_, index) => index !== indexToRemove),
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = {
      ...userProfile,
      name: editFormData.name,
      title: editFormData.title,
      location: editFormData.location,
      bio: editFormData.bio,
      skills: editFormData.skills,
    };

    setUserProfile(updatedProfile);

    if (currentUser && !isMockMode) {
      await updateUserInFirestore({
        name: editFormData.name,
        title: editFormData.title,
        location: editFormData.location,
        bio: editFormData.bio,
        skills: editFormData.skills,
      });
    }

    setShowEditProfileModal(false);
    showAlert("Profil başarıyla güncellendi!");
  };

  const handleViewCertificate = (badge: BadgeType) => {
    setSelectedCertificate({
      title: badge.name,
      date: badge.date,
      recipient: userProfile.name,
      description: badge.desc,
    });
    setShowCertificateModal(true);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const getFilteredRequests = () => {
    let filtered = requests;

    // Category Filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    // SMART AI RECOMMENDATION LOGIC
    if (showAiRecommendations) {
      // Map requests to a new array with relevance score
      const scoredRequests = filtered.map((req) => {
        return {
          ...req,
          relevanceScore: calculateRelevanceScore(userProfile.skills, req),
        };
      });

      // Filter out low relevance items (< 10%)
      filtered = scoredRequests
        .filter((r) => r.relevanceScore > 10)
        .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by Score
    } else {
      // Default sorting: Newest first
      filtered = filtered.sort((a, b) => b.id - a.id);
    }

    // Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      let relatedTerms = [lowerQuery];
      Object.keys(SEMANTIC_MAP).forEach((key) => {
        if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
          relatedTerms = [...relatedTerms, ...SEMANTIC_MAP[key]];
        }
      });

      filtered = filtered.filter((r) => {
        const inText =
          r.title.toLowerCase().includes(lowerQuery) ||
          r.description.toLowerCase().includes(lowerQuery);
        const inTags =
          r.tags &&
          r.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));
        const inSemantic = relatedTerms.some(
          (term) =>
            r.title.toLowerCase().includes(term) ||
            r.description.toLowerCase().includes(term) ||
            (r.tags && r.tags.some((t) => t.toLowerCase().includes(term)))
        );
        return inText || inTags || inSemantic;
      });
    }
    return filtered;
  };

  const displayedRequests = getFilteredRequests();
  const cartTotal = cart.reduce(
    (acc, item) => acc + item.price * (item.qty || 1),
    0
  );
  const filteredLeaderboard = leaderboard.filter(
    (user) =>
      user.name.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(communitySearchQuery.toLowerCase())
  );
  const isAiSearchActiveInUI =
    searchQuery.length > 0 &&
    Object.keys(SEMANTIC_MAP).some(
      (key) =>
        key.includes(searchQuery.toLowerCase()) ||
        searchQuery.toLowerCase().includes(key)
    );

  const totalLessons = sessions.length;
  const uniqueMentors = new Set(sessions.map((s) => s.mentorId)).size;
  const moneySaved = totalLessons * 800;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        Yükleniyor...
      </div>
    );
  }

  // --- RENDER FUNCTIONS ---

  const renderMarket = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Gönüllü Market</h2>
          <p className="text-slate-400">
            Tokenlarını iyilik veya ödül için kullan.
          </p>
        </div>
        <div
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 border ${theme.pill}`}
        >
          <Coins className="text-yellow-400" size={20} />
          <span className="font-bold text-lg">{userTokens} Token</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {marketItems.map((item) => (
          <div
            key={item.id}
            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ${theme.shell}`}
          >
            <div className="h-48 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold ${theme.chip}`}
                >
                  {item.category}
                </span>
                <span className="font-bold text-yellow-400 flex items-center">
                  {item.price} <Coins size={14} className="ml-1" />
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1 leading-tight">
                {item.name}
              </h3>
              <p className="text-sm opacity-70 mb-4 line-clamp-2">
                {item.desc}
              </p>

              <button
                onClick={() => handleAddToCart(item)}
                disabled={item.stock === 0}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  item.stock > 0
                    ? theme.primaryBtn
                    : "bg-gray-600 cursor-not-allowed opacity-50"
                }`}
              >
                {item.stock > 0 ? "Sepete Ekle" : "Tükendi"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Öğrenme Talepleri</h2>
          <p className="text-slate-400">
            Birinin kahramanı olmaya hazır mısın?
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isAiSearchActiveInUI ? (
                <BrainCircuit className="h-5 w-5 text-emerald-400 animate-pulse" />
              ) : (
                <Search className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Talep ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${theme.input}`}
            />
          </div>
          <button
            onClick={() => setShowAiRecommendations(!showAiRecommendations)}
            className={`p-2.5 rounded-xl transition-all border flex items-center gap-2 ${
              showAiRecommendations
                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30"
                : theme.secondaryBtn
            }`}
          >
            <Sparkles
              size={20}
              className={showAiRecommendations ? "animate-pulse" : ""}
            />
            {showAiRecommendations && (
              <span className="text-xs font-bold hidden md:inline">
                AI Açık
              </span>
            )}
          </button>
        </div>
      </div>

      {/* AI Notification Banner */}
      {showAiRecommendations && (
        <div
          className={`p-4 rounded-2xl mb-8 flex items-start animate-in fade-in slide-in-from-top-2 shadow-sm border border-emerald-500/30 bg-emerald-500/10`}
        >
          <div className="bg-emerald-500/20 p-2 rounded-lg mr-3">
            <BrainCircuit className="text-emerald-400" size={24} />
          </div>
          <div>
            <div className="text-sm text-emerald-100 font-bold mb-1">
              Yapay Zeka Destekli Eşleşme Aktif
            </div>
            <div className="text-xs text-emerald-200/70">
              Senin yeteneklerine (
              <strong>
                {userProfile.skills.join(", ") || "Belirtilmemiş"}
              </strong>
              ) ve ilgi alanlarına göre en uygun ilanlar sıralandı. Srodne
              alanlar (Örn: React {"->"} Yazılım) otomatik olarak analiz edildi.
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon =
            cat.icon === "Code"
              ? Code
              : cat.icon === "BookOpen"
              ? BookOpen
              : cat.icon === "Dumbbell"
              ? Dumbbell
              : cat.icon === "Music"
              ? Music
              : cat.icon === "PenTool"
              ? PenTool
              : null;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id ? theme.primaryBtn : theme.chip
              }`}
            >
              {Icon && <Icon size={18} />}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedRequests.map((req: any) => {
          const isMyRequest = req.requester === userProfile.name;
          // Score is only present if AI mode is ON
          const score = req.relevanceScore || 0;

          return (
            <div
              key={req.id}
              className={`p-6 rounded-2xl relative group hover:border-l-4 hover:border-l-emerald-400 transition-all ${
                theme.card
              } ${
                showAiRecommendations && score > 50
                  ? "border-emerald-500/30 shadow-emerald-500/10"
                  : ""
              }`}
            >
              {/* AI Match Badge */}
              {showAiRecommendations && score > 0 && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Zap size={10} fill="currentColor" /> %{score} Eşleşme
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-xs font-bold`}
                  >
                    {req.requester.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{req.requester}</p>
                    <p className="text-xs opacity-60">{req.createdAt}</p>
                  </div>
                </div>
                {!showAiRecommendations && (
                  <span
                    className={`text-xs px-2 py-1 rounded-md ${
                      req.priority === "Yüksek"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {req.priority}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">{req.title}</h3>
              <p className="text-sm opacity-80 mb-4 line-clamp-2">
                {req.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {req.tags?.map((t: string) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 opacity-70"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <div className="flex justify-end">
                {isMyRequest ? (
                  <button
                    disabled
                    className={`px-5 py-2 rounded-xl text-sm font-semibold bg-gray-700/50 text-gray-400 border border-gray-600 cursor-not-allowed`}
                  >
                    Kendi Talebin
                  </button>
                ) : (
                  <button
                    onClick={() => handleBecomeMentorClick(req)}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${theme.secondaryBtn} hover:bg-emerald-500 hover:text-white border-emerald-500/30`}
                  >
                    Mentör Ol
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {displayedRequests.length === 0 && (
          <div
            className={`col-span-full text-center py-20 opacity-50 rounded-3xl border-2 border-dashed border-white/10`}
          >
            <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Search size={32} />
            </div>
            {searchQuery ? (
              <div>
                <p className="font-bold text-lg">Sonuç Bulunamadı</p>
                <p className="text-sm mt-1">
                  "{searchQuery}" için uygun ilan yok.
                </p>
              </div>
            ) : showAiRecommendations ? (
              "Yeteneklerine uygun açık ilan bulunamadı."
            ) : (
              "Bu kategoride ilan yok."
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold mb-6">Yaklaşan Dersler</h2>
      <div className="space-y-4">
        {sessions.map((session) => {
          const isJoined = userProfile.joinedSessions?.includes(session.id);
          const isMentor =
            String(session.mentorId) === String(currentUser?.uid);

          return (
            <div
              key={session.id}
              className={`p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 ${theme.shell}`}
            >
              <div className="flex-shrink-0 w-full md:w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white shadow-lg">
                <span className="text-2xl font-bold">
                  {session.date.split("-")[2]}
                </span>
                <span className="text-xs uppercase tracking-widest">Kasım</span>
                <span className="text-xs opacity-75 mt-1">{session.time}</span>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-1">{session.title}</h3>
                <div className="flex flex-col md:flex-row items-center gap-3 text-sm opacity-70 mb-2">
                  <span className="flex items-center gap-1">
                    <UserIcon size={14} /> {session.mentor}
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {session.participants} Katılımcı
                  </span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded text-emerald-300 bg-emerald-500/10 border border-emerald-500/20`}
                  >
                    {session.status}
                  </span>
                </div>
              </div>
              <div className="w-full md:w-auto">
                {isMentor ? (
                  <button
                    disabled
                    className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold transition-all bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 cursor-default flex items-center justify-center gap-2`}
                  >
                    <UserIcon size={18} /> Mentörsün
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinSession(session)}
                    disabled={isJoined}
                    className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold transition-all ${
                      isJoined
                        ? "bg-emerald-500 text-white cursor-default"
                        : theme.primaryBtn
                    }`}
                  >
                    {isJoined ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> Kayıtlısın
                      </span>
                    ) : (
                      "Derse Katıl"
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMySessions = () => {
    // Filter sessions the user has joined or is mentoring
    const mySessions = sessions.filter(
      (s) =>
        userProfile.joinedSessions?.includes(s.id) ||
        String(s.mentorId) === String(currentUser?.uid)
    );

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-3xl font-bold mb-2">Derslerim</h2>
        <p className="text-slate-400 mb-8">
          Kayıt olduğun ve mentörlük yaptığın dersler.
        </p>

        {mySessions.length === 0 ? (
          <div className="p-10 text-center rounded-3xl border-2 border-dashed border-white/10 opacity-60">
            <BookOpen size={48} className="mx-auto mb-4" />
            <p>Henüz bir derse kayıt olmadın.</p>
            <button
              onClick={() => setActiveTab("sessions")}
              className="mt-4 text-emerald-400 font-bold hover:underline"
            >
              Derslere Göz At
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {mySessions.map((session) => {
              const hasVoted = userProfile.votedSessions?.includes(session.id);
              const isMentor =
                String(session.mentorId) === String(currentUser?.uid);

              return (
                <div
                  key={session.id}
                  className={`p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 border-l-4 ${
                    isMentor
                      ? "border-l-indigo-500 bg-indigo-500/5"
                      : "border-l-emerald-500"
                  } ${theme.shell}`}
                >
                  <div
                    className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-bold border ${
                      isMentor
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    <Calendar size={24} />
                  </div>
                  <div className="flex-1 w-full md:w-auto text-center md:text-left">
                    <h3 className="text-xl font-bold">{session.title}</h3>
                    <p className="text-sm opacity-70">
                      Mentör: {session.mentor}
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mt-2 text-xs font-mono opacity-50 justify-center md:justify-start">
                      <span>{session.date}</span>
                      <span>{session.time}</span>
                      {session.link && (
                        <a
                          href={session.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline"
                        >
                          <Link size={12} /> Link
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="w-full md:w-auto flex justify-center md:justify-end">
                    {!isMentor && !hasVoted && (
                      <button
                        onClick={() => handleOpenFeedback(session)}
                        className="w-full md:w-auto px-6 py-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 font-bold text-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Star size={16} /> Puan Ver
                      </button>
                    )}
                    {hasVoted && (
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-sm flex items-center gap-2 cursor-default">
                        <CheckCircle size={16} /> Değerlendirildi
                      </div>
                    )}
                    {isMentor && (
                      <div className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold text-sm flex items-center gap-2 cursor-default">
                        <UserIcon size={16} /> Senin Dersin
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderCreate = () => (
    <div className="animate-in zoom-in-95 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className={`lg:col-span-2 p-8 rounded-3xl ${theme.shell}`}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-lg text-white">
              <PlusCircle size={24} />
            </div>
            Yeni İlan Oluştur
          </h2>
          <form onSubmit={handleCreateRequest} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 ml-1 opacity-80">
                Başlık
              </label>
              <input
                value={newReqTitle}
                onChange={(e) => setNewReqTitle(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${theme.input}`}
                placeholder="Örn: React Context API Öğrenmek İstiyorum"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 ml-1 opacity-80">
                  Kategori
                </label>
                <select
                  value={newReqCat}
                  onChange={(e) => setNewReqCat(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl outline-none appearance-none ${theme.input}`}
                >
                  {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                    <option key={c.id} value={c.id} className="text-black">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 ml-1 opacity-80">
                  Öncelik
                </label>
                <select
                  className={`w-full px-4 py-3 rounded-xl outline-none appearance-none ${theme.input}`}
                >
                  <option className="text-black">Düşük</option>
                  <option className="text-black">Normal</option>
                  <option className="text-black">Yüksek</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 ml-1 opacity-80">
                Açıklama
              </label>
              <textarea
                value={newReqDesc}
                onChange={(e) => setNewReqDesc(e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${theme.input}`}
                placeholder="Tam olarak neye ihtiyacın var? Seviyen nedir?"
              />
            </div>
            <button
              type="submit"
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-[1.02] transition-transform ${theme.primaryBtn}`}
            >
              İlanı Yayınla{" "}
              {selectedMentors.length > 0 && `& Mentörleri Davet Et`}
            </button>
          </form>
        </div>

        {/* Right Column: AI Suggestions */}
        <div
          className={`p-6 rounded-3xl h-fit lg:sticky lg:top-24 ${theme.shell} border border-indigo-500/30`}
        >
          <h3 className="font-bold mb-4 flex items-center text-lg">
            <Sparkles
              size={20}
              className="mr-2 text-indigo-400 animate-pulse"
            />{" "}
            AI Mentör Önerileri
          </h3>
          <p className="text-xs opacity-60 mb-6 font-medium bg-white/5 p-3 rounded-xl border border-white/10">
            Kategorine uygun mentörleri puanlarına göre sıraladık. Onları
            seçerek anında davet gönderebilirsin.
          </p>

          <div className="space-y-3">
            {recommendedMentors.length > 0 ? (
              recommendedMentors.map((mentor, idx) => {
                const isSelected = selectedMentors.includes(mentor.id);
                return (
                  <div
                    key={mentor.id}
                    onClick={() => toggleMentorSelection(mentor.id)}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 group hover:scale-[1.02] ${
                      isSelected
                        ? "bg-indigo-500/20 border-indigo-500"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mr-3 shadow-sm ${
                            isSelected
                              ? "bg-indigo-500 text-white"
                              : mentor.avatarColor
                                  .replace("text-", "bg-")
                                  .split(" ")[0] + " text-white"
                          }`}
                        >
                          {mentor.name.charAt(0)}
                        </div>
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-0 bg-yellow-400 text-black text-[8px] font-bold px-1 rounded-sm shadow-sm">
                            EN UYGUN
                          </div>
                        )}
                      </div>

                      <div>
                        <div
                          className={`font-bold text-sm ${
                            isSelected ? "text-indigo-300" : ""
                          }`}
                        >
                          {mentor.name}
                        </div>
                        <div className="text-[10px] opacity-50 flex items-center gap-1">
                          {mentor.points} Puan • {mentor.role}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-indigo-500 border-indigo-500"
                          : "border-white/20"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle size={14} className="text-white" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 opacity-50 text-sm">
                Bu kategoride henüz öne çıkan mentör yok.
              </div>
            )}
          </div>

          {selectedMentors.length > 0 && (
            <div className="mt-6 text-center text-xs font-bold text-indigo-100 bg-indigo-600/80 py-3 rounded-xl shadow-lg shadow-indigo-900/50 animate-in zoom-in">
              {selectedMentors.length} Mentöre Bildirim Gönderilecek 🚀
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className={`relative p-8 rounded-[2rem] mb-8 overflow-hidden ${theme.shell}`}
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-violet-600/20 to-indigo-600/20"></div>
        <div className="relative flex flex-col md:flex-row items-end md:items-center gap-6 mt-12">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-3xl shadow-2xl">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              "👨‍💻"
            )}
          </div>
          <div className="flex-1 w-full text-center md:text-left">
            <h2 className="text-3xl font-bold">{userProfile.name}</h2>
            <p className="opacity-70">{userProfile.title}</p>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-3 text-sm opacity-60 items-center md:items-start justify-center md:justify-start">
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {userProfile.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {userProfile.joinedAt}
              </span>
            </div>
            {userProfile.bio && (
              <p className="mt-4 text-sm opacity-80 max-w-2xl italic mx-auto md:mx-0">
                "{userProfile.bio}"
              </p>
            )}
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={handleEditProfileClick}
              className={`px-6 py-2 rounded-xl font-semibold border ${theme.secondaryBtn}`}
            >
              Profili Düzenle
            </button>
            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded-xl font-semibold border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20`}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {Object.entries(userProfile.stats).map(([key, val]) => (
            <div
              key={key}
              className={`p-4 rounded-2xl text-center ${theme.card}`}
            >
              <div className="text-2xl font-bold mb-1">{val}</div>
              <div className="text-xs opacity-60 uppercase tracking-wider">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Award size={20} /> Rozetlerim
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userProfile.badges.length > 0 ? (
              userProfile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl flex items-center gap-4 ${theme.card}`}
                >
                  <div className="text-3xl">{badge.icon}</div>
                  <div>
                    <div className="font-bold">{badge.name}</div>
                    <div className="text-xs opacity-60">{badge.desc}</div>
                  </div>
                  <button
                    onClick={() => handleViewCertificate(badge)}
                    className={`ml-auto p-2 rounded-lg hover:bg-white/10 transition-colors ${theme.pill}`}
                    title="Sertifikayı Görüntüle"
                  >
                    <FileBadge size={18} className="text-emerald-400" />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 opacity-50 border-2 border-dashed border-white/10 rounded-xl">
                Henüz bir rozet kazanmadın. Ders vererek veya katılarak
                kazanabilirsin!
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold flex items-center gap-2 mt-8">
            <Clock size={20} /> Geçmiş Hareketler
          </h3>
          <div className={`rounded-xl overflow-hidden ${theme.card}`}>
            {userProfile.history.length > 0 ? (
              userProfile.history.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-4 flex justify-between items-center ${
                    idx !== userProfile.history.length - 1
                      ? "border-b border-white/5"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.type === "earned" ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    ></div>
                    <span>{item.text}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs opacity-50">{item.date}</span>
                    <span
                      className={`font-bold ${
                        item.type === "earned"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.amount}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center opacity-50">
                Henüz bir hareket yok.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BrainCircuit size={20} /> Yetenekler
          </h3>
          <div className="flex flex-wrap gap-2">
            {userProfile.skills.length > 0 ? (
              userProfile.skills.map((skill) => (
                <span
                  key={skill}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${theme.chip}`}
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-sm opacity-50">
                Henüz yetenek eklenmemiş.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="lg:col-span-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600">
              <Trophy size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Topluluk & Liderler
            </h2>
          </div>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Üye ara..."
              value={communitySearchQuery}
              onChange={(e) => setCommunitySearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none shadow-sm transition-all ${theme.input}`}
            />
            <Search className="absolute left-3 top-3.5 opacity-50" size={18} />
          </div>
        </div>
        <div
          className={`rounded-[1.5rem] shadow-sm overflow-hidden ${theme.shell}`}
        >
          {filteredLeaderboard.length > 0 ? (
            filteredLeaderboard.map((user, index) => (
              <div
                key={user.id}
                className={`p-5 flex flex-col sm:flex-row items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 transition group gap-4 sm:gap-0`}
              >
                <div className="flex items-center space-x-5 w-full sm:w-auto">
                  <div
                    className={`w-8 h-8 flex items-center justify-center font-bold rounded-lg text-sm flex-shrink-0 ${
                      index === 0
                        ? "bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-200"
                        : index === 1
                        ? "bg-slate-300 text-slate-800"
                        : index === 2
                        ? "bg-orange-300 text-orange-900"
                        : "bg-slate-100/20 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-md flex-shrink-0 ${
                      user.avatarColor.replace("text-", "bg-").split(" ")[0]
                    }`}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold">{user.name}</h4>
                    <p className="text-xs opacity-60 font-medium mt-0.5">
                      {user.points} Puan •{" "}
                      <span className="text-indigo-400">{user.role}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDonate(user.id, user.name)}
                  className={`w-full sm:w-auto text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center justify-center ${theme.secondaryBtn}`}
                >
                  <Send size={14} className="mr-1.5" /> Bağışla
                </button>
              </div>
            ))
          ) : (
            <div className="p-12 text-center opacity-50">
              Aramanızla eşleşen üye bulunamadı.
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-900/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Coins className="text-amber-300" size={24} />
            </div>
            <h3 className="font-bold text-xl">Cüzdanım</h3>
          </div>
          <div className="text-4xl font-black mb-2 relative z-10">
            {userTokens}{" "}
            <span className="text-2xl opacity-80 font-bold">Token</span>
          </div>
          <p className="text-indigo-200 text-sm font-medium relative z-10">
            Tokenlerini harca, kendine ödül ver!
          </p>
        </div>

        <div className={`rounded-[2rem] shadow-sm p-6 ${theme.shell}`}>
          <h3 className="font-bold text-lg mb-4 flex items-center">
            <Heart className="text-rose-500 mr-2" size={20} /> Son Teşekkürler
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {kudosList.length > 0 ? (
              kudosList.map((kudo) => (
                <div
                  key={kudo.id}
                  className={`p-4 rounded-2xl border text-sm relative ${theme.card}`}
                >
                  <div className="absolute -left-1 top-4 w-2 h-2 bg-rose-400 rounded-full"></div>
                  <span className="font-bold block mb-1">
                    {kudo.from} <span className="opacity-50 mx-1">→</span>{" "}
                    {kudo.to}
                  </span>
                  <div className="text-[10px] opacity-40 mb-1">{kudo.time}</div>
                  <p className="opacity-70 italic leading-relaxed">
                    "{kudo.message}"
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center opacity-50 text-xs">
                Henüz teşekkür mesajı yok.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen font-sans relative overflow-hidden transition-colors duration-700 ${theme.appBg}`}
    >
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 fixed">
        <div className="absolute -top-40 -left-32 w-80 h-80 bg-violet-500/30 rounded-full blur-3xl mix-blend-screen animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl mix-blend-screen" />
        <div className="absolute bottom-[-120px] left-1/4 w-[420px] h-[420px] bg-sky-500/25 rounded-full blur-3xl mix-blend-screen" />
      </div>

      <div className="relative z-10">
        {/* Mock Mode Banner */}
        {isMockMode && (
          <div className="fixed top-0 left-0 right-0 bg-amber-500/90 text-black text-xs font-bold text-center py-1 z-[100] backdrop-blur-sm flex items-center justify-center gap-2">
            <ShieldAlert size={14} />
            DEMO MODU: Firebase bağlantısı olmadığı için geçici veri
            kullanılmaktadır. Veriler kaydedilmeyecektir.
          </div>
        )}

        <nav
          className={`fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl transition-all duration-300 shadow-md ${
            activeTheme === "glass" ? "bg-slate-900/80" : ""
          } ${isMockMode ? "mt-6" : ""}`}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-20">
              <div
                className={`flex items-center space-x-3 cursor-pointer group px-3 py-1.5 rounded-2xl ${theme.shell}`}
                onClick={() => setActiveTab("home")}
              >
                <div className="bg-gradient-to-tr from-indigo-500 via-violet-400 to-sky-300 p-2.5 rounded-xl shadow-lg shadow-indigo-500/40 group-hover:shadow-indigo-400/70 transition-all duration-300 group-hover:scale-105">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-50 to-slate-300 hidden md:block">
                    Gönüllü Akademi
                  </span>
                  <span className="text-xl font-bold tracking-tight text-slate-50 md:hidden">
                    GA
                  </span>
                </div>
              </div>

              {/* TABS - Only Visible if Logged In & Desktop */}
              {currentUser && (
                <div
                  className={`hidden lg:flex p-1.5 rounded-2xl border ${theme.shell} bg-black/10 overflow-hidden`}
                >
                  {[
                    {
                      id: "requests",
                      label: "Talepler",
                      icon: <Search size={18} />,
                    },
                    {
                      id: "sessions",
                      label: "Dersler",
                      icon: <Calendar size={18} />,
                    },
                    {
                      id: "mysessions",
                      label: "Derslerim",
                      icon: <BookOpen size={18} />,
                    },
                    {
                      id: "market",
                      label: "Market",
                      icon: <ShoppingBag size={18} />,
                    },
                    {
                      id: "community",
                      label: "Topluluk",
                      icon: <Trophy size={18} />,
                    },
                    {
                      id: "create",
                      label: "İlan",
                      icon: <PlusCircle size={18} />,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold text-sm ${
                        activeTab === tab.id
                          ? "bg-white/90 text-slate-900 shadow-sm"
                          : "text-slate-200/80 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-3 ml-2">
                {currentUser ? (
                  <>
                    {/* Daily Reward */}
                    <div
                      onClick={() => handleClaimDailyReward()}
                      className={`hidden md:flex items-center space-x-1 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border ${
                        dailyRewardClaimed
                          ? "border-emerald-500/50 text-emerald-400"
                          : "border-yellow-500/50 text-yellow-400"
                      }`}
                    >
                      {dailyRewardClaimed ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Gift size={16} className="animate-bounce" />
                      )}
                      <span className="text-sm font-bold">{userTokens}</span>
                    </div>

                    {/* Notifications */}
                    <div
                      className="relative hidden md:block"
                      ref={notificationRef}
                    >
                      <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`relative p-2.5 rounded-xl hover:bg-slate-700 transition-colors bg-slate-800 border border-white/10 text-white ${
                          showNotifications ? "bg-slate-700" : ""
                        }`}
                      >
                        <Bell size={20} />
                        {userProfile.history.length > 0 && (
                          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                        )}
                      </button>

                      {/* Notification Dropdown */}
                      {showNotifications && (
                        <div
                          className={`absolute top-14 right-0 w-80 rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden ${theme.shell} bg-slate-900/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2`}
                        >
                          <div className="p-4 border-b border-white/5 font-bold flex justify-between items-center">
                            <span>Bildirimler</span>
                            <span className="text-xs opacity-50 bg-white/5 px-2 py-1 rounded">
                              Geçmiş
                            </span>
                          </div>
                          <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {userProfile.history.length === 0 ? (
                              <div className="p-8 text-center opacity-50 text-sm">
                                Henüz bir hareket yok.
                              </div>
                            ) : (
                              userProfile.history.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors flex items-start gap-3"
                                >
                                  <div
                                    className={`mt-1 w-2 h-2 flex-shrink-0 rounded-full ${
                                      item.type === "earned"
                                        ? "bg-emerald-400"
                                        : "bg-red-400"
                                    }`}
                                  ></div>
                                  <div>
                                    <p className="text-sm font-medium leading-snug">
                                      {item.text}
                                    </p>
                                    <p className="text-[10px] opacity-50 mt-1">
                                      {item.date}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cart */}
                    <button
                      onClick={() => setShowCartModal(true)}
                      className={`relative p-2.5 rounded-xl hover:bg-white/10 transition-colors ${theme.pill}`}
                    >
                      <ShoppingCart size={20} />
                      {cart.length > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                          {cart.length}
                        </span>
                      )}
                    </button>

                    {/* Profile */}
                    <div
                      onClick={() => setActiveTab("profile")}
                      className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5 cursor-pointer hover:scale-105 transition-transform"
                    >
                      <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-sm font-bold overflow-hidden">
                        {currentUser?.photoURL ? (
                          <img
                            src={currentUser.photoURL}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          userProfile.name.charAt(0) || "U"
                        )}
                      </div>
                    </div>

                    {/* MOBILE MENU TOGGLE BUTTON */}
                    <button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ml-1"
                    >
                      {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-900 hover:bg-slate-100 transition-all flex items-center shadow-lg hover:-translate-y-0.5`}
                  >
                    <LogIn size={18} className="mr-2" /> Giriş Yap
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE MENU DROPDOWN */}
          {currentUser && showMobileMenu && (
            <div className="lg:hidden absolute top-20 left-0 w-full bg-slate-900/95 backdrop-blur-xl border-b border-white/10 z-40 p-4 animate-in slide-in-from-top-5 shadow-2xl">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: "requests",
                    label: "Talepler",
                    icon: <Search size={18} />,
                  },
                  {
                    id: "sessions",
                    label: "Dersler",
                    icon: <Calendar size={18} />,
                  },
                  {
                    id: "mysessions",
                    label: "Derslerim",
                    icon: <BookOpen size={18} />,
                  },
                  {
                    id: "market",
                    label: "Market",
                    icon: <ShoppingBag size={18} />,
                  },
                  {
                    id: "community",
                    label: "Topluluk",
                    icon: <Trophy size={18} />,
                  },
                  {
                    id: "create",
                    label: "İlan Aç",
                    icon: <PlusCircle size={18} />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowMobileMenu(false);
                    }}
                    className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-xl transition-all duration-300 font-semibold text-sm border ${
                      activeTab === tab.id
                        ? "bg-white text-slate-900 border-white"
                        : "bg-white/5 text-slate-200 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-white/10">
                    {userProfile.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{userProfile.name}</p>
                    <p className="text-xs opacity-50">{userTokens} Token</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleClaimDailyReward();
                    setShowMobileMenu(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    dailyRewardClaimed
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                      : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                  }`}
                >
                  <Gift size={14} /> {dailyRewardClaimed ? "Alındı" : "Ödül Al"}
                </button>
              </div>
            </div>
          )}
        </nav>

        <main
          className={`max-w-7xl mx-auto px-4 py-8 pb-32 min-h-[calc(100vh-80px)] ${
            isMockMode ? "mt-32" : "mt-24"
          }`}
        >
          {activeTab === "home" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div
                className={`relative rounded-[2.5rem] p-8 md:p-20 mb-16 overflow-hidden ${theme.shell}`}
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.06] mix-blend-soft-light" />
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-400/40 rounded-full mix-blend-screen blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-400/40 rounded-full mix-blend-screen blur-3xl" />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                  <div
                    className={`inline-flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-bold mb-8 shadow-inner ${theme.pill}`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    <span>Türkiye'nin En Büyük Gönüllü Eğitim Topluluğu</span>
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-8 tracking-tight leading-tight drop-shadow-sm">
                    Bilgi Paylaştıkça <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
                      Çoğalır.
                    </span>
                  </h1>

                  <p className="text-lg md:text-2xl mb-12 max-w-2xl mx-auto font-light leading-relaxed text-slate-100/90">
                    Para değil,{" "}
                    <strong className="font-semibold text-white">
                      zamanın
                    </strong>{" "}
                    geçtiği tek akademi. Bildiklerini öğret, bilmediklerini
                    öğren. Tamamen ücretsiz, tamamen gönüllü.
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-5">
                    <button
                      onClick={() =>
                        handleRestrictedAction(() => setActiveTab("requests"))
                      }
                      className={`group px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center ${theme.primaryBtn}`}
                    >
                      Hemen Başla
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() =>
                        handleRestrictedAction(() => setActiveTab("create"))
                      }
                      className={`group px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center ${theme.secondaryBtn}`}
                    >
                      <PlusCircle className="mr-2 group-hover:rotate-90 transition-transform" />
                      İlan Aç
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                {[
                  {
                    val: totalLessons > 0 ? totalLessons : "0",
                    label: "Gönüllü Ders",
                    icon: <BookOpen className="text-emerald-400" />,
                  },
                  {
                    val: uniqueMentors > 0 ? uniqueMentors : "0",
                    label: "Aktif Mentör",
                    icon: <UserIcon className="text-violet-400" />,
                  },
                  {
                    val: `₺${moneySaved.toLocaleString("tr-TR")}`,
                    label: "Tasarruf Edilen Tutar",
                    icon: <Coins className="text-yellow-400" />,
                  },
                  {
                    val: "98%",
                    label: "Memnuniyet",
                    icon: <Heart className="text-red-400" />,
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-2 ${theme.shell}`}
                  >
                    {stat.icon}
                    <span className="text-2xl font-bold">{stat.val}</span>
                    <span className="text-xs opacity-60 uppercase tracking-wider text-center">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className={`mt-16 rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl ${theme.shell}`}
              >
                <div className="absolute top-0 right-0 p-12 opacity-[0.05] transform translate-x-10 -translate-y-10 pointer-events-none">
                  <Trophy size={300} />
                </div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <div className="relative z-10 max-w-3xl mx-auto">
                  <div
                    className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-6 uppercase tracking-widest shadow-inner ${theme.chip} text-indigo-300 border-indigo-500/30`}
                  >
                    Kurumsal Destek
                  </div>

                  <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
                    Geleceğe{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                      Sponsor Olun
                    </span>
                  </h2>

                  <p className="opacity-70 mb-10 text-lg md:text-xl leading-relaxed font-light">
                    Gönüllü Akademi'nin büyümesine destek olarak binlerce
                    öğrencinin eğitim hayatına dokunabilirsiniz. Teknoloji
                    sponsoru, eğitim materyali desteği veya burs imkanları için
                    bizimle iletişime geçin.
                  </p>
                </div>

                <div className="mt-12 pt-12 border-t border-white/10 relative z-10">
                  <h3 className="text-2xl font-bold mb-6">
                    Bizimle İletişime Geçin
                  </h3>
                  <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors w-full md:w-auto justify-center">
                      <Mail className="text-emerald-400" />
                      <span className="font-mono text-sm md:text-base">
                        iletisim@gonulluakademi.com
                      </span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors w-full md:w-auto justify-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-full text-sm font-bold border border-indigo-500/30">
                        <Phone size={16} />
                      </div>
                      <span className="font-mono text-sm md:text-base">
                        +90 (212) 555 01 23
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentUser && activeTab === "requests" && renderRequests()}
          {currentUser && activeTab === "market" && renderMarket()}
          {currentUser && activeTab === "sessions" && renderSessions()}
          {currentUser && activeTab === "mysessions" && renderMySessions()}
          {currentUser && activeTab === "create" && renderCreate()}
          {currentUser && activeTab === "profile" && renderProfile()}
          {currentUser && activeTab === "community" && renderCommunity()}
        </main>
      </div>

      {/* --- MODALS & ALERTS --- */}

      {/* CUSTOM ALERT MODAL */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 ${theme.shell} border border-white/20 transform scale-100 animate-in zoom-in-95 duration-200`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 rounded-full bg-indigo-500/20 text-indigo-300">
                <Info size={32} />
              </div>
              <p className="text-lg font-medium mb-6">{alertState.message}</p>
              <button
                onClick={closeAlert}
                className={`px-8 py-2.5 rounded-xl font-bold shadow-lg ${theme.primaryBtn} w-full`}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className={`p-8 md:p-10 rounded-[2rem] shadow-2xl max-w-md w-full relative z-10 ${theme.shell} border border-white/10 mx-4`}
          >
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-400 to-sky-300 p-0.5 shadow-lg shadow-indigo-500/40 mx-auto mb-4">
                <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                  <Users size={32} />
                </div>
              </div>
              <h1 className="text-2xl font-black tracking-tight mb-1">
                Gönüllü Akademi
              </h1>
              <p className="text-slate-400 text-sm">
                Devam etmek için giriş yap.
              </p>
            </div>

            {authError && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-sm text-red-400">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors"
                  size={20}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta Adresi"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all ${theme.input}`}
                  required
                />
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors"
                  size={20}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all ${theme.input}`}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${theme.primaryBtn}`}
              >
                {isRegistering ? "Kayıt Ol" : "Giriş Yap"}
              </button>
            </form>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-xs text-slate-500 font-medium">veya</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-md hover:-translate-y-0.5"
            >
              <div className="w-5 h-5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </svg>
              </div>
              Google ile Devam Et
            </button>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                {isRegistering ? "Zaten hesabın var mı?" : "Hesabın yok mu?"}
                <button
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setAuthError("");
                  }}
                  className="ml-2 text-emerald-400 font-bold hover:underline focus:outline-none"
                >
                  {isRegistering ? "Giriş Yap" : "Kayıt Ol"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Approval Modal */}
      {showMentorModal && selectedRequestToMentor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className={`w-full max-w-md rounded-3xl p-8 relative ${theme.shell} bg-slate-900 border border-white/10`}
          >
            <button
              onClick={() => setShowMentorModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4 border border-emerald-500/30">
                <Calendar size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-1">Dersi Planla</h3>
              <p className="text-sm opacity-70">
                <strong className="text-white">
                  "{selectedRequestToMentor.title}"
                </strong>{" "}
                için detayları gir.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-2 ml-1">
                  Ders Tarihi
                </label>
                <div className="relative">
                  <CalendarDays
                    className="absolute left-4 top-3.5 text-slate-500"
                    size={20}
                  />
                  <input
                    type="date"
                    required
                    value={mentorForm.date}
                    onChange={(e) =>
                      setMentorForm({ ...mentorForm, date: e.target.value })
                    }
                    className={`w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all ${theme.input} text-white scheme-dark`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-2 ml-1">
                  Ders Saati
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-4 top-3.5 text-slate-500"
                    size={20}
                  />
                  <input
                    type="time"
                    required
                    value={mentorForm.time}
                    onChange={(e) =>
                      setMentorForm({ ...mentorForm, time: e.target.value })
                    }
                    className={`w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all ${theme.input} text-white scheme-dark`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-2 ml-1">
                  Toplantı Linki (Zoom/Meet)
                </label>
                <div className="relative">
                  <Link
                    className="absolute left-4 top-3.5 text-slate-500"
                    size={20}
                  />
                  <input
                    type="url"
                    required
                    placeholder="https://meet.google.com/..."
                    value={mentorForm.link}
                    onChange={(e) =>
                      setMentorForm({ ...mentorForm, link: e.target.value })
                    }
                    className={`w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all ${theme.input}`}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowMentorModal(false)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${theme.secondaryBtn}`}
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmMentor}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 ${theme.primaryBtn}`}
                >
                  Dersi Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className={`w-full max-w-md rounded-3xl p-6 relative ${theme.shell} bg-slate-900 border border-white/10`}
          >
            <button
              onClick={() => setShowCartModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <ShoppingCart /> Sepetim
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <ShoppingBag size={48} className="mx-auto mb-4" />
                <p>Sepetin boş.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-white/5 p-3 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        className="w-12 h-12 rounded-lg object-cover"
                        alt=""
                      />
                      <div>
                        <div className="font-bold text-sm">{item.name}</div>
                        <div className="text-xs text-yellow-400">
                          {item.price} Token
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">x{item.qty}</span>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-red-400 hover:bg-red-400/20 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center mb-6 text-lg font-bold">
                <span>Toplam</span>
                <span className="text-yellow-400">{cartTotal} Token</span>
              </div>

              {orderSuccess ? (
                <div className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 animate-in zoom-in">
                  <CheckCircle /> Sipariş Alındı!
                </div>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    cart.length > 0
                      ? theme.primaryBtn
                      : "bg-gray-600 opacity-50 cursor-not-allowed"
                  }`}
                >
                  Ödemeyi Tamamla
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className={`w-full max-w-lg max-h-[85vh] rounded-[2rem] shadow-2xl p-0 animate-in zoom-in duration-200 ${theme.shell} bg-slate-900 border border-white/10 flex flex-col relative`}
          >
            <button
              onClick={() => setShowEditProfileModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white mx-auto mb-4 border border-white/10">
                  <Edit3 size={32} />
                </div>
                <h3 className="text-2xl font-bold">Profili Düzenle</h3>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-2 ml-1">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className={`w-full rounded-xl p-3 outline-none transition-colors font-medium ${theme.input}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-2 ml-1">
                    Unvan
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        title: e.target.value,
                      })
                    }
                    className={`w-full rounded-xl p-3 outline-none transition-colors font-medium ${theme.input}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-2 ml-1">
                    Konum
                  </label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        location: e.target.value,
                      })
                    }
                    className={`w-full rounded-xl p-3 outline-none transition-colors font-medium ${theme.input}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-2 ml-1">
                    Biyografi
                  </label>
                  <textarea
                    rows={3}
                    value={editFormData.bio}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, bio: e.target.value })
                    }
                    className={`w-full rounded-xl p-3 outline-none transition-colors font-medium resize-none ${theme.input}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-2 ml-1">
                    Yetenekler
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editFormData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center border border-indigo-500/30"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="ml-2 hover:text-white transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddSkill())
                      }
                      className={`flex-grow rounded-xl p-3 outline-none transition-colors font-medium ${theme.input}`}
                      placeholder="Yeni yetenek ekle..."
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-white/10 text-white p-3 rounded-xl hover:bg-white/20 transition-colors border border-white/10"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4 pb-2">
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className={`flex-1 py-3.5 rounded-xl font-bold transition-colors ${theme.secondaryBtn}`}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3.5 rounded-xl font-bold transition-all hover:-translate-y-0.5 flex items-center justify-center ${theme.primaryBtn}`}
                  >
                    <Save size={18} className="mr-2" /> Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Donate Modal */}
      {showDonateModal && donateUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className={`w-full max-w-sm rounded-3xl p-8 relative ${theme.shell} bg-slate-900 border border-white/10`}
          >
            <button
              onClick={() => setShowDonateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mx-auto mb-4 border border-indigo-500/30">
                <Gift size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-1">Bağış Yap</h3>
              <p className="text-sm opacity-70">
                <strong className="text-white">{donateUser.name}</strong>{" "}
                kullanıcısına destek ol.
              </p>
            </div>

            <form onSubmit={handleDonateSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-2 text-center">
                  Gönderilecek Miktar (Token)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className={`w-full rounded-2xl p-4 text-center text-2xl font-bold outline-none transition-colors ${theme.input}`}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold opacity-50">
                    T
                  </span>
                </div>
              </div>
              <div
                className={`text-xs text-center font-bold py-2 rounded-lg ${theme.chip}`}
              >
                Mevcut Bakiye: {userTokens} T
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDonateModal(false)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${theme.secondaryBtn}`}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 ${theme.primaryBtn}`}
                >
                  Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && feedbackSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            className={`w-full max-w-sm rounded-3xl p-8 relative ${theme.shell} bg-slate-900 border border-white/10`}
          >
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 mx-auto mb-4 border border-yellow-500/30">
                <Star size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-1">Değerlendir</h3>
              <p className="text-sm opacity-70">
                <strong className="text-white">{feedbackSession.mentor}</strong>{" "}
                adlı mentöre puan ver.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={`transition-all hover:scale-110 ${
                      feedbackRating >= star
                        ? "text-yellow-400"
                        : "text-slate-600"
                    }`}
                  >
                    <Star
                      size={32}
                      fill={feedbackRating >= star ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold opacity-60 uppercase tracking-wider mb-2 ml-1">
                  Teşekkür Mesajı (İsteğe bağlı)
                </label>
                <textarea
                  rows={3}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className={`w-full rounded-xl p-3 outline-none transition-colors font-medium resize-none ${theme.input}`}
                  placeholder="Ders harikaydı, teşekkürler!"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${theme.secondaryBtn}`}
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 ${theme.primaryBtn}`}
                >
                  Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && selectedCertificate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-auto">
          <div className="relative bg-white w-full max-w-[800px] h-[600px] shadow-2xl rounded-sm overflow-hidden animate-in zoom-in duration-500 border-[16px] border-double border-slate-200">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-20 bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition"
            >
              <X size={24} />
            </button>
            <div className="w-full h-full p-8 md:p-16 flex flex-col items-center justify-center text-center relative bg-[#fffdf5]">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(#b45309 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              ></div>
              <div className="mb-4 md:mb-8">
                <Trophy size={60} className="text-yellow-600 drop-shadow-md" />
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-black text-slate-900 mb-4 tracking-widest uppercase">
                Sertifika
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-serif italic mb-6 md:mb-10">
                Bu belge, üstün başarı ve özveri gösteren
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-indigo-900 mb-6 md:mb-8 border-b-4 border-indigo-100 pb-4 px-6 md:px-12 inline-block font-serif tracking-tight">
                {selectedCertificate.recipient}
              </h2>
              <p className="text-lg md:text-2xl text-slate-700 max-w-3xl leading-relaxed mb-8 md:mb-12 font-light">
                Gönüllü Akademi platformunda gösterdiği katkılar ve başarı ile
                <br />
                <span className="font-bold text-yellow-600">
                  "{selectedCertificate.title}"
                </span>
                <br />
                rozetini kazanmaya hak kazanmıştır.
              </p>
              <div className="flex justify-between w-full max-w-3xl mt-auto pt-6 md:pt-10 border-t-2 border-slate-100">
                <div className="text-center">
                  <p className="font-bold text-slate-900 text-base md:text-lg">
                    Tarih
                  </p>
                  <p className="text-slate-500 font-medium text-sm md:text-base">
                    {selectedCertificate.date}
                  </p>
                </div>
                <div className="text-center">
                  <p
                    className="font-handwriting text-2xl md:text-3xl text-indigo-800 mb-2 transform -rotate-3 opacity-80"
                    style={{ fontFamily: "cursive" }}
                  >
                    Gönüllü Akademi
                  </p>
                  <p className="font-bold text-slate-900 border-t-2 border-slate-300 px-4 md:px-8 pt-2 text-base md:text-lg">
                    Yönetim Kurulu
                  </p>
                </div>
              </div>
              <div className="absolute bottom-10 left-10 opacity-90 hidden md:block">
                <div className="w-32 h-32 border-4 border-yellow-600 rounded-full flex items-center justify-center text-yellow-700 font-black transform rotate-[-15deg] shadow-xl bg-yellow-50/80 backdrop-blur-sm text-lg tracking-widest border-double">
                  ONAYLI
                </div>
              </div>
            </div>
            <div className="absolute bottom-6 right-6 flex space-x-4 print:hidden">
              <button
                onClick={handlePrintCertificate}
                className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold shadow-2xl hover:bg-slate-800 transition flex items-center hover:-translate-y-1"
              >
                <Printer size={20} className="mr-3" /> Yazdır / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
