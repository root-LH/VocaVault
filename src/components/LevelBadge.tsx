"use client";

import { useEffect, useState } from "react";
import { getExpForNextLevel, getExpToReachLevel } from "@/lib/xp";

interface Stats {
  level: number;
  totalExp: number;
}

export default function LevelBadge() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    };
    fetchStats();
  }, []);

  if (!stats) return null;

  const expNeededForCurrentLevel = getExpToReachLevel(stats.level);
  const expNeededForNextLevel = getExpForNextLevel(stats.level);
  const progressInCurrentLevel = stats.totalExp - expNeededForCurrentLevel;
  
  const progressPercent = Math.min((progressInCurrentLevel / expNeededForNextLevel) * 100, 100);

  return (
    <div className="bg-white px-6 py-4 rounded-[2rem] shadow-sm border border-blue-50 flex items-center gap-6">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl rotate-12 absolute shadow-lg" />
        <span className="relative z-10 text-white font-black text-2xl">Lv.{stats.level}</span>
      </div>
      
      <div className="flex-1 min-w-[140px]">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Growth</span>
          <span className="text-[10px] font-bold text-blue-400">
            {Math.floor(progressInCurrentLevel)} / {expNeededForNextLevel} XP
          </span>
        </div>
        <div className="h-3 bg-blue-50 rounded-full overflow-hidden border border-blue-100 p-[2px]">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
