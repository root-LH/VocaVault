"use client";

import { useState, useEffect } from "react";
import { Plus, GraduationCap, Folder, Trash2, ChevronRight, Flame, BookOpen, Check, Book, FolderPlus, ArrowLeft, MoreVertical, Move } from "lucide-react";
import Link from "next/link";
import TopicForm from "@/components/TopicForm";
import FolderForm from "@/components/FolderForm";
import MoveModal from "@/components/MoveModal";
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

interface FolderData {
  id: string;
  name: string;
  parentId: string | null;
  _count: {
    topics: number;
    subFolders: number;
  };
}

interface Breadcrumb {
  id: string;
  name: string;
}

interface MoveState {
  itemId: string;
  itemType: 'folder' | 'topic';
  itemName: string;
}

export default function Home() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  
  const [reviewCount, setReviewCount] = useState(0);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [moveState, setMoveState] = useState<MoveState | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const router = useRouter();

  const fetchData = async (folderId: string | null = currentFolderId) => {
    setLoading(true);
    try {
      const parentParam = folderId ? folderId : 'null';
      const response = await fetch(`/api/folders?parentId=${parentParam}`);
      const data = await response.json();
      
      if (response.ok) {
        setFolders(data.folders || []);
        setTopics(data.topics || []);
      }

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
    fetchData();
  }, [currentFolderId]);

  const navigateToFolder = (folder: FolderData) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentFolderId(null);
      setBreadcrumbs([]);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      const target = newBreadcrumbs[newBreadcrumbs.length - 1];
      setCurrentFolderId(target.id);
      setBreadcrumbs(newBreadcrumbs);
    }
  };

  const deleteFolder = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure? This will delete all subfolders and topics inside this folder.")) return;
    try {
      const response = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete folder:", error);
    }
  };

  const deleteTopic = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure? This will delete all words in this topic.")) return;
    try {
      const response = await fetch(`/api/topics/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchData();
        setSelectedTopicIds(prev => prev.filter(selectedId => selectedId !== id));
      }
    } catch (error) {
      console.error("Failed to delete topic:", error);
    }
  };

  const toggleSelectTopic = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTopicIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleStudySelected = () => {
    if (selectedTopicIds.length === 0) return;
    router.push(`/study?topics=${selectedTopicIds.join(",")}`);
  };

  const handleQuizSelected = () => {
    if (selectedTopicIds.length === 0) return;
    router.push(`/quiz?topics=${selectedTopicIds.join(",")}`);
  };

  const openMoveModal = (e: React.MouseEvent, id: string, type: 'folder' | 'topic', name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMoveState({ itemId: id, itemType: type, itemName: name });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 md:p-24 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div className="flex-1">
            <h1 
              className="text-7xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 transition-colors cursor-pointer"
              onClick={() => navigateToBreadcrumb(-1)}
            >
              VocaVault
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-2xl font-medium transition-colors">
              Master your vocabulary with AI-powered focus.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <ThemeToggle />
            <LevelBadge />
          </div>
        </header>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button 
              onClick={() => navigateToBreadcrumb(-1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold whitespace-nowrap ${currentFolderId === null ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Root
            </button>
            {breadcrumbs.map((bc, idx) => (
              <div key={bc.id} className="flex items-center gap-2">
                <ChevronRight size={16} className="text-gray-300" />
                <button 
                  onClick={() => navigateToBreadcrumb(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold whitespace-nowrap ${idx === breadcrumbs.length - 1 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  {bc.name}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowFolderForm(true)}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-3 rounded-2xl transition-all font-bold"
            >
              <FolderPlus size={20} />
              <span className="hidden sm:inline">New Folder</span>
            </button>
            <button
              onClick={() => setShowTopicForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl transition-all shadow-lg font-bold"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">New Topic</span>
            </button>
          </div>
        </div>

        {/* Global Study/Quiz Actions */}
        <div className="flex flex-wrap gap-3 mb-12">
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
            {selectedTopicIds.length > 0 ? (
                <>
                    <button 
                        onClick={handleStudySelected}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl transition-all shadow-lg font-bold animate-in fade-in slide-in-from-right-4"
                    >
                        <BookOpen size={20} />
                        Study Selected ({selectedTopicIds.length})
                    </button>
                    <button 
                        onClick={handleQuizSelected}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl transition-all shadow-lg font-bold animate-in fade-in slide-in-from-right-4"
                    >
                        <GraduationCap size={20} />
                        Quiz Selected ({selectedTopicIds.length})
                    </button>
                    <button 
                        onClick={() => setSelectedTopicIds([])}
                        className="text-gray-500 dark:text-gray-400 font-bold px-4 py-4 hover:underline transition-colors"
                    >
                        Clear
                    </button>
                </>
            ) : (
                <>
                    <Link 
                        href="/study" 
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl transition-all font-bold shadow-lg"
                        title="Study all your words"
                    >
                        <BookOpen size={20} /> Study All
                    </Link>
                    <Link 
                        href="/study?mode=weak" 
                        className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 px-6 py-4 rounded-2xl transition-all font-bold shadow-sm"
                        title="Study words you missed"
                    >
                        <BookOpen size={20} /> Study Weak
                    </Link>
                    <Link 
                        href="/quiz?mode=weak" 
                        className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 px-6 py-4 rounded-2xl transition-all font-bold shadow-sm"
                        title="Quiz only words you missed"
                    >
                        <Flame size={20} className="fill-current" /> Weak Quiz
                    </Link>
                    <Link 
                        href="/quiz" 
                        className="flex items-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-blue-900 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 px-6 py-4 rounded-2xl transition-all font-bold shadow-sm"
                    >
                        <GraduationCap size={20} /> Full Quiz
                    </Link>
                    <Link 
                        href="/dictionary" 
                        className="flex items-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-purple-900 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 px-6 py-4 rounded-2xl transition-all font-bold shadow-sm"
                    >
                        <Book size={20} /> Dictionary
                    </Link>
                </>
            )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">Loading your Vault...</p>
          </div>
        ) : folders.length === 0 && topics.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors">
            <Folder className="mx-auto text-gray-200 dark:text-gray-700 mb-6" size={64} />
            <p className="text-gray-400 dark:text-gray-500 text-lg mb-6 font-medium">This space is empty.</p>
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setShowFolderForm(true)}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-colors"
                >
                    Create a folder
                </button>
                <span className="text-gray-300">or</span>
                <button
                    onClick={() => setShowTopicForm(true)}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-colors"
                >
                    Create a topic
                </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Folders Section */}
            {folders.length > 0 && (
              <section>
                <h2 className="text-sm uppercase tracking-widest font-black text-gray-400 dark:text-gray-600 mb-6 px-2">Folders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.map(f => (
                    <div
                      key={f.id}
                      onClick={() => navigateToFolder(f)}
                      className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-900 hover:shadow-xl hover:shadow-blue-500/5 transition-all group cursor-pointer flex items-center gap-4 relative"
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                        <button
                          onClick={(e) => openMoveModal(e, f.id, 'folder', f.name)}
                          className="text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 p-2"
                          title="Move Folder"
                        >
                          <Move size={16} />
                        </button>
                        <button
                          onClick={(e) => deleteFolder(e, f.id)}
                          className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-2"
                          title="Delete Folder"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 w-14 h-14 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <Folder size={28} fill="currentColor" fillOpacity={0.2} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{f.name}</h3>
                        <p className="text-gray-400 text-sm font-medium">
                          {f._count.subFolders} Folders • {f._count.topics} Topics
                        </p>
                      </div>
                      <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" size={20} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Topics Section */}
            {topics.length > 0 && (
              <section>
                <h2 className="text-sm uppercase tracking-widest font-black text-gray-400 dark:text-gray-600 mb-6 px-2">Topics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {topics.map((t) => (
                    <div
                      key={t.id}
                      className={`bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border transition-all group relative block ${selectedTopicIds.includes(t.id) ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-900 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10'}`}
                    >
                      <div className="absolute top-6 right-6 flex items-center gap-2">
                        <button
                          onClick={(e) => openMoveModal(e, t.id, 'topic', t.name)}
                          className="text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                          title="Move Topic"
                        >
                          <Move size={18} />
                        </button>
                        <button
                          onClick={(e) => deleteTopic(e, t.id)}
                          className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                          title="Delete Topic"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={(e) => toggleSelectTopic(e, t.id)}
                          className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${selectedTopicIds.includes(t.id) ? 'bg-blue-600 border-blue-600 text-white scale-110' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-transparent opacity-0 group-hover:opacity-100 hover:border-blue-400'}`}
                        >
                          <Check size={18} strokeWidth={3} className={selectedTopicIds.includes(t.id) ? 'scale-100' : 'scale-0 transition-transform'} />
                        </button>
                      </div>
                      
                      <Link href={`/topic/${t.id}`} className="block">
                        <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <BookOpen size={24} />
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
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <footer className="mt-24 text-center text-gray-300 dark:text-gray-700 text-sm font-medium transition-colors">
          <p>© 2024 VocaVault • KEEP GROWING YOUR LEXICON</p>
        </footer>
      </div>

      {showTopicForm && (
        <TopicForm 
          onClose={() => setShowTopicForm(false)} 
          onSuccess={fetchData} 
          folderId={currentFolderId}
        />
      )}
      {showFolderForm && (
        <FolderForm 
          onClose={() => setShowFolderForm(false)} 
          onSuccess={fetchData} 
          parentId={currentFolderId}
        />
      )}
      {moveState && (
        <MoveModal
          onClose={() => setMoveState(null)}
          onSuccess={fetchData}
          itemId={moveState.itemId}
          itemType={moveState.itemType}
          itemName={moveState.itemName}
          currentFolderId={currentFolderId}
        />
      )}
    </main>
  );
}
