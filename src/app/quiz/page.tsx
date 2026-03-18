"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Trophy, CheckCircle2, XCircle, Layout, Check, X, ArrowLeft, BookOpen, Zap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Word {
  id: string;
  word: string;
  definition: string;
  example: string | null;
}

type QuizMode = "flashcard" | "mc-def-to-word" | "mc-word-to-def";

export default function Quiz() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topic");
  
  const [words, setWords] = useState<Word[]>([]);
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  
  const [correctWords, setCorrectWords] = useState<Word[]>([]);
  const [missedWords, setMissedWords] = useState<Word[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [expGained, setExpGained] = useState(0);

  const fetchWords = async () => {
    setLoading(true);
    setIsFinished(false);
    setQuizMode(null);
    setCurrentIndex(0);
    setCorrectWords([]);
    setMissedWords([]);
    setSelectedOptionId(null);
    setExpGained(0);
    try {
      const mode = searchParams.get("mode");
      let url = "/api/words";
      
      if (mode === "weak") {
        url = "/api/words/weak";
      } else if (topicId) {
        url = `/api/topics/${topicId}`;
      }

      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();
      
      let wordsToQuiz: Word[] = [];
      if (mode === "weak") {
        wordsToQuiz = Array.isArray(data) ? data : [];
      } else if (topicId) {
        wordsToQuiz = data.words || [];
      } else {
        wordsToQuiz = Array.isArray(data) ? data : [];
      }

      setWords(wordsToQuiz.sort(() => Math.random() - 0.5));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [topicId, searchParams.get("mode")]);

  const options = useMemo(() => {
    if (!quizMode || quizMode === "flashcard" || words.length === 0 || isFinished) return [];
    
    const correctWord = words[currentIndex];
    const others = words.filter(w => w.id !== correctWord.id);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    const selectedOthers = shuffledOthers.slice(0, 3);
    
    return [correctWord, ...selectedOthers].sort(() => Math.random() - 0.5);
  }, [quizMode, currentIndex, words, isFinished]);

  const recordResult = async (wordId: string, isCorrect: boolean) => {
    try {
      await fetch(`/api/words/${wordId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCorrect }),
      });
    } catch (error) {
      console.error("Failed to record result", error);
    }
  };

  const handleFlashcardChoice = (isCorrect: boolean) => {
    const currentWord = words[currentIndex];
    recordResult(currentWord.id, isCorrect);
    if (isCorrect) setCorrectWords(prev => [...prev, currentWord]);
    else setMissedWords(prev => [...prev, currentWord]);
    goToNext();
  };

  const handleMultipleChoice = (wordId: string) => {
    if (selectedOptionId) return;
    const correctWord = words[currentIndex];
    const isCorrect = wordId === correctWord.id;
    setSelectedOptionId(wordId);

    recordResult(correctWord.id, isCorrect);

    if (isCorrect) setCorrectWords(prev => [...prev, correctWord]);
    else setMissedWords(prev => [...prev, currentWord]);

    setTimeout(() => {
      goToNext();
      setSelectedOptionId(null);
    }, 1500);
  };

  const goToNext = () => {
    setShowDefinition(false);
    if (currentIndex === words.length - 1) {
      finishQuiz();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const finishQuiz = async () => {
    const totalCorrect = correctWords.length;
    // Multiple Choice = 15xp, Flashcard = 10xp
    const exp = totalCorrect * (quizMode === "flashcard" ? 10 : 15);
    setExpGained(exp);
    setIsFinished(true);

    try {
      await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expToAdd: exp, quizCompleted: true }),
      });
    } catch (error) {
      console.error("Failed to save stats", error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">Preparing session...</div>;
  
  if (words.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-blue-50/30">
      <p className="text-2xl font-bold text-gray-400 mb-8">No words found in this collection.</p>
      <Link href="/" className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-bold shadow-xl">Go back home</Link>
    </div>
  );

  if (!quizMode && !isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-blue-50/30">
        <Link href={topicId ? `/topic/${topicId}` : "/"} className="absolute top-8 left-8 text-blue-900 font-bold flex items-center gap-2 hover:opacity-70 bg-white px-6 py-3 rounded-2xl border border-blue-100 shadow-sm transition-all">
          <ChevronLeft size={20} /> Back
        </Link>
        <h2 className="text-4xl font-black text-blue-900 mb-2 tracking-tighter">Choose Your Mode</h2>
        <p className="text-gray-500 mb-12 font-medium">Pick the best way to practice today.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          <button onClick={() => setQuizMode("flashcard")} className="bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-white hover:border-blue-200 flex flex-col items-center group">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all"><RefreshCw size={32} /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Flashcards</h3>
            <p className="text-gray-400 text-sm text-center">Recall the meaning at your own pace.</p>
          </button>

          <button onClick={() => setQuizMode("mc-def-to-word")} className="bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-white hover:border-purple-200 flex flex-col items-center group">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all"><Layout size={32} /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Word Quiz</h3>
            <p className="text-gray-400 text-sm text-center">Look at the definition, find the word.</p>
          </button>

          <button onClick={() => setQuizMode("mc-word-to-def")} className="bg-white p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-4 border-white hover:border-orange-200 flex flex-col items-center group">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-all"><BookOpen size={32} /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Definition Quiz</h3>
            <p className="text-gray-400 text-sm text-center">Look at the word, find the definition.</p>
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-blue-50/50 p-8 md:p-24 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <header className="text-center mb-16">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500 mx-auto mb-6 animate-bounce"><Trophy size={40} /></div>
            <h2 className="text-5xl font-black text-gray-900 mb-2 tracking-tight">Session Over!</h2>
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full font-black text-lg shadow-lg mb-4">
              <Zap size={20} className="fill-current text-yellow-300" /> +{expGained} XP
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <section>
              <h3 className="flex items-center gap-2 text-green-600 font-black text-xl mb-4 uppercase tracking-wider"><CheckCircle2 size={24} /> Correct ({correctWords.length})</h3>
              <div className="space-y-3">
                {correctWords.map(w => (
                  <div key={w.id} className="bg-white p-5 rounded-2xl shadow-sm border border-green-50">
                    <h4 className="font-bold text-gray-900">{w.word}</h4>
                    <p className="text-gray-400 text-xs line-clamp-1">{w.definition}</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="flex items-center gap-2 text-red-500 font-black text-xl mb-4 uppercase tracking-wider"><XCircle size={24} /> Missed ({missedWords.length})</h3>
              <div className="space-y-3">
                {missedWords.map(w => (
                  <div key={w.id} className="bg-white p-5 rounded-2xl shadow-sm border border-red-50">
                    <h4 className="font-bold text-gray-900">{w.word}</h4>
                    <p className="text-red-400 text-xs">{w.definition}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={fetchWords} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"><RefreshCw size={20} /> Try Again</button>
            <Link href="/" className="bg-white text-gray-500 px-10 py-4 rounded-2xl font-bold border border-gray-100 hover:bg-gray-50 transition-all flex items-center gap-2"><ArrowLeft size={20} /> Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <main className="min-h-screen bg-blue-50/50 p-8 md:p-24 flex flex-col items-center">
      <header className="w-full max-w-2xl flex justify-between items-center mb-12">
        <button onClick={fetchWords} className="text-blue-900 font-bold flex items-center gap-2 hover:opacity-70 bg-white px-6 py-3 rounded-2xl border border-blue-100 shadow-sm transition-all"><ChevronLeft size={20} /> Exit</button>
        <div className="flex flex-col items-end">
          <span className="text-blue-900 font-black text-xl">{currentIndex + 1} / {words.length}</span>
          <div className="w-32 h-2 bg-blue-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} /></div>
        </div>
      </header>

      <div className="w-full max-w-2xl">
        {quizMode === "flashcard" ? (
          <>
            <div onClick={() => !showDefinition && setShowDefinition(true)} className={`bg-white rounded-[3rem] shadow-2xl p-12 min-h-[400px] flex flex-col items-center justify-center text-center transition-all border-8 border-white relative ${!showDefinition ? 'cursor-pointer hover:scale-[1.01]' : ''}`}>
              {!showDefinition ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><h2 className="text-6xl font-black text-blue-900 mb-8 tracking-tighter">{currentWord.word}</h2><div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-8 py-4 rounded-full font-bold"><Eye size={20} /> Click to reveal</div></div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-300 w-full"><p className="text-3xl font-bold text-gray-800 leading-tight mb-8">{currentWord.definition}</p>{currentWord.example && <div className="mt-8 text-blue-500 italic text-xl border-t border-blue-50 pt-8 px-6 bg-blue-50/30 rounded-3xl pb-8">"{currentWord.example}"</div>}</div>
              )}
            </div>
            <div className="mt-12">{!showDefinition ? (
              <button onClick={() => setShowDefinition(true)} className="w-full bg-blue-100 hover:bg-blue-200 text-blue-600 p-8 rounded-[2rem] font-black text-2xl transition-all">Show Answer</button>
            ) : (
              <div className="flex gap-6"><button onClick={() => handleFlashcardChoice(false)} className="flex-1 bg-white text-red-500 p-8 rounded-[2.5rem] border-4 border-red-50 font-black text-xl shadow-lg flex flex-col items-center gap-2"><XCircle size={32} /> Missed</button><button onClick={() => handleFlashcardChoice(true)} className="flex-1 bg-green-500 text-white p-8 rounded-[2.5rem] font-black text-xl shadow-xl flex flex-col items-center gap-2"><CheckCircle2 size={32} /> Correct!</button></div>
            )}</div>
          </>
        ) : (
          <div className="animate-in fade-in duration-700">
            <div className="bg-white rounded-[3rem] shadow-2xl p-10 mb-10 min-h-[250px] flex flex-col items-center justify-center text-center border-8 border-white">
              <span className="text-xs font-black text-blue-300 uppercase tracking-widest mb-4">
                {quizMode === "mc-def-to-word" ? "What word matches this definition?" : "What is the definition of this word?"}
              </span>
              <h2 className="text-4xl font-black text-gray-800 leading-tight tracking-tight">
                {quizMode === "mc-def-to-word" ? currentWord.definition : currentWord.word}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrectOption = option.id === currentWord.id;
                let buttonStyle = "bg-white text-gray-700 border-4 border-white hover:border-blue-100 shadow-sm";
                if (selectedOptionId) {
                  if (isCorrectOption) buttonStyle = "bg-green-500 text-white border-green-500 shadow-green-100 scale-[1.02]";
                  else if (isSelected) buttonStyle = "bg-red-500 text-white border-red-500 shadow-red-100";
                  else buttonStyle = "bg-white text-gray-300 border-white opacity-50";
                }
                return (
                  <button key={option.id} disabled={!!selectedOptionId} onClick={() => handleMultipleChoice(option.id)} className={`w-full p-6 rounded-[2rem] font-bold text-lg transition-all flex items-center justify-between text-left ${buttonStyle}`}>
                    <span className="max-w-[90%]">{quizMode === "mc-def-to-word" ? option.word : option.definition}</span>
                    {selectedOptionId && isCorrectOption && <Check size={24} className="flex-shrink-0" />}
                    {selectedOptionId && isSelected && !isCorrectOption && <X size={24} className="flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
