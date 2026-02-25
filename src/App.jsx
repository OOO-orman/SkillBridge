import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { auth, db } from './firebaseConfig';
import { signOut } from 'firebase/auth';
import { 
  doc, updateDoc, collection, onSnapshot, addDoc, query, 
  orderBy, where, serverTimestamp, limit, increment, getDoc, deleteDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { 
  LayoutGrid, Trophy, User, Rocket, Bell, Briefcase, X, Send, 
  MessageCircle, Crown, Plus, Gavel, Users, ShieldAlert, Scale, 
  ChevronRight, RotateCcw, ShieldCheck, Lock, CheckCircle2, Trash2, Undo2, AlertOctagon, Handshake,
  Code, Palette, Megaphone, PenTool, Star, Award, Zap, Github, Edit3, Save, ExternalLink, Camera, 
  BriefcaseBusiness, Circle, Link as LinkIcon, FolderKanban, TrendingUp, Search, Loader2, LogOut
} from 'lucide-react';
import AuthPage from './AuthPage';

const App = () => {
  const { user, userData } = useAuth();
  
  // -- СОСТОЯНИЯ --
  const [tab, setTab] = useState('home');
  const [activeCat, setActiveCat] = useState('Все');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [applications, setApplications] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [topUsers, setTopUsers] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({ bio: '', github: '', avatarSeed: '', photoURL: '', isAvailable: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [newPortfolioItem, setNewPortfolioItem] = useState({ title: '', link: '' });
  const [reviewModal, setReviewModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [disputes, setDisputes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'Все', icon: <LayoutGrid size={16}/> },
    { id: 'Код', icon: <Code size={16}/> },
    { id: 'Дизайн', icon: <Palette size={16}/> },
    { id: 'Маркетинг', icon: <Megaphone size={16}/> },
    { id: 'Тексты', icon: <PenTool size={16}/> }
  ];

  const isOwner = user?.email === 'armanomurzak6@gmail.com';
  const isAdmin = userData?.role === 'admin' || isOwner;

  // --- УНИВЕРСАЛЬНЫЙ ID ЧАТА ---
  const getChatId = (u1, u2, jId) => [u1, u2, jId].sort().join('_');

  // -- СЛУШАТЕЛИ FIREBASE --
  useEffect(() => {
    if (!user || !userData) return;
    setEditData({
      bio: userData.bio || '',
      github: userData.github || '',
      avatarSeed: userData.avatarSeed || userData.name,
      photoURL: userData.photoURL || '',
      isAvailable: userData.isAvailable ?? true
    });

    const unsubJobs = onSnapshot(query(collection(db, "jobs"), orderBy("createdAt", "desc")), (snap) => {
      setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const appsQuery = userData.role === 'company' 
      ? query(collection(db, "applications"), where("companyId", "==", user.uid))
      : query(collection(db, "applications"), where("userId", "==", user.uid));

    const unsubApps = onSnapshot(appsQuery, (snap) => {
      const appsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(appsData.filter(app => !['completed', 'resolved', 'завершено'].includes(app.status?.toLowerCase())));
      setMyApplications(appsData.map(app => app.jobId));
    });

    const unsubNotifs = onSnapshot(query(collection(db, "notifications"), where("toId", "==", user.uid), orderBy("createdAt", "desc"), limit(20)), (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubTop = onSnapshot(query(collection(db, "users"), where("role", "==", "student"), orderBy("experience", "desc"), limit(100)), (snap) => {
      const rawUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopUsers(rawUsers.sort((a,b) => (b.experience||0) - (a.experience||0)));
    });

    const unsubReviews = onSnapshot(query(collection(db, "reviews"), where("toId", "==", user.uid), orderBy("createdAt", "desc"), limit(10)), (snap) => {
      setUserReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    let unsubDisputes;
    if (isAdmin) {
      unsubDisputes = onSnapshot(query(collection(db, "applications"), where("status", "in", ["На проверке", "Спор", "dispute"])), (snap) => {
        setDisputes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      unsubJobs(); unsubApps(); unsubNotifs(); unsubTop(); unsubReviews();
      if(isAdmin) unsubDisputes?.();
    };
  }, [user, userData, isAdmin]);

  // --- ЖИВОЙ ЧАТ ---
  useEffect(() => {
    if (!chatUser?.chatId) { setMessages([]); return; }
    const q = query(collection(db, "chats", chatUser.chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [chatUser?.chatId]);

  // -- ФУНКЦИИ ЛОГИКИ --
  const handleApply = async (job) => {
    // Добавляем проверку на роль: только студент может откликаться
    if (isSubmitting || myApplications.includes(job.id) || userData?.role !== 'student') {
      if (userData?.role !== 'student') alert("Только студенты могут принимать заказы!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "applications"), {
        jobId: job.id, jobTitle: job.title, userId: user.uid, userName: userData.name,
        companyId: job.companyId, companyName: job.company, budget: job.budget,
        status: 'Ожидание', createdAt: serverTimestamp(),
      });
      setSelectedJob(null);
    } catch (e) { console.error(e); }
    setIsSubmitting(false);
  };

  const createJob = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const budget = Number(formData.get('budget'));
    if (isSubmitting || (userData.balance || 0) < budget) return alert("Недостаточно средств!");
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { balance: increment(-budget) });
      await addDoc(collection(db, "jobs"), {
        title: formData.get('title'), desc: formData.get('desc'), budget,
        category: formData.get('category'), deadline: formData.get('deadline'),
        company: userData.name, companyId: user.uid, status: 'open',
        frozenBudget: budget, createdAt: serverTimestamp()
      });
      setShowCreateModal(false);
    } catch (e) { console.error(e); }
    setIsSubmitting(false);
  };
  

  const updateProfile = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { ...editData });
      setIsEditingProfile(false);
    } catch (e) { alert("Ошибка сохранения"); }
    setIsSubmitting(false);
  };

  const handleLogout = () => { if(window.confirm("Выйти?")) signOut(auth); };

  const submitReview = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const app = reviewModal;
    const jobRef = doc(db, "jobs", app.jobId);
    const jobSnap = await getDoc(jobRef);
    const amount = jobSnap.data()?.frozenBudget || 0;
    await updateDoc(doc(db, "users", app.userId), {
      balance: increment(amount), experience: increment(500), completedProjects: increment(1),
      totalRating: increment(rating), reviewCount: increment(1)
    });
    await addDoc(collection(db, "reviews"), {
      toId: app.userId, fromId: user.uid, fromName: userData.name, rating, text: reviewText, jobTitle: app.jobTitle, createdAt: serverTimestamp()
    });
    await updateDoc(jobRef, { status: 'Завершено', frozenBudget: 0 });
    await updateDoc(doc(db, "applications", app.id), { status: 'Завершено' });
    setReviewModal(null); setReviewText('');
    setIsSubmitting(false);
  };

  const UserAvatar = ({ u, size = "w-12 h-12", rounded = "rounded-2xl" }) => (
    <div className={`${size} ${rounded} bg-[#151a24] border border-white/5 overflow-hidden shadow-xl shrink-0 relative`}>
      <img src={u?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.avatarSeed || u?.name}`} className="w-full h-full object-cover" alt="avatar" />
      {u?.role === 'student' && (
        <div className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-[#151a24] ${u?.isAvailable ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
      )}
    </div>
  );

  if (!user) return <AuthPage />;

  const filteredJobs = jobs
    .filter(j => j.status === 'open' && (activeCat === 'Все' || j.category === activeCat))
    .filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortBy === 'budget' ? b.budget - a.budget : (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const xp = userData?.experience || 0;
  const level = Math.floor(xp / 1000) + 1;
  const progress = (xp % 1000) / 10;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 pb-32 font-sans selection:bg-purple-500/30">
      {/* HEADER */}
      <header className="max-w-md mx-auto pt-8 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <UserAvatar u={userData} />
          <div className="text-left">
            <h1 className="text-[14px] font-black text-white uppercase italic tracking-tight">{userData?.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[8px] bg-white/5 text-slate-400 px-2 py-0.5 rounded font-black uppercase">
                {userData?.role === 'student' ? `Уровень ${level}` : 'Компания'}
              </span>
              {(userData?.hasSubscription || isOwner) && <Crown size={12} className="text-yellow-500 animate-bounce"/>}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button onClick={() => setTab('admin')} className={`p-3 rounded-2xl border border-white/5 transition-all ${tab === 'admin' ? 'bg-red-600 text-white' : 'bg-[#151a24] text-red-500'}`}>
              <Gavel size={20}/>
            </button>
          )}
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-3 bg-[#151a24] rounded-2xl border border-white/5 text-slate-400 relative active:scale-95 transition-transform">
            <Bell size={20}/>
            {notifications.some(n => !n.read) && <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-[#0b0e14]"></div>}
          </button>
        </div>
      </header>

      {/* NOTIFICATIONS */}
      {showNotifications && (
        <div className="fixed top-24 right-6 left-6 z-[100] bg-[#151a24] rounded-[32px] border border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-4 text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">История уведомлений</h3>
            <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white"><X size={18}/></button>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {notifications.length > 0 ? notifications.map(n => (
              <div key={n.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter">{n.title}</p>
                  <span className="text-[8px] text-slate-600 font-bold">{n.createdAt?.toDate().toLocaleDateString()}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{n.text}</p>
              </div>
            )) : (
              <div className="py-10 text-center text-slate-600 font-black uppercase text-[10px] italic">Уведомлений пока нет</div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-md mx-auto px-6 mt-8">
        {/* HOME TAB */}
        {tab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="relative group">
              <input type="text" placeholder="Поиск проектов..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#151a24] border border-white/5 rounded-2xl py-4 px-12 text-sm outline-none focus:border-purple-600/50 transition-all shadow-inner group-hover:border-white/10" />
              <div className="absolute left-4 top-4 text-slate-600"><Search size={18} /></div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${activeCat === cat.id ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-[#151a24] border-white/5 text-slate-500'}`}>
                  {cat.icon} {cat.id}
                </button>
              ))}
            </div>
            
            <div className="flex justify-end gap-4 px-2">
              <button onClick={() => setSortBy('newest')} className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${sortBy === 'newest' ? 'text-purple-500' : 'text-slate-600'}`}><RotateCcw size={10}/> Новые</button>
              <button onClick={() => setSortBy('budget')} className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${sortBy === 'budget' ? 'text-purple-500' : 'text-slate-600'}`}><TrendingUp size={10}/> Бюджет</button>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-28 bg-[#151a24] rounded-[32px] animate-pulse border border-white/5"></div>)
              ) : filteredJobs.length > 0 ? filteredJobs.map(job => (
                <div key={job.id} onClick={() => setSelectedJob(job)} className="bg-[#151a24] p-6 rounded-[32px] border border-white/5 flex items-center gap-5 cursor-pointer hover:border-purple-500/30 transition-all active:scale-95 text-left group shadow-lg">
                  <div className="w-14 h-14 bg-[#0b0e14] rounded-2xl flex items-center justify-center text-purple-500 shadow-inner group-hover:scale-110 transition-transform">
                    {job.category === 'Дизайн' ? <Palette size={24}/> : job.category === 'Код' ? <Code size={24}/> : <Briefcase size={24}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-bold text-white truncate leading-tight mb-1">{job.title}</h4>
                    <p className="text-[9px] text-slate-500 font-black uppercase italic tracking-tighter">{job.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-black text-sm">{job.budget?.toLocaleString()} ₸</p>
                    <div className="flex items-center justify-end gap-1 mt-1 opacity-40">
                      <ShieldCheck size={10} className="text-emerald-500"/>
                      <span className="text-[8px] text-white font-bold uppercase italic tracking-widest">Safe</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 opacity-20 font-black uppercase text-xs italic tracking-[0.2em]">Проектов не найдено</div>
              )}
            </div>
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {tab === 'apps' && (
          <div className="space-y-4 animate-in fade-in text-left">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 italic mb-4">Активные процессы</h2>
            {applications.length > 0 ? applications.map(app => (
              <div key={app.id} className="bg-[#151a24] p-6 rounded-[35px] border border-white/5 space-y-5 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <div className="max-w-[70%] text-left">
                    <h4 className="text-[15px] font-bold text-white leading-tight mb-2 italic tracking-tight">{app.jobTitle}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${app.status === 'В работе' ? 'border-purple-500/30 text-purple-400 bg-purple-500/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'}`}>{app.status}</span>
                      <span className="text-[10px] font-black text-slate-600">{app.budget?.toLocaleString()} ₸</span>
                    </div>
                  </div>
                  <button onClick={() => setChatUser({
                    id: userData.role === 'company' ? app.userId : app.companyId,
                    name: userData.role === 'company' ? app.userName : app.companyName,
                    jobId: app.jobId,
                    chatId: getChatId(app.userId, app.companyId, app.jobId)
                  })} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-purple-400 active:scale-90 transition-all shadow-lg border border-white/5">
                    <MessageCircle size={20}/>
                  </button>
                </div>

                <div className="flex gap-2">
                  {userData.role === 'company' && app.status === 'Ожидание' && (
                    <button disabled={isSubmitting} onClick={async () => {
                      setIsSubmitting(true);
                      await updateDoc(doc(db, "applications", app.id), { status: 'В работе' });
                      await updateDoc(doc(db, "jobs", app.jobId), { status: 'busy', currentWorkerId: app.userId });
                      await addDoc(collection(db, "notifications"), {
                        toId: app.userId, title: "Вас выбрали!", text: `Вы назначены исполнителем проекта: ${app.jobTitle}`, createdAt: serverTimestamp()
                      });
                      setIsSubmitting(false);
                    }} className="flex-1 bg-emerald-600 py-4 rounded-2xl text-[10px] font-black uppercase text-white shadow-lg flex items-center justify-center gap-2">
                      {isSubmitting && <Loader2 size={14} className="animate-spin"/>} Принять отклик
                    </button>
                  )}

                  {userData.role === 'student' && app.status === 'В работе' && (
                    <button onClick={async () => {
                      await updateDoc(doc(db, "applications", app.id), { status: 'На проверке' });
                      await addDoc(collection(db, "notifications"), {
                        toId: app.companyId, title: "Работа сдана", text: `Студент ${userData.name} сдал проект: ${app.jobTitle}`, createdAt: serverTimestamp()
                      });
                    }} className="flex-1 bg-purple-600 py-4 rounded-2xl text-[10px] font-black uppercase text-white shadow-lg">Сдать работу на проверку</button>
                  )}
                  {userData.role === 'company' && app.status === 'На проверке' && (
                    <div className="flex w-full gap-2">
                      <button onClick={() => setReviewModal(app)} className="flex-1 bg-emerald-600 py-4 rounded-2xl text-[10px] font-black uppercase text-white">Принять проект</button>
                      <button onClick={async () => {
                        await updateDoc(doc(db, "applications", app.id), { status: 'Спор' });
                        await addDoc(collection(db, "notifications"), {
                          toId: app.userId, title: "Открыт спор", text: `Заказчик открыл спор по проекту: ${app.jobTitle}`, createdAt: serverTimestamp()
                        });
                      }} className="px-4 bg-red-600/20 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase border border-red-500/20">Спор</button>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-20 opacity-20 font-black uppercase text-xs italic tracking-widest">Активных дел пока нет</div>
            )}
          </div>
        )}

        {/* TOP TAB (С ЗАЩИТОЙ) */}
        {tab === 'top' && (
          <div className="space-y-5 animate-in slide-in-from-right text-left">
             {(!userData?.hasSubscription && userData?.role === 'company' && !isOwner) ? (
                <div className="bg-[#151a24] p-12 rounded-[40px] border border-white/5 text-center space-y-5 shadow-2xl">
                  <div className="w-20 h-20 bg-white/5 rounded-[30px] flex items-center justify-center mx-auto text-yellow-500 shadow-2xl"><Lock size={40}/></div>
                  <div>
                    <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm mb-2">Доступ Elite</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase italic leading-relaxed">Для просмотра лучших исполнителей <br/>необходима активная подписка</p>
                  </div>
                  <button className="w-full py-4 bg-purple-600 rounded-2xl text-[10px] font-black uppercase text-white shadow-xl shadow-purple-600/20">Подключить</button>
                </div>
             ) : (
                <div className="bg-[#151a24] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl relative">
                  <div className="p-8 border-b border-white/5 bg-gradient-to-r from-purple-600/10 to-transparent">
                     <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3"><Trophy className="text-yellow-500" size={20}/> ТОП 100 Студентов</h3>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    {topUsers.map((u, i) => (
                      <div key={u.id} className="flex items-center gap-5 p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group">
                        <span className={`text-[14px] font-black w-6 italic ${i < 3 ? 'text-yellow-500' : 'text-slate-600'}`}>{i+1}</span>
                        <UserAvatar u={u} />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-400 transition-colors">{u.name}</h4>
                          <p className="text-[9px] text-purple-400 font-black uppercase tracking-widest mt-0.5">{u.experience || 0} XP</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/10">
                          <Star size={10} className="text-yellow-500 fill-current"/>
                          <span className="text-[10px] font-black text-yellow-500">{(u.totalRating / (u.reviewCount || 1)).toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             )}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div className="space-y-6 pb-10 animate-in fade-in text-left">
             <div className="bg-[#1c222d] p-10 rounded-[45px] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] group-hover:bg-purple-600/20 transition-all duration-700"></div>
                <div className="flex justify-between items-center mb-10 relative z-10 text-left">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">Общий Баланс</p>
                    <p className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{userData?.balance?.toLocaleString() || 0} <span className="text-emerald-400 text-xl font-normal not-italic ml-1">₸</span></p>
                  </div>
                  <button onClick={() => setShowTopUpModal(true)} className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-600/30 active:scale-90 transition-all hover:bg-purple-500"><Plus size={28}/></button>
                </div>
                
                <div className="flex flex-col items-center relative z-10">
                   <div className="relative mb-6">
                     <div className="w-28 h-28 bg-[#0b0e14] rounded-[35px] border-2 border-white/10 p-1 overflow-hidden shadow-inner">
                        <img src={isEditingProfile ? (editData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editData.avatarSeed}`) : (userData?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.avatarSeed || userData?.name}`)} className="rounded-[30px] w-full h-full object-cover" alt="pfp"/>
                     </div>
                     {isEditingProfile && (
                       <label className="absolute inset-0 bg-black/60 rounded-[35px] flex items-center justify-center cursor-pointer backdrop-blur-sm animate-in fade-in">
                          <Camera className="text-white" size={28}/>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                             const file = e.target.files[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onloadend = () => setEditData({...editData, photoURL: reader.result});
                               reader.readAsDataURL(file);
                             }
                          }} />
                       </label>
                     )}
                   </div>
                   
                   <h2 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tighter">{userData?.name}</h2>
                   
                   {!isEditingProfile ? (
                     <div className="text-center w-full">
                        {userData?.role === 'student' && (
                          <div className="w-full mb-6">
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 mb-2 shadow-inner">
                              <div className="h-full bg-purple-600 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(147,51,234,0.5)]" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase italic px-1">
                              <span>Уровень {level}</span>
                              <span className="text-purple-500">{xp} / {(level) * 1000} XP</span>
                            </div>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 italic max-w-[220px] mx-auto mb-8 leading-relaxed">"{userData?.bio || 'Место для вашей крутой биографии...'}"</p>
                        
                        <div className="flex flex-col gap-3">
                           <button onClick={() => setIsEditingProfile(true)} className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-[9px] font-black uppercase text-slate-400 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors shadow-lg"><Edit3 size={14}/> Настроить профиль</button>
                           <button onClick={handleLogout} className="w-full py-4 bg-red-600/5 border border-red-600/10 rounded-2xl text-[9px] font-black uppercase text-red-500/60 flex items-center justify-center gap-2 hover:bg-red-600/10 transition-colors"><LogOut size={14}/> Выйти из системы</button>
                        </div>
                     </div>
                   ) : (
                     <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-white/5 text-left">
                           <span className="text-[10px] font-black uppercase text-slate-400 italic">Статус доступности</span>
                           <button onClick={() => setEditData({...editData, isAvailable: !editData.isAvailable})} className={`w-12 h-6 rounded-full transition-all relative ${editData.isAvailable ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${editData.isAvailable ? 'left-7' : 'left-1'}`}></div>
                           </button>
                        </div>
                        <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} placeholder="Расскажите о себе..." className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-[11px] text-slate-300 outline-none h-28 resize-none focus:border-purple-600/40" />
                        <div className="flex gap-2 text-left">
                           <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase text-slate-500">Отмена</button>
                           <button disabled={isSubmitting} onClick={updateProfile} className="flex-1 py-4 bg-emerald-600 rounded-2xl text-[9px] font-black uppercase text-white shadow-lg flex items-center justify-center gap-2">
                             {isSubmitting && <Loader2 size={12} className="animate-spin"/>} Сохранить
                           </button>
                        </div>
                     </div>
                   )}
                </div>
             </div>
             
             {/* Portfolio */}
             <div className="space-y-4 text-left">
                <div className="flex justify-between items-center px-2">
                   <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-2"><FolderKanban size={14}/> Моё Портфолио</h3>
                   <button onClick={() => setShowPortfolioModal(true)} className="p-2 bg-purple-600/10 text-purple-500 rounded-lg border border-purple-500/20 hover:bg-purple-600 hover:text-white transition-all shadow-lg"><Plus size={16}/></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {userData?.portfolio?.length > 0 ? userData.portfolio.map((item) => (
                    <div key={item.id} className="bg-[#151a24] p-4 rounded-[28px] border border-white/5 group relative overflow-hidden text-left shadow-lg">
                      <div className="absolute -right-4 -top-4 w-12 h-12 bg-purple-600/5 rounded-full blur-xl group-hover:bg-purple-600/20 transition-all"></div>
                      <h4 className="text-[11px] font-bold text-white mb-3 truncate italic">{item.title}</h4>
                      <div className="flex gap-2 relative z-10">
                        <a href={item.link} target="_blank" rel="noreferrer" className="flex-1 bg-white/5 py-2.5 rounded-xl text-[8px] font-black uppercase text-center text-slate-400 hover:bg-purple-600 hover:text-white transition-all border border-white/5 shadow-sm">Кейс</a>
                        <button onClick={async () => {
                           if(window.confirm("Удалить работу?")) {
                             await updateDoc(doc(db, "users", user.uid), { portfolio: arrayRemove(item) });
                           }
                        }} className="p-2 bg-red-500/5 text-red-500/40 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12}/></button>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 py-10 text-center bg-white/[0.02] rounded-[30px] border border-dashed border-white/5">
                       <p className="text-[9px] font-black uppercase text-slate-600 italic">Список работ пуст</p>
                    </div>
                  )}
                </div>
                
                {/* Reviews */}
                <div className="mt-10 space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-slate-500 px-2 italic flex items-center gap-2"><Star size={14}/> Последние отзывы</h3>
                   {userReviews.length > 0 ? userReviews.map(rev => (
                     <div key={rev.id} className="bg-[#151a24] p-5 rounded-[32px] border border-white/5 text-left shadow-sm relative">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400 text-[10px] font-black italic">{rev.fromName?.charAt(0)}</div>
                             <span className="text-[10px] font-bold text-white italic">{rev.fromName}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-yellow-500/5 px-2 py-1 rounded-lg border border-yellow-500/10">
                            <Star size={10} fill="#eab308" className="text-yellow-500"/> 
                            <span className="text-[10px] font-black text-yellow-500">{rev.rating}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 italic leading-relaxed">"{rev.text}"</p>
                        <p className="text-[8px] text-slate-600 mt-3 font-bold uppercase tracking-widest">{rev.jobTitle}</p>
                     </div>
                   )) : (
                     <p className="text-center py-10 text-[9px] font-black uppercase text-slate-600 italic">Отзывов пока нет</p>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* ADMIN TAB */}
        {tab === 'admin' && isAdmin && (
          <div className="space-y-4 animate-in fade-in text-left">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-8 px-2">Панель Арбитража</h2>
            {disputes.length > 0 ? disputes.map(app => (
              <div key={app.id} className="bg-[#151a24] p-6 rounded-[35px] border border-red-500/10 space-y-5 shadow-2xl relative">
                <div className="text-left">
                  <h4 className="text-white font-bold text-sm leading-tight mb-2 italic">{app.jobTitle}</h4>
                  <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Сумма в блоке:</span>
                    <span className="text-emerald-400 font-black text-xs">{app.budget?.toLocaleString()} ₸</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button onClick={async () => {
                     const jRef = doc(db, "jobs", app.jobId);
                     await updateDoc(doc(db, "users", app.userId), { balance: increment(app.budget) });
                     await updateDoc(doc(db, "applications", app.id), { status: 'resolved' });
                     await updateDoc(jRef, { status: 'closed', frozenBudget: 0 });
                     alert("Выплачено студенту");
                  }} className="bg-emerald-600 py-3.5 rounded-xl text-[9px] font-black uppercase text-white shadow-lg active:scale-95 transition-all">За студента</button>
                  <button onClick={async () => {
                     const jRef = doc(db, "jobs", app.jobId);
                     await updateDoc(doc(db, "users", app.companyId), { balance: increment(app.budget) });
                     await updateDoc(doc(db, "applications", app.id), { status: 'resolved' });
                     await updateDoc(jRef, { status: 'closed', frozenBudget: 0 });
                     alert("Возвращено заказчику");
                  }} className="bg-red-600 py-3.5 rounded-xl text-[9px] font-black uppercase text-white shadow-lg active:scale-95 transition-all">За заказчика</button>
                </div>
                <button onClick={() => setChatUser({
                    id: app.userId, 
                    name: "Арбитраж: " + app.userName, 
                    jobId: app.jobId,
                    chatId: getChatId(app.userId, app.companyId, app.jobId)
                })} className="w-full py-3.5 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:bg-white/10 transition-all shadow-sm">Войти в чат спора</button>
              </div>
            )) : (
              <div className="py-20 text-center opacity-20 font-black uppercase text-xs italic">Споров нет</div>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-[#151a24]/80 backdrop-blur-3xl border border-white/10 rounded-[35px] p-3 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
        <button onClick={() => setTab('home')} className={`p-4 rounded-[24px] transition-all duration-300 ${tab === 'home' ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-600/30' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={24}/></button>
        <button onClick={() => setTab('apps')} className={`p-4 rounded-[24px] transition-all duration-300 ${tab === 'apps' ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-600/30' : 'text-slate-500 hover:text-slate-300'}`}><Rocket size={24}/></button>
        <button onClick={() => setTab('top')} className={`p-4 rounded-[24px] transition-all duration-300 ${tab === 'top' ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-600/30' : 'text-slate-500 hover:text-slate-300'}`}><Trophy size={24}/></button>
        <button onClick={() => setTab('profile')} className={`p-4 rounded-[24px] transition-all duration-300 ${tab === 'profile' ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-600/30' : 'text-slate-500 hover:text-slate-300'}`}><User size={24}/></button>
      </nav>

      {/* --- МОДАЛЬНЫЕ ОКНА --- */}

     {/* Просмотр проекта */}
      {selectedJob && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-10 animate-in fade-in duration-300 text-left">
           <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-md" onClick={() => setSelectedJob(null)}></div>
           <div className="relative w-full max-w-md bg-[#1c222d] rounded-[45px] p-10 border border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>
              
              <div className="flex justify-between items-start mb-6">
                 <span className="px-4 py-1.5 bg-purple-600/20 text-purple-400 rounded-full text-[10px] font-black uppercase border border-purple-500/20 tracking-widest">{selectedJob.category}</span>
                 <p className="text-emerald-400 text-2xl font-black italic tabular-nums">{selectedJob.budget?.toLocaleString()} ₸</p>
              </div>

              <h2 className="text-2xl font-black text-white mb-4 leading-tight uppercase italic">{selectedJob.title}</h2>
              
              <div className="max-h-60 overflow-y-auto mb-10 custom-scrollbar pr-2">
                 <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{selectedJob.desc}</p>
              </div>

              {/* БЛОК ДЕЙСТВИЙ */}
              <div className="space-y-3">
                {/* 1. Кнопка для СТУДЕНТА */}
                {userData?.role === 'student' && (
                  <button 
                    disabled={isSubmitting || myApplications.includes(selectedJob.id)} 
                    onClick={() => handleApply(selectedJob)} 
                    className={`w-full py-6 rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${myApplications.includes(selectedJob.id) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-purple-600 text-white active:scale-95 shadow-xl shadow-purple-600/20'}`}
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : myApplications.includes(selectedJob.id) ? 'Отклик отправлен' : 'Взять проект в работу'}
                  </button>
                )}

                {/* 2. Кнопка для ВЛАДЕЛЕЦА (КОМПАНИИ) */}
                {selectedJob.companyId === user.uid && (
                  <button 
                    onClick={() => deleteJob(selectedJob)}
                    className="w-full py-6 bg-red-600/10 border border-red-500/20 rounded-[28px] text-[10px] font-black uppercase text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Trash2 size={16}/> {selectedJob.status === 'open' ? 'Удалить и вернуть деньги' : 'В работе (удаление запрещено)'}
                  </button>
                )}

                {/* 3. Для ЧУЖОЙ компании (не владельца) */}
                {userData?.role === 'company' && selectedJob.companyId !== user.uid && (
                  <div className="w-full py-6 bg-white/5 border border-white/5 rounded-[28px] text-[10px] font-black uppercase text-slate-500 text-center italic tracking-widest">
                    Просмотр только для студентов
                  </div>
                )}
              </div>
              {/* КОНЕЦ БЛОКА ДЕЙСТВИЙ */}

           </div>
        </div>
      )}
      {/* Создание задания*/}
      {userData.role === 'company' && tab === 'home' && (
        <button onClick={() => setShowCreateModal(true)} className="fixed bottom-28 right-8 w-16 h-16 bg-purple-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl z-50 active:scale-90 transition-all border-4 border-[#0b0e14] hover:bg-purple-500 shadow-purple-600/40">
          <Plus size={32}/>
        </button>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-6">
           <div className="absolute inset-0 bg-[#0b0e14]/95 backdrop-blur-xl" onClick={() => setShowCreateModal(false)}></div>
           <form onSubmit={createJob} className="relative w-full max-w-md bg-[#151a24] rounded-[40px] p-8 border border-white/10 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-left">
              <h3 className="text-lg font-black uppercase italic text-white mb-4 tracking-tight">Размещение заказа</h3>
              <input name="title" required type="text" placeholder="Название проекта" className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-purple-600/30 transition-all shadow-inner" />
              <textarea name="desc" required placeholder="Детальное техническое задание..." className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl p-4 text-sm outline-none h-32 resize-none focus:border-purple-600/30 transition-all shadow-inner" />
              <div className="grid grid-cols-2 gap-3">
                <input name="budget" required type="number" placeholder="Бюджет ₸" className="bg-[#0b0e14] border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-purple-600/30 transition-all shadow-inner" />
                <select name="category" className="bg-[#0b0e14] border border-white/5 rounded-2xl p-4 text-sm outline-none text-slate-400 appearance-none shadow-inner">
                  {categories.filter(c => c.id !== 'Все').map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                </select>
              </div>
              <input name="deadline" required type="text" placeholder="Срок (например: 3 дня)" className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-purple-600/30 transition-all shadow-inner" />
              <button disabled={isSubmitting} type="submit" className="w-full bg-emerald-600 py-5 rounded-[24px] text-[10px] font-black uppercase text-white shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                 {isSubmitting ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>} Опубликовать и депонировать
              </button>
           </form>
        </div>
      )}

      {/* ЧАТ */}
      {chatUser && (
        <div className="fixed inset-0 z-[300] bg-[#0b0e14] flex flex-col animate-in slide-in-from-right duration-300">
           <header className="p-6 border-b border-white/5 flex items-center gap-4 bg-[#151a24]/50 backdrop-blur-2xl text-left">
              <button onClick={() => { setChatUser(null); setMessages([]); }} className="p-3 bg-white/5 rounded-2xl text-slate-400 active:scale-90 transition-all shadow-sm"><X size={20}/></button>
              <div className="flex-1">
                 <h3 className="text-sm font-black uppercase italic tracking-tight text-white">{chatUser.name}</h3>
                 <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">Безопасная сделка</span>
              </div>
           </header>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.length > 0 ? messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.senderId === user.uid ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
  {/* Имя того, кто написал */}
  <span className="text-[8px] font-black uppercase text-slate-600 mb-1 px-2 tracking-tighter">
    {m.senderId === user.uid ? 'Вы' : m.senderName}
  </span>
  
  <div className={`max-w-[85%] p-4 rounded-3xl text-[13px] shadow-lg text-left ${
    m.senderId === user.uid 
      ? 'bg-purple-600 text-white rounded-tr-none' 
      : 'bg-[#151a24] text-slate-300 rounded-tl-none border border-white/5'
  }`}>
    {m.text}
  </div>
</div>
              )) : (
                <div className="py-20 text-center opacity-10">
                   <MessageCircle size={60} className="mx-auto mb-4"/>
                   <p className="text-[10px] font-black uppercase italic tracking-[0.3em]">Начните диалог</p>
                </div>
              )}
           </div>
           
           <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newMessage.trim() || !chatUser?.chatId) return;
              await addDoc(collection(db, "chats", chatUser.chatId, "messages"), {
                text: newMessage, senderId: user.uid, senderName: userData.name, createdAt: serverTimestamp()
              });
              setNewMessage('');
           }} className="p-6 bg-[#151a24]/50 border-t border-white/5 backdrop-blur-2xl flex gap-3">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Введите сообщение..." className="flex-1 bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-sm outline-none focus:border-purple-600/30 transition-all shadow-inner text-white" />
              <button type="submit" className="p-4 bg-purple-600 rounded-2xl text-white shadow-xl shadow-purple-600/20 active:scale-90 transition-all"><Send size={20}/></button>
           </form>
        </div>
      )}

      {/* Модалка пополнения */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-6">
           <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-md" onClick={() => setShowTopUpModal(false)}></div>
           <div className="relative w-full max-w-xs bg-[#151a24] rounded-[40px] p-8 border border-white/10 shadow-2xl text-center">
              <h3 className="text-sm font-black uppercase italic text-white mb-6 tracking-widest">Пополнение баланса</h3>
              <input type="number" placeholder="Сумма ₸" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl p-5 text-xl font-black text-center text-emerald-400 outline-none mb-6 shadow-inner" />
              <button onClick={async () => {
                 if(!topUpAmount) return;
                 await updateDoc(doc(db, "users", user.uid), { balance: increment(Number(topUpAmount)) });
                 setShowTopUpModal(false); setTopUpAmount('');
              }} className="w-full bg-purple-600 py-5 rounded-[24px] text-[10px] font-black uppercase text-white shadow-xl shadow-purple-600/20 active:scale-95 transition-all">Пополнить</button>
           </div>
        </div>
      )}

      {/* Модалка закрытия заказа */}
      {reviewModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-6">
           <div className="absolute inset-0 bg-[#0b0e14]/95 backdrop-blur-xl"></div>
           <div className="relative w-full max-w-md bg-[#151a24] rounded-[40px] p-8 border border-white/10 text-center animate-in zoom-in-95 duration-200">
              <h3 className="text-sm font-black uppercase italic text-white mb-2">Завершение проекта</h3>
              <p className="text-[10px] text-slate-500 uppercase mb-8 italic tracking-widest">Оставьте отзыв исполнителю</p>
              <div className="flex justify-center gap-3 my-8">
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => setRating(star)} className={`p-3 rounded-2xl transition-all duration-300 ${rating >= star ? 'text-yellow-500 scale-110 shadow-lg bg-yellow-500/5 border border-yellow-500/20' : 'text-slate-700 bg-white/5 border border-white/5'}`}>
                    <Star fill={rating >= star ? 'currentColor' : 'none'} size={32}/>
                  </button>
                ))}
              </div>
              <textarea placeholder="Опишите впечатления от работы..." value={reviewText} onChange={e => setReviewText(e.target.value)} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl p-5 text-sm outline-none h-32 resize-none text-left mb-6 focus:border-purple-600/30 shadow-inner" />
              <button disabled={isSubmitting} onClick={submitReview} className="w-full bg-emerald-600 py-5 rounded-[28px] text-[10px] font-black uppercase text-white shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                 {isSubmitting && <Loader2 size={14} className="animate-spin"/>} Подтвердить и выплатить ₸
              </button>
           </div>
        </div>
      )}

      {/* Модалка портфолио */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-6">
           <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-md" onClick={() => setShowPortfolioModal(false)}></div>
           <div className="relative w-full max-w-xs bg-[#151a24] rounded-[40px] p-8 border border-white/10 shadow-2xl text-left animate-in zoom-in-95 duration-200">
              <h3 className="text-[10px] font-black uppercase text-white mb-6 tracking-widest italic flex items-center gap-2"><Plus size={14}/> Добавить кейс</h3>
              <div className="space-y-4">
                 <input type="text" placeholder="Название проекта" value={newPortfolioItem.title} onChange={e => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl p-4 text-[11px] outline-none focus:border-purple-600/30 shadow-inner" />
                 <input type="text" placeholder="Ссылка (https://...)" value={newPortfolioItem.link} onChange={e => setNewPortfolioItem({...newPortfolioItem, link: e.target.value})} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl p-4 text-[11px] outline-none focus:border-purple-600/30 shadow-inner" />
                 <button onClick={async () => {
                    if(!newPortfolioItem.title) return;
                    await updateDoc(doc(db, "users", user.uid), { portfolio: arrayUnion({ ...newPortfolioItem, id: Date.now() }) });
                    setNewPortfolioItem({ title: '', link: '' }); setShowPortfolioModal(false);
                 }} className="w-full bg-purple-600 py-4 rounded-2xl text-[10px] font-black uppercase text-white shadow-lg shadow-purple-600/20 mt-2 active:scale-95 transition-all">Добавить в портфолио</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;