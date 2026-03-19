"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Eye, ArrowLeft, RefreshCw, Shuffle, Volume2 } from "lucide-react";
import Link from "next/link";
import { speak } from "@/lib/speech";
import ThemeToggle from "@/components/ThemeToggle";

interface Word {
  id: string;
  word: string;
  definition: string;
  example: string | null;
}

interface Topic {
  id: string;
  name: string;
  words: Word[];
}

export default function StudyPage({ params }: { params: { id: string } }) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTopic = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/topics/${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setTopic(data);
        setWords(data.words || []);
      }
    } catch (error) {
      console.error("Error fetching topic:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopic();
  }, [params.id]);

  const handleNext = () => {
    setShowDefinition(false);
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const handlePrev = () => {
    setShowDefinition(false);
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  const shuffleWords = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setShowDefinition(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-600 dark:bg-gray-950 transition-colors">Preparing study session...</div>;
  if (!topic || words.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-emerald-50/30 dark:bg-gray-950 transition-colors">
      <p className="text-2xl font-bold text-gray-400 dark:text-gray-600 mb-8 transition-colors">No words to study here.</p>
      <Link href={`/topic/${params.id}`} className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-bold shadow-xl transition-all">Go back</Link>
    </div>
  );

  const currentWord = words[currentIndex];

  return (
    <main className="min-h-screen bg-emerald-50/50 dark:bg-gray-950 p-8 md:p-24 flex flex-col items-center transition-colors duration-300">
      <header className="w-full max-w-2xl flex justify-between items-center mb-12">
        <Link href={`/topic/${params.id}`} className="text-emerald-900 dark:text-emerald-400 font-bold flex items-center gap-2 hover:opacity-70 bg-white dark:bg-gray-900 px-6 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm transition-all">
          <ArrowLeft size={20} /> Exit
        </Link>
        <div className="flex flex-col items-end">
          <span className="text-emerald-900 dark:text-emerald-100 font-black text-xl transition-colors">{currentIndex + 1} / {words.length}</span>
          <div className="w-32 h-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-600 transition-all duration-500" 
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} 
            />
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div 
          onClick={() => setShowDefinition(!showDefinition)} 
          className={`bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-12 min-h-[400px] flex flex-col items-center justify-center text-center transition-all border-8 border-white dark:border-gray-800 relative cursor-pointer hover:scale-[1.01] ${showDefinition ? 'border-emerald-100 dark:border-emerald-900/30' : ''}`}
        >
          {!showDefinition ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  speak(currentWord.word);
                }}
                className="absolute right-0 top-0 text-emerald-300 dark:text-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 p-4 transition-colors rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-800/50"
                title="Listen to pronunciation (Key: S)"
              >
                <Volume2 size={40} />
              </button>
              <span className="text-xs font-black text-emerald-300 dark:text-emerald-700 uppercase tracking-widest mb-4 block transition-colors">Word</span>
              <h2 className="text-6xl font-black text-emerald-900 dark:text-white mb-8 tracking-tighter break-words px-12 transition-colors">{currentWord.word}</h2>
              <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-8 py-4 rounded-full font-bold transition-colors">
                <Eye size={20} /> Click to reveal meaning
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-300 w-full">
              <span className="text-xs font-black text-emerald-300 dark:text-emerald-700 uppercase tracking-widest mb-4 block transition-colors">Definition</span>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 leading-tight mb-8 transition-colors">{currentWord.definition}</p>
              {currentWord.example && (
                <div className="mt-8 text-emerald-600 dark:text-emerald-400 italic text-xl border-t border-emerald-50 dark:border-emerald-900/20 pt-8 px-6 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-3xl pb-8 transition-colors">
                  "{currentWord.example}"
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handlePrev}
            className="flex-1 bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-6 rounded-[2rem] font-black text-xl transition-all border-4 border-white dark:border-gray-800 flex items-center justify-center gap-2 shadow-lg"
          >
            <ChevronLeft size={24} /> Prev
          </button>
          <button 
            onClick={shuffleWords}
            className="bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-6 rounded-[2rem] font-black text-xl transition-all border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg"
            title="Shuffle"
          >
            <Shuffle size={24} />
          </button>
          <button 
            onClick={handleNext}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-[2rem] font-black text-xl transition-all border-4 border-emerald-600 dark:border-emerald-500 flex items-center justify-center gap-2 shadow-lg"
          >
            Next <ChevronRight size={24} />
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-400 dark:text-gray-600 font-medium transition-colors">Tip: Use Left/Right arrows or Space to navigate</p>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.onkeydown = function(e) {
            if (e.code === 'ArrowRight' || e.code === 'Space') {
              document.querySelector('button:last-child').click();
            } else if (e.code === 'ArrowLeft') {
              document.querySelector('button:first-child').click();
            } else if (e.code === 'KeyV' || e.code === 'Enter') {
              document.querySelector('.cursor-pointer').click();
            } else if (e.code === 'KeyS') {
              const speakerBtn = document.querySelector('button[title*="Listen"]');
              if (speakerBtn) speakerBtn.click();
            }
          };
        `
      }} />
    </main>
  );
}
