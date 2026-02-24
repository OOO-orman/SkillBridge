import React from 'react';
import { Trophy, Lock, Star, ChevronLeft } from 'lucide-react';

const Top100View = ({ onBack, hasAccess }) => {
  const universities = [
    { rank: 1, name: "Astana IT University", score: 98.2, projects: 142 },
    { rank: 2, name: "KBTU", score: 96.5, projects: 128 },
    { rank: 3, name: "Nazarbayev University", score: 95.9, projects: 115 },
    { rank: 4, name: "Satbayev University", score: 92.1, projects: 94 },
    { rank: 5, name: "ENU", score: 89.4, projects: 88 },
  ];

  return (
    <div className="animate-in slide-in-from-right duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl text-gray-400">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Top 100 Ranking</h2>
      </div>

      {!hasAccess ? (
        <div className="relative p-8 rounded-[40px] bg-[#12161d] border border-white/5 overflow-hidden text-center">
          <div className="absolute inset-0 bg-[#0a0a0b]/80 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 border border-yellow-500/30">
              <Lock className="text-yellow-500" size={28} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-2">Доступ закрыт</h3>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight leading-relaxed px-4">
              Рейтинг доступен только для аккаунтов типа "Университет" с активной подпиской [cite: 2026-02-21]
            </p>
          </div>
          <div className="opacity-10 blur-md space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/10 rounded-2xl w-full" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {universities.map((uni) => (
            <div key={uni.rank} className="p-5 bg-[#12161d] border border-white/5 rounded-[32px] flex items-center justify-between group hover:border-yellow-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic ${uni.rank <= 3 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5 text-gray-500'}`}>
                  {uni.rank}
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-tight text-white">{uni.name}</h4>
                  <p className="text-[8px] font-bold text-gray-600 uppercase mt-1">{uni.projects} проектов</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star size={10} className="fill-yellow-500" />
                <span className="text-xs font-black">{uni.score}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Top100View;  