"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronLeft, GraduationCap, Trash2, ArrowLeft, Pencil, BookOpen, Volume2, Download, Upload } from "lucide-react";
import Link from "next/link";
import WordForm from "@/components/WordForm";
import TopicForm from "@/components/TopicForm";
import ThemeToggle from "@/components/ThemeToggle";
import { speak } from "@/lib/speech";
import { downloadCSV, parseCSV } from "@/lib/csv";

interface Word {
  id: string;
  word: string;
  definition: string;
  example: string | null;
}

interface Topic {
  id: string;
  name: string;
  description: string | null;
  words: Word[];
}

export default function TopicDetail({ params }: { params: { id: string } }) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);

  const handleExport = () => {
    if (!topic || topic.words.length === 0) return;
    downloadCSV(topic.words, `${topic.name}_words.csv`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !topic) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const words = parseCSV(text);
      
      if (words.length === 0) {
        alert("No valid words found in CSV. Please ensure the CSV has a header row.");
        return;
      }

      try {
        const res = await fetch(`/api/topics/${topic.id}/words/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words }),
        });

        if (res.ok) {
          const data = await res.json();
          alert(`${data.count} words imported!`);
          fetchTopic();
        } else {
          const data = await res.json();
          alert(`Failed to import: ${data.error || "Unknown error"}${data.details ? `\n\nDetails: ${data.details}` : ""}`);
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("An error occurred during import.");
      }
    };
    reader.readAsText(file);
    // 같은 파일을 다시 선택할 수 있도록 초기화
    e.target.value = "";
  };

  const fetchTopic = async () => {
    try {
      const response = await fetch(`/api/topics/${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setTopic(data);
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

  const deleteWord = async (wordId: string) => {
    if (!confirm("Delete this word?")) return;
    try {
      const response = await fetch(`/api/words/${wordId}`, { method: "DELETE" });
      if (response.ok) {
        fetchTopic();
      }
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 dark:text-white transition-colors">Loading topic...</div>;
  if (!topic) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 dark:text-white transition-colors">Topic not found.</div>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 md:p-24 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2 font-bold transition-all">
              <ArrowLeft size={20} />
              Back to Topics
            </Link>
            <ThemeToggle />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">{topic.name}</h1>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full transition-colors mt-1">
                  {topic.words.length} {topic.words.length === 1 ? 'word' : 'words'}
                </span>
                <button
                  onClick={() => setShowTopicForm(true)}
                  className="text-gray-400 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2"
                  title="Edit topic"
                >
                  <Pencil size={24} />
                </button>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xl max-w-xl leading-relaxed transition-colors">
                {topic.description || "Collection of specialized vocabulary."}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 px-5 py-3 rounded-2xl transition-all shadow-sm font-semibold"
                title="Export words to CSV"
              >
                <Download size={20} />
                Export
              </button>
              
              <label className="flex items-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 px-5 py-3 rounded-2xl transition-all shadow-sm font-semibold cursor-pointer">
                <Upload size={20} />
                Import
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleImport}
                />
              </label>

              <Link 
                href={`/topic/${topic.id}/study`}
                className="flex items-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-emerald-900 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 px-6 py-3 rounded-2xl transition-all shadow-sm font-semibold transition-colors"
              >
                <BookOpen size={20} />
                Study
              </Link>
              <Link 
                href={`/quiz?topic=${topic.id}`}
                className="flex items-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-blue-900 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 px-6 py-3 rounded-2xl transition-all shadow-sm font-semibold transition-colors"
              >
                <GraduationCap size={20} />
                Quiz
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl transition-all shadow-lg hover:shadow-xl font-bold"
              >
                <Plus size={20} />
                Add Word
              </button>
            </div>
          </div>
        </header>

        {topic.words.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors">
            <p className="text-gray-400 dark:text-gray-500 text-lg mb-8 transition-colors">This topic is empty. Add your first word to start learning!</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Add First Word
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topic.words.map((w) => (
              <div
                key={w.id}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all group relative"
              >
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => {
                      setEditingWord(w);
                      setShowForm(true);
                    }}
                    className="text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 p-2 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => deleteWord(w.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2 pr-20">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words">
                    {w.word}
                  </h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(w.word);
                    }}
                    className="text-gray-300 dark:text-gray-600 hover:text-blue-400 dark:hover:text-blue-300 p-1 transition-colors"
                    title="Listen to pronunciation"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">{w.definition}</p>
                {w.example && (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50 transition-colors">
                    "{w.example}"
                  </p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>

      {showForm && (
        <WordForm 
          topicId={topic.id} 
          initialData={editingWord || undefined}
          onClose={() => {
            setShowForm(false);
            setEditingWord(null);
          }} 
          onSuccess={fetchTopic} 
        />
      )}
      {showTopicForm && (
        <TopicForm
          initialData={{
            id: topic.id,
            name: topic.name,
            description: topic.description,
          }}
          onClose={() => setShowTopicForm(false)}
          onSuccess={fetchTopic}
        />
      )}
    </main>
  );
}
