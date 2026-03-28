"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, Volume2, Pencil, Trash2, ArrowUpDown, ArrowLeft, Book } from "lucide-react";
import Link from "next/link";
import WordForm from "@/components/WordForm";
import ThemeToggle from "@/components/ThemeToggle";
import { speak } from "@/lib/speech";

interface Word {
  id: string;
  word: string;
  definition: string;
  example: string | null;
  topicId: string;
  createdAt: string;
}

export default function DictionaryPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "alphabetical">("newest");
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchWords = async () => {
    try {
      const response = await fetch("/api/words");
      const data = await response.json();
      if (response.ok) {
        setWords(data);
      }
    } catch (error) {
      console.error("Error fetching words:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const deleteWord = async (wordId: string) => {
    if (!confirm("Delete this word?")) return;
    try {
      const response = await fetch(`/api/words/${wordId}`, { method: "DELETE" });
      if (response.ok) {
        fetchWords();
      }
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const filteredWords = words
    .filter((w) => 
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
      w.definition.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "alphabetical") {
        return a.word.localeCompare(b.word);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 dark:text-white transition-colors">Loading your dictionary...</div>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 md:p-24 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4 transition-colors">Dictionary</h1>
              <p className="text-gray-500 dark:text-gray-400 text-xl max-w-xl leading-relaxed transition-colors">
                Browse all your registered words in one place.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search words..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                />
              </div>
              <button
                onClick={() => setSortBy(sortBy === "newest" ? "alphabetical" : "newest")}
                className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 px-6 py-3 rounded-2xl transition-all shadow-sm font-semibold"
              >
                <ArrowUpDown size={20} />
                {sortBy === "newest" ? "Newest First" : "Alphabetical"}
              </button>
            </div>
          </div>
        </header>

        {filteredWords.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors">
            <Book className="mx-auto text-gray-200 dark:text-gray-700 mb-6" size={64} />
            <p className="text-gray-400 dark:text-gray-500 text-lg mb-6 font-medium">
              {searchTerm ? "No words found matching your search." : "No words in your dictionary yet."}
            </p>
            {!searchTerm && (
              <Link
                href="/"
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-colors"
              >
                Go to topics to add words
              </Link>
            )}
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWords.map((w) => (
              <div
                key={w.id}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all group relative flex flex-col"
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
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors flex-grow">{w.definition}</p>
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

      {showForm && editingWord && (
        <WordForm 
          topicId={editingWord.topicId} 
          initialData={editingWord}
          onClose={() => {
            setShowForm(false);
            setEditingWord(null);
          }} 
          onSuccess={fetchWords} 
        />
      )}
    </main>
  );
}
