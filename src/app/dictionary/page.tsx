"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, Volume2, Pencil, Trash2, ArrowUpDown, ArrowLeft, Book, Folder } from "lucide-react";
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
  topic: {
    name: string;
  };
}

interface GroupedWord {
  word: string;
  definitions: {
    id: string;
    definition: string;
    example: string | null;
    topicName: string;
    topicId: string;
    createdAt: string;
    fullData: Word;
  }[];
}

export default function DictionaryPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "alphabetical">("alphabetical");
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

  // Grouping logic
  const groupWords = (wordsList: Word[]) => {
    const groups: { [key: string]: GroupedWord } = {};
    
    wordsList.forEach(w => {
      const key = w.word.toLowerCase().trim();
      if (!groups[key]) {
        groups[key] = {
          word: w.word,
          definitions: []
        };
      }
      groups[key].definitions.push({
        id: w.id,
        definition: w.definition,
        example: w.example,
        topicName: w.topic.name,
        topicId: w.topicId,
        createdAt: w.createdAt,
        fullData: w
      });
    });

    return Object.values(groups);
  };

  const groupedWords = groupWords(words)
    .filter((g) => 
      g.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
      g.definitions.some(d => d.definition.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "alphabetical") {
        return a.word.localeCompare(b.word);
      }
      // For newest, use the most recent definition's date in the group
      const latestA = Math.max(...a.definitions.map(d => new Date(d.createdAt).getTime()));
      const latestB = Math.max(...b.definitions.map(d => new Date(d.createdAt).getTime()));
      return latestB - latestA;
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
                {words.length} words found. Duplicates are merged for better clarity.
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
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white font-medium"
                />
              </div>
              <button
                onClick={() => setSortBy(sortBy === "newest" ? "alphabetical" : "newest")}
                className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 px-6 py-3 rounded-2xl transition-all shadow-sm font-semibold whitespace-nowrap"
              >
                <ArrowUpDown size={20} />
                {sortBy === "newest" ? "Newest First" : "Alphabetical"}
              </button>
            </div>
          </div>
        </header>

        {groupedWords.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors">
            <Book className="mx-auto text-gray-200 dark:text-gray-700 mb-6" size={64} />
            <p className="text-gray-400 dark:text-gray-500 text-lg mb-6 font-medium">
              {searchTerm ? "No words found matching your search." : "No words in your dictionary yet."}
            </p>
          </div>
        ) : (
          <section className="space-y-6">
            {groupedWords.map((group) => (
              <div
                key={group.word}
                className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                      {group.word}
                    </h2>
                    <button 
                      onClick={() => speak(group.word)}
                      className="text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 p-2 transition-all bg-gray-50 dark:bg-gray-800 rounded-2xl"
                      title="Listen to pronunciation"
                    >
                      <Volume2 size={24} />
                    </button>
                    {group.definitions.length > 1 && (
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                        {group.definitions.length} Entries
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {group.definitions.map((d, idx) => (
                    <div 
                      key={d.id} 
                      className={`relative p-6 rounded-3xl border transition-all ${
                        group.definitions.length === 1 
                        ? 'border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 md:col-span-2' 
                        : 'border-gray-100 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-900/50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <Link 
                          href={`/topic/${d.topicId}`}
                          className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
                        >
                          <Folder size={14} />
                          {d.topicName}
                        </Link>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => {
                              setEditingWord(d.fullData);
                              setShowForm(true);
                            }}
                            className="text-gray-400 hover:text-blue-500 p-2"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => deleteWord(d.id)}
                            className="text-gray-400 hover:text-red-500 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                        {d.definition}
                      </p>

                      {d.example && (
                        <p className="text-sm italic text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-50 dark:border-gray-800/50">
                          "{d.example}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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
