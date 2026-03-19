"use client";

import { useState, useEffect } from "react";
import { Plus, GraduationCap, Folder, Trash2, ChevronRight, Flame, BookOpen } from "lucide-react";
import Link from "next/link";
import TopicForm from "@/components/TopicForm";
import LevelBadge from "@/components/LevelBadge";

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
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/topics");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setTopics(data);
      } else {
        setTopics([]);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const deleteTopic = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Are you sure? This will delete all words in this topic.")) return;
    try {
      const response = await fetch(`/api/topics/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchTopics();
      }
    } catch (error) {
      console.error("Failed to delete topic:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 md:p-24">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div className="flex-1">
            <h1 className="text-5xl font-black text-blue-900 tracking-tighter mb-2">VocaVault</h1>
            <p className="text-gray-500 text-lg font-medium">Your vocabulary growth sanctuary.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <LevelBadge />
            <div className="flex gap-2">
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
                className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 px-6 py-4 rounded-2xl transition-all shadow-sm font-bold"
                title="Study words you missed"
              >
                <BookOpen size={20} />
                Study Weak
              </Link>
              <Link 
                href="/quiz?mode=weak"
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-6 py-4 rounded-2xl transition-all shadow-sm font-bold"
                title="Quiz only words you missed"
              >
                <Flame size={20} className="fill-current" />
                Weak Quiz
              </Link>
              <Link 
                href="/quiz"
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-900 border border-blue-100 px-6 py-4 rounded-2xl transition-all shadow-sm font-bold"
              >
                <GraduationCap size={20} />
                Full Quiz
              </Link>
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
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
            <Folder className="mx-auto text-gray-200 mb-6" size={64} />
            <p className="text-gray-400 text-lg mb-6">No topics yet. Create one to start adding words!</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-600 font-bold hover:underline"
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
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative block"
              >
                <button
                  onClick={(e) => deleteTopic(e, t.id)}
                  className="absolute top-6 right-6 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                >
                  <Trash2 size={18} />
                </button>
                
                <div className="mb-4 bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Folder size={24} />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {t.name}
                </h3>
                
                <p className="text-gray-500 line-clamp-2 mb-6 min-h-[3rem]">
                  {t.description || "No description provided."}
                </p>

                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {t._count.words} {t._count.words === 1 ? 'word' : 'words'}
                  </span>
                  <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 font-bold text-sm">
                    Open Topic <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}

        <footer className="mt-24 text-center text-gray-300 text-sm font-medium">
          <p>© 2024 VocaVault • KEEP GROWING YOUR LEXICON</p>
        </footer>
      </div>

      {showForm && <TopicForm onClose={() => setShowForm(false)} onSuccess={fetchTopics} />}
    </main>
  );
}
