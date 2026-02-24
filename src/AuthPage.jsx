import React, { useState } from 'react';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(doc(db, "users", res.user.uid), {
          name, email: email.trim(), role, experience: 0, balance: 0, rating: 5.0, completedProjects: 0
        });
      }
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] flex flex-col justify-center px-8 text-white">
      <div className="max-w-md w-full mx-auto space-y-6">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-center italic">SkillBridge</h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="ИМЯ" className="w-full bg-[#1c222d] p-4 rounded-2xl border border-white/5 outline-none focus:border-purple-500" onChange={e => setName(e.target.value)} required />
              <div className="flex gap-2 p-1 bg-[#1c222d] rounded-2xl border border-white/5">
                <button type="button" onClick={() => setRole('student')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'student' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}>Студент</button>
                <button type="button" onClick={() => setRole('company')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'company' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}>Компания</button>
              </div>
            </>
          )}
          <input type="email" placeholder="EMAIL" className="w-full bg-[#1c222d] p-4 rounded-2xl border border-white/5 outline-none focus:border-purple-500" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="ПАРОЛЬ" className="w-full bg-[#1c222d] p-4 rounded-2xl border border-white/5 outline-none focus:border-purple-500" onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-purple-600 py-4 rounded-2xl font-black uppercase shadow-lg shadow-purple-600/30 active:scale-95 transition-all">
            {isLogin ? 'ВОЙТИ' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
          {isLogin ? 'Нет аккаунта? Создать' : 'Есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
};
export default AuthPage;