"use client";

import { useState, useEffect } from "react";
import { Plus, GraduationCap, Folder, Trash2, ChevronRight, Flame, BookOpen, Check } from "lucide-react";
import Link from "next/link";
import TopicForm from "@/components/TopicForm";
import LevelBadge from "@/components/LevelBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";

interface Topic {
  id: string;
  name: string;
  description: string | null;
  _count: {
    words: number;
  };
}

export default function Home() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const router = useRouter();

  const fetchTopics = async () => {
    try {
      // 토픽 가져오기
      const response = await fetch("/api/topics");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setTopics(data);
      } else {
        setTopics([]);
      }

      // 복습 단어 개수 가져오기
      const reviewRes = await fetch("/api/words/review");
      const reviewData = await reviewRes.json();
      if (reviewRes.ok && Array.isArray(reviewData)) {
        setReviewCount(reviewData.length);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const deleteTopic = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure? This will delete all words in this topic.")) return;
    try {
      const response = await fetch(`/api/topics/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchTopics();
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      }
    } catch (error) {
      console.error("Failed to delete topic:", error);
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleStudySelected = () => {
    if (selectedIds.length === 0) return;
    router.push(`/study?topics=${selectedIds.join(",")}`);
  };

  const handleQuizSelected = () => {
    if (selectedIds.length === 0) return;
    router.push(`/quiz?topics=${selectedIds.join(",")}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 md:p-24 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <div className="flex-1">
            <h1 className="text-7xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 transition-colors">
              VocaVault
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-2xl font-medium transition-colors">
              Master your vocabulary with AI-powered focus.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <ThemeToggle />
            <LevelBadge />
            <div className="flex flex-wrap gap-2">
              {reviewCount > 0 && (
                <Link 
                  href="/quiz?mode=review"
                  className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-4 rounded-2xl transition-all shadow-xl font-black animate-bounce-slow"
                  title="Practice words scheduled for review"
                >
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <Flame size={20} className="fill-current" />
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] uppercase tracking-tighter opacity-80">Scheduled Review</span>
                    <span className="text-lg">{reviewCount} Words Due</span>
                  </div>
                </Link>
              )}
              {selectedIds.length > 0 ? (
                <>
                  <button 
                    onClick={handleStudySelected}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl transition-all shadow-lg font-bold animate-in fade-in slide-in-from-right-4"
                  >
                    <BookOpen size={20} />
                    Study Selected ({selectedIds.length})
                  </button>
                  <button 
                    onClick={handleQuizSelected}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl transition-all shadow-lg font-bold animate-in fade-in slide-in-from-right-4"
                  >
                    <GraduationCap size={20} />
                    Quiz Selected ({selectedIds.length})
                  </button>
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="text-gray-500 dark:text-gray-400 font-bold px-4 py-4 hover:underline transition-colors"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/study"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl transition-all shadow-lg font-bold"
                    title="Study all your words"
                  >
                    <BookOpen size={20} />
                    Study All
                  </Link>
                  <Link 
                    href="/study?mode=weak"
                    className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 px-6 py-4 rounded-2xl transition-all shadow-sm font-bold"
                    title="Study words you missed"
                  >
                    <BookOpen size={20} />
                    Study Weak
                  </Link>
                  <Link 
                    href="/quiz?mode=weak"
                    className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 px-6 py-4 rounded-2xl transition-all shadow-sm font-bold"
                    title="Quiz only words you missed"
                  >
                    <Flame size={20} className="fill-current" />
                    Weak Quiz
                  </Link>
                  <Link 
                    href="/quiz"
                    className="flex items-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-blue-900 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 px-6 py-4 rounded-2xl transition-all shadow-sm font-bold"
                  >
                    <GraduationCap size={20} />
                    Full Quiz
                  </Link>
                </>
              )}
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl font-black"
              >
                <Plus size={20} />
                New Topic
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading your topics...</div>
        ) : topics.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors">
            <Folder className="mx-auto text-gray-200 dark:text-gray-700 mb-6" size={64} />
            <p className="text-gray-400 dark:text-gray-500 text-lg mb-6 font-medium">No topics yet. Create one to start adding words!</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-colors"
            >
              Create your first topic
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/topic/${t.id}`}
                className={`bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border transition-all group relative block ${selectedIds.includes(t.id) ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-900 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10'}`}
              >
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <button
                    onClick={(e) => deleteTopic(e, t.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={(e) => toggleSelect(e, t.id)}
                    className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${selectedIds.includes(t.id) ? 'bg-blue-600 border-blue-600 text-white scale-110' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-transparent opacity-0 group-hover:opacity-100 hover:border-blue-400'}`}
                  >
                    <Check size={18} strokeWidth={3} className={selectedIds.includes(t.id) ? 'scale-100' : 'scale-0 transition-transform'} />
                  </button>
                </div>
                
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Folder size={24} />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
                  {t.name}
                </h3>
                
                <p className="text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 min-h-[3rem] transition-colors">
                  {t.description || "No description provided."}
                </p>

                <div className="flex justify-between items-center pt-6 border-t border-gray-50 dark:border-gray-800/50 transition-colors">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full transition-colors">
                    {t._count.words} {t._count.words === 1 ? 'word' : 'words'}
                  </span>
                  <div className="text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 font-bold text-sm">
                    Open Topic <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}

        <footer className="mt-24 text-center text-gray-300 dark:text-gray-700 text-sm font-medium transition-colors">
          <p>© 2024 VocaVault • KEEP GROWING YOUR LEXICON</p>
        </footer>
      </div>

      {showForm && <TopicForm onClose={() => setShowForm(false)} onSuccess={fetchTopics} />}
    </main>
  );
}
