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
  
  // -- СОСТОЯНИЯ (ВОССТАНОВЛЕНО ПОЛНОСТЬЮ) --
  const [tab, setTab] = useState('home');
  const [activeCat, setActiveCat] = useState('Все');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', budget: '', category: 'Разработка', desc: '' });
  const [applications, setApplications] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [topUsers, setTopUsers] = useState([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, balance: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('my_jobs');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({});
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [newPortfolioItem, setNewPortfolioItem] = useState({ title: '', link: '' });

  // === ИСПРАВЛЕНИЕ БАГА ЧАТА: Функция генерации ID ===
  const getChatId = (uid1, uid2, jobId) => {
    if (!uid1 || !uid2 || !jobId) return null;
    return [uid1, uid2].sort().join('_') + `_${jobId}`;
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"), orderBy("rating", "desc"), limit(100));
    return onSnapshot(q, (snap) => {
      setTopUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  useEffect(() => {
    if (!user || !userData) return;
    const q = userData.role === 'company' 
      ? query(collection(db, "applications"), where("companyId", "==", user.uid))
      : query(collection(db, "applications"), where("userId", "==", user.uid));
    
    return onSnapshot(q, (snap) => {
      setApplications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user, userData]);

  // === ИСПРАВЛЕНИЕ БАГА ЧАТА: Загрузка сообщений ===
  useEffect(() => {
    if (!chatUser?.chatId) return;
    const q = query(
      collection(db, "chats", chatUser.chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [chatUser?.chatId]);

  if (!user) return <AuthPage />;

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.budget) return;
    await addDoc(collection(db, "jobs"), {
      ...newJob,
      companyId: user.uid,
      companyName: userData.name,
      status: 'active',
      createdAt: serverTimestamp()
    });
    setShowCreateModal(false);
    setNewJob({ title: '', budget: '', category: 'Разработка', desc: '' });
  };

  const applyToJob = async (job) => {
    await addDoc(collection(db, "applications"), {
      jobId: job.id,
      jobTitle: job.title,
      userId: user.uid,
      userName: userData.name,
      companyId: job.companyId,
      companyName: job.companyName,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    setSelectedJob(null);
  };

  // === ИСПРАВЛЕНИЕ БАГА ЧАТА: Отправка сообщения ===
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatUser?.chatId) return;
    try {
      await addDoc(collection(db, "chats", chatUser.chatId, "messages"), {
        text: newMessage,
        senderId: user.uid,
        senderName: userData.name || 'Пользователь',
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error sending:", err);
    }
  };

  const updateAppStatus = async (appId, newStatus) => {
    await updateDoc(doc(db, "applications", appId), { status: newStatus });
  };

  const saveProfile = async () => {
    await updateDoc(doc(db, "users", user.uid), editData);
    setIsEditingProfile(false);
  };

  const addPortfolio = async () => {
    if(!newPortfolioItem.title) return;
    await updateDoc(doc(db, "users", user.uid), {
      portfolio: arrayUnion({ ...newPortfolioItem, id: Date.now() })
    });
    setNewPortfolioItem({ title: '', link: '' });
    setShowCaseModal(false);
  };

  return (
    <div className="min-h-screen bg-[#06080c] text-white font-['Inter'] selection:bg-purple-500/30">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-[#06080c]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Rocket size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">SkillBridge</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Platform v2.4</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-white/5 border border-white/5 rounded-full px-4 py-1.5 gap-3">
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-white/40 uppercase font-bold">Баланс</span>
               <span className="text-xs font-black text-green-400">{userData?.balance || 0} ₸</span>
             </div>
             <div className="w-px h-6 bg-white/10" />
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-white/40 uppercase font-bold">Рейтинг</span>
               <span className="text-xs font-black text-purple-400">{userData?.rating || 0}</span>
             </div>
          </div>
          <button onClick={() => signOut(auth)} className="p-2.5 bg-white/5 hover:bg-red-500/10 border border-white/5 rounded-xl transition-all group">
            <LogOut size={18} className="text-white/40 group-hover:text-red-500" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        
        {/* TAB: HOME (БИРЖА) */}
        {tab === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Поиск проектов..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 no-scrollbar">
                {['Все', 'Разработка', 'Дизайн', 'Маркетинг', 'Тексты'].map(c => (
                  <button 
                    key={c}
                    onClick={() => setActiveCat(c)}
                    className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCat === c ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-600/20' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.filter(j => (activeCat === 'Все' || j.category === activeCat) && j.title.toLowerCase().includes(searchQuery.toLowerCase())).map(job => (
                <div key={job.id} onClick={() => setSelectedJob(job)} className="group relative bg-white/5 border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.07] transition-all cursor-pointer overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    {job.category === 'Разработка' && <Code size={80} />}
                    {job.category === 'Дизайн' && <Palette size={80} />}
                  </div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-4 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-tighter border border-purple-500/20">
                      {job.category}
                    </span>
                    <span className="text-xl font-black text-green-400">{job.budget} ₸</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-purple-400 transition-colors line-clamp-1">{job.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-8 line-clamp-2">{job.desc}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                        <User size={14} className="text-white/60" />
                      </div>
                      <span className="text-xs font-bold text-white/60">{job.companyName}</span>
                    </div>
                    <ChevronRight size={18} className="text-white/20 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: TOP 100 */}
        {tab === 'top' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Elite Talents</h2>
              <p className="text-white/40 text-sm uppercase tracking-[0.2em]">Топ 100 лучших исполнителей платформы</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-white/30 uppercase tracking-widest font-black">
                    <th className="px-8 py-6 text-left">Ранг</th>
                    <th className="px-8 py-6 text-left">Студент</th>
                    <th className="px-8 py-6 text-right">Рейтинг</th>
                    <th className="px-8 py-6 text-right">Проекты</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((u, i) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <span className={`text-lg font-black italic ${i < 3 ? 'text-purple-500' : 'text-white/20'}`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            {u.role === 'company' ? <Briefcase size={18}/> : <User size={18}/>}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2 italic uppercase text-sm">
                              {u.name}
                              {i < 3 && <Crown size={14} className="text-yellow-500" />}
                            </div>
                            <div className="text-[10px] text-white/30 uppercase tracking-wider">{u.specialization || 'Специалист'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-purple-400">{u.rating || 0}</td>
                      <td className="px-8 py-6 text-right font-mono text-white/40">{u.completedJobs || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: WORK (ПРОЕКТЫ В РАБОТЕ) */}
        {tab === 'work' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex gap-4 p-2 bg-white/5 rounded-[24px] w-fit border border-white/5">
                <button 
                  onClick={() => setActiveSubTab('my_jobs')}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'my_jobs' ? 'bg-white/10 text-white border border-white/10' : 'text-white/40 hover:text-white'}`}
                >
                  {userData.role === 'company' ? 'Мои заказы' : 'Мои отклики'}
                </button>
                <button 
                  onClick={() => setActiveSubTab('active_work')}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'active_work' ? 'bg-white/10 text-white border border-white/10' : 'text-white/40 hover:text-white'}`}
                >
                  В работе
                </button>
             </div>

             <div className="grid gap-4">
               {applications.filter(app => {
                 if(activeSubTab === 'my_jobs') return app.status === 'pending' || app.status === 'rejected';
                 return app.status === 'accepted' || app.status === 'completed';
               }).map(app => (
                 <div key={app.id} className="bg-white/5 border border-white/5 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${app.status === 'accepted' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
                        <BriefcaseBusiness size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">{app.jobTitle}</h4>
                        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-white/30">
                          <span className="flex items-center gap-1.5"><User size={12}/> {userData.role === 'company' ? app.userName : app.companyName}</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full"/>
                          <span className={`flex items-center gap-1.5 ${app.status === 'accepted' ? 'text-green-500' : ''}`}>
                            {app.status === 'pending' && 'На рассмотрении'}
                            {app.status === 'accepted' && 'В процессе'}
                            {app.status === 'completed' && 'Завершено'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* КНОПКА ОТКРЫТИЯ ЧАТА - ИСПРАВЛЕНА */}
                      <button 
                        onClick={() => {
                          const otherId = userData.role === 'company' ? app.userId : app.companyId;
                          const otherName = userData.role === 'company' ? app.userName : app.companyName;
                          const combinedChatId = getChatId(user.uid, otherId, app.jobId);
                          setChatUser({ 
                            id: otherId, 
                            name: otherName,
                            jobId: app.jobId,
                            chatId: combinedChatId
                          });
                        }}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
                      >
                        <MessageCircle size={20} className="text-white/40 group-hover:text-purple-400" />
                      </button>
                      
                      {userData.role === 'company' && app.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateAppStatus(app.id, 'accepted')} className="px-6 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Принять</button>
                          <button onClick={() => updateAppStatus(app.id, 'rejected')} className="px-6 py-4 bg-white/5 hover:bg-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 text-white/40">Отказ</button>
                        </div>
                      )}

                      {app.status === 'accepted' && (
                         <button className="px-8 py-4 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                           <Handshake size={16}/> Завершить сделку
                         </button>
                      )}
                    </div>
                 </div>
               ))}
               {applications.length === 0 && (
                 <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                   <FolderKanban size={48} className="mx-auto text-white/10 mb-4" />
                   <p className="text-white/30 uppercase text-[10px] font-black tracking-widest">Нет активных проектов</p>
                 </div>
               )}
             </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {tab === 'profile' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* LEFT SIDE: INFO */}
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-purple-600/20 to-transparent" />
                  <div className="relative">
                    <div className="w-32 h-32 mx-auto mb-6 relative">
                       <div className="absolute inset-0 bg-purple-600 blur-2xl opacity-20 animate-pulse" />
                       <div className="w-full h-full bg-[#0b0e14] border-4 border-white/10 rounded-[40px] flex items-center justify-center relative z-10">
                          <User size={50} className="text-white/20" />
                       </div>
                       <button className="absolute bottom-0 right-0 p-3 bg-purple-600 rounded-2xl border-4 border-[#06080c] z-20 hover:scale-110 transition-transform">
                          <Camera size={16} />
                       </button>
                    </div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1">{userData.name}</h2>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-6">{userData.specialization || 'Ранг: Новичок'}</p>
                    <div className="flex justify-center gap-2 mb-8">
                       {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= 4 ? "text-yellow-500 fill-yellow-500" : "text-white/10"} />)}
                    </div>
                    <button onClick={() => { setEditData(userData); setIsEditingProfile(true); }} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Редактировать профиль
                    </button>
                  </div>
               </div>

               <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 space-y-6">
                  <h3 className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2"><TrendingUp size={14}/> Аналитика</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-[#0b0e14] p-4 rounded-3xl border border-white/5">
                        <div className="text-[10px] text-white/30 uppercase font-black mb-1">Проекты</div>
                        <div className="text-xl font-black uppercase italic">{userData.completedJobs || 0}</div>
                     </div>
                     <div className="bg-[#0b0e14] p-4 rounded-3xl border border-white/5">
                        <div className="text-[10px] text-white/30 uppercase font-black mb-1">Отзывы</div>
                        <div className="text-xl font-black uppercase italic">12</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* RIGHT SIDE: PORTFOLIO / BIO */}
            <div className="lg:col-span-8 space-y-8">
               <div className="bg-white/5 border border-white/5 rounded-[40px] p-10">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Портфолио</h3>
                    <button onClick={() => setShowCaseModal(true)} className="p-4 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-2xl transition-all">
                       <Plus size={20} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userData.portfolio?.map(item => (
                      <a key={item.id} href={item.link} target="_blank" rel="noreferrer" className="group bg-[#0b0e14] border border-white/5 rounded-[32px] p-6 hover:border-purple-500/30 transition-all overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink size={18} className="text-purple-500" />
                         </div>
                         <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-500/10 transition-colors">
                            <LinkIcon size={20} className="text-white/20 group-hover:text-purple-500" />
                         </div>
                         <h4 className="font-bold mb-2 group-hover:text-purple-400 transition-colors">{item.title}</h4>
                         <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">{new URL(item.link).hostname}</p>
                      </a>
                    ))}
                    {(!userData.portfolio || userData.portfolio.length === 0) && (
                       <div className="col-span-2 py-16 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                          <Zap size={32} className="mx-auto text-white/10 mb-4" />
                          <p className="text-white/30 uppercase text-[10px] font-black tracking-widest">Кейсы еще не добавлены</p>
                       </div>
                    )}
                  </div>
               </div>

               <div className="bg-white/5 border border-white/5 rounded-[40px] p-10">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">О себе</h3>
                  <p className="text-white/50 leading-relaxed text-sm">
                    {userData.bio || 'Этот пользователь пока ничего не рассказал о себе, но мы уверены, что он крутой специалист!'}
                  </p>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#06080c]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0b0e14] border border-white/10 w-full max-w-2xl rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="relative h-48 bg-gradient-to-br from-purple-600 to-blue-600 p-10 flex flex-col justify-end">
                <button onClick={() => setSelectedJob(null)} className="absolute top-8 right-8 p-3 bg-black/20 hover:bg-black/40 rounded-2xl backdrop-blur-md transition-all">
                  <X size={20} />
                </button>
                <span className="px-4 py-1.5 bg-black/20 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 w-fit mb-4">
                  {selectedJob.category}
                </span>
                <h2 className="text-3xl font-black uppercase italic italic tracking-tighter">{selectedJob.title}</h2>
             </div>
             <div className="p-10 space-y-8">
                <div className="flex gap-12">
                   <div>
                     <div className="text-[10px] text-white/30 uppercase font-black mb-1">Бюджет</div>
                     <div className="text-2xl font-black text-green-400">{selectedJob.budget} ₸</div>
                   </div>
                   <div>
                     <div className="text-[10px] text-white/30 uppercase font-black mb-1">Заказчик</div>
                     <div className="text-2xl font-black uppercase italic">{selectedJob.companyName}</div>
                   </div>
                </div>
                <div>
                   <div className="text-[10px] text-white/30 uppercase font-black mb-4">Описание проекта</div>
                   <p className="text-white/60 text-sm leading-relaxed">{selectedJob.desc}</p>
                </div>
                {userData.role === 'student' && (
                  <button 
                    onClick={() => applyToJob(selectedJob)}
                    className="w-full py-6 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:bg-purple-500 hover:text-white transition-all shadow-xl shadow-white/5"
                  >
                    Откликнуться на проект
                  </button>
                )}
             </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#06080c]/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#0b0e14] border border-white/10 w-full max-w-lg rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter">Новый заказ</h2>
                 <button onClick={() => setShowCreateModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><X size={20}/></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-white/30 ml-4 tracking-widest">Название</label>
                   <input type="text" placeholder="Что нужно сделать?" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="w-full bg-[#06080c] border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-purple-500/50 transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-white/30 ml-4 tracking-widest">Бюджет (₸)</label>
                     <input type="number" placeholder="5000" value={newJob.budget} onChange={e => setNewJob({...newJob, budget: e.target.value})} className="w-full bg-[#06080c] border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-purple-500/50 transition-all" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-white/30 ml-4 tracking-widest">Категория</label>
                     <select value={newJob.category} onChange={e => setNewJob({...newJob, category: e.target.value})} className="w-full bg-[#06080c] border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-purple-500/50 transition-all appearance-none">
                        <option>Разработка</option>
                        <option>Дизайн</option>
                        <option>Маркетинг</option>
                        <option>Тексты</option>
                     </select>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-white/30 ml-4 tracking-widest">Техзадание</label>
                   <textarea rows="4" placeholder="Подробное описание..." value={newJob.desc} onChange={e => setNewJob({...newJob, desc: e.target.value})} className="w-full bg-[#06080c] border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-purple-500/50 transition-all resize-none"></textarea>
                 </div>
                 <button onClick={handleCreateJob} className="w-full py-6 bg-purple-600 hover:bg-purple-500 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-purple-600/20 mt-4">Опубликовать проект</button>
              </div>
           </div>
        </div>
      )}

      {/* CHAT INTERFACE - ИСПРАВЛЕНО */}
      {chatUser && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-6 bg-[#06080c]/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-[#0b0e14] w-full max-w-4xl h-full md:h-[80vh] md:rounded-[48px] border-t md:border border-white/10 flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
              <div className="p-6 md:p-8 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center font-black italic text-xl">
                       {chatUser.name[0]}
                    </div>
                    <div>
                       <h3 className="font-black uppercase italic tracking-tighter text-lg">{chatUser.name}</h3>
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">Безопасная сделка</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setChatUser(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                 {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                       <MessageCircle size={60} className="mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em]">Начните диалог</p>
                    </div>
                 )}
                 {messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.senderId === user.uid ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                       <div className={`max-w-[80%] p-5 rounded-[24px] ${m.senderId === user.uid ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-white rounded-tl-none'}`}>
                          <p className="text-sm leading-relaxed">{m.text}</p>
                          <div className={`text-[9px] mt-2 font-black uppercase opacity-40 ${m.senderId === user.uid ? 'text-right' : 'text-left'}`}>
                             {m.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              <form onSubmit={sendMessage} className="p-6 md:p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
                 <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ваше сообщение..." 
                    className="flex-1 bg-[#06080c] border border-white/5 rounded-2xl px-6 py-5 text-sm outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20"
                 />
                 <button type="submit" className="p-5 bg-purple-600 hover:bg-purple-500 rounded-2xl shadow-lg shadow-purple-600/20 transition-all active:scale-95">
                    <Send size={20} />
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* FOOTER NAVIGATION */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0b0e14]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 flex items-center gap-1 z-50 shadow-2xl">
        {[
          { id: 'home', icon: LayoutGrid, label: 'Биржа' },
          { id: 'top', icon: Trophy, label: 'Топ' },
          { id: 'work', icon: Briefcase, label: 'Заказы' },
          { id: 'profile', icon: User, label: 'Профиль' },
        ].map(n => (
          <button 
            key={n.id}
            onClick={() => setTab(n.id)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all group ${tab === n.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/40 hover:bg-white/5'}`}
          >
            <n.icon size={20} className={tab === n.id ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'} />
            {tab === n.id && <span className="text-[10px] font-black uppercase tracking-widest">{n.label}</span>}
          </button>
        ))}
        {userData.role === 'company' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="ml-2 w-14 h-14 bg-white text-black rounded-[20px] flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all shadow-xl"
          >
            <Plus size={24} />
          </button>
        )}
      </nav>

      {/* PORTFOLIO MODAL */}
      {showCaseModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#06080c]/95 backdrop-blur-xl">
           <div className="bg-[#0b0e14] border border-white/10 p-10 rounded-[40px] w-full max-w-md shadow-2xl text-left animate-in zoom-in-95 duration-200">
              <h3 className="text-[10px] font-black uppercase text-white mb-6 tracking-widest italic flex items-center gap-2"><Plus size={14}/> Добавить кейс</h3>
              <div className="space-y-4">
                 <input type="text" placeholder="Название проекта" value={newPortfolioItem.title} onChange={e => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl p-4 text-[11px] outline-none focus:border-purple-600/30" />
                 <input type="text" placeholder="Ссылка (https://...)" value={newPortfolioItem.link} onChange={e => setNewPortfolioItem({...newPortfolioItem, link: e.target.value})} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl p-4 text-[11px] outline-none focus:border-purple-600/30" />
                 <div className="flex gap-3 mt-6">
                    <button onClick={addPortfolio} className="flex-1 py-4 bg-purple-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Сохранить</button>
                    <button onClick={() => setShowCaseModal(false)} className="px-6 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Отмена</button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;