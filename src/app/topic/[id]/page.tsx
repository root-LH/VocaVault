"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronLeft, GraduationCap, Trash2, ArrowLeft, Pencil, BookOpen, Volume2, Download, Upload, CheckSquare, Square, MoveHorizontal } from "lucide-react";
import Link from "next/link";
import WordForm from "@/components/WordForm";
import TopicForm from "@/components/TopicForm";
import ThemeToggle from "@/components/ThemeToggle";
import TransferModal from "@/components/TransferModal";
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
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const toggleWordSelection = (wordId: string) => {
    setSelectedWordIds(prev => 
      prev.includes(wordId) 
        ? prev.filter(id => id !== wordId) 
        : [...prev, wordId]
    );
  };

  const selectAllWords = () => {
    if (!topic) return;
    if (selectedWordIds.length === topic.words.length) {
      setSelectedWordIds([]);
    } else {
      setSelectedWordIds(topic.words.map(w => w.id));
    }
  };

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

              {/* Select Words Button - Moved to the end for visibility */}
              <button
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  if (isSelectMode) setSelectedWordIds([]);
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all shadow-sm font-semibold border ${
                  isSelectMode 
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg" 
                    : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {isSelectMode ? <CheckSquare size={20} /> : <Square size={20} />}
                {isSelectMode ? "Finish Selecting" : "Select Words"}
              </button>

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
          <>
            {(isSelectMode || selectedWordIds.length > 0) && (
              <div className="flex justify-between items-center mb-6 px-4 py-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 animate-in fade-in slide-in-from-top-4">
                <button 
                  onClick={selectAllWords}
                  className="text-sm font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-2"
                >
                  {selectedWordIds.length === topic.words.length ? <CheckSquare size={18} /> : <Square size={18} />}
                  {selectedWordIds.length === topic.words.length ? "Deselect All" : `Select All (${topic.words.length})`}
                </button>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  {selectedWordIds.length} words selected
                </span>
              </div>
            )}
            
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
              {topic.words.map((w) => {
                const isSelected = selectedWordIds.includes(w.id);
                return (
                  <div
                    key={w.id}
                    onClick={() => toggleWordSelection(w.id)}
                    className={`bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border transition-all group relative cursor-pointer active:scale-[0.98] ${
                      isSelected 
                        ? "border-blue-500 ring-4 ring-blue-500/10 bg-blue-50/30 dark:bg-blue-900/10" 
                        : "border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900"
                    }`}
                  >
                    <div className="absolute top-4 left-4 z-10">
                       {isSelected ? (
                         <div className="text-blue-600 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-md border-2 border-blue-500 animate-in zoom-in duration-200">
                           <CheckSquare size={22} fill="currentColor" />
                         </div>
                       ) : (
                         <div className={`p-1.5 rounded-xl border-2 transition-all ${isSelectMode ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 opacity-100' : 'border-transparent opacity-0 group-hover:opacity-100 group-hover:border-gray-200 dark:group-hover:border-gray-700'}`}>
                           <Square size={22} className="text-gray-200 dark:text-gray-700" />
                         </div>
                       )}
                    </div>
                    
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-20" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWord(w);
                          setShowForm(true);
                        }}
                        className="text-gray-400 hover:text-blue-500 p-2 transition-colors bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full shadow-sm"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWord(w.id);
                        }}
                        className="text-gray-400 hover:text-red-500 p-2 transition-colors bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-2xl font-black transition-colors break-words ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                          {w.word}
                        </h3>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(w.word);
                          }}
                          className="text-gray-300 hover:text-blue-400 p-1 transition-colors"
                        >
                          <Volume2 size={20} />
                        </button>
                      </div>
                      <p className={`leading-relaxed font-medium transition-colors ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-gray-500 dark:text-gray-400'}`}>
                        {w.definition}
                      </p>
                      {w.example && (
                        <p className={`mt-4 text-sm italic p-4 rounded-2xl border transition-colors ${
                          isSelected 
                            ? 'bg-blue-100/30 dark:bg-blue-900/20 border-blue-200/50 text-blue-700 dark:text-blue-300' 
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-500'
                        }`}>
                          "{w.example}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>

      {/* Floating Action Bar for Selection */}
      {selectedWordIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-[2rem] px-8 py-4 flex items-center gap-8 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
            <div className="flex flex-col">
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Selected</span>
              <span className="text-xl font-black text-gray-900 dark:text-white leading-none">{selectedWordIds.length} <span className="text-sm font-medium text-gray-500">items</span></span>
            </div>
            
            <div className="h-10 w-px bg-gray-100 dark:bg-gray-800 mx-2" />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all"
              >
                <MoveHorizontal size={20} />
                Transfer / Copy
              </button>
              <button
                onClick={() => {
                  setSelectedWordIds([]);
                  setIsSelectMode(false);
                }}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-2xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
      {showTransferModal && (
        <TransferModal
          wordIds={selectedWordIds}
          currentTopicId={topic.id}
          onClose={() => setShowTransferModal(false)}
          onSuccess={(msg) => {
            alert(msg);
            setSelectedWordIds([]);
            setIsSelectMode(false);
            fetchTopic();
          }}
        />
      )}
    </main>
  );
}
