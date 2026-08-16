"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, RefreshCw, Trophy, CheckCircle2, XCircle, Layout, Check, X, ArrowLeft, BookOpen, Zap, Eye, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Word {
  id: string;
  word: string;
  definition: string;
  example: string | null;
}

type QuizMode = "flashcard" | "mc-def-to-word" | "mc-word-to-def";

import { Suspense } from "react";

function QuizContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topic");
  const topicsParam = searchParams.get("topics");
  
  const [words, setWords] = useState<Word[]>([]);
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null);
  const [quizLimit, setQuizLimit] = useState<number | "all">("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  
  const [correctWords, setCorrectWords] = useState<Word[]>([]);
  const [missedWords, setMissedWords] = useState<Word[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [expGained, setExpGained] = useState(0);

  const [sourceTopicName, setSourceTopicName] = useState<string>("");
  const [selectedMissedIds, setSelectedMissedIds] = useState<string[]>([]);
  const [newTopicName, setNewTopicName] = useState<string>("");
  const [isSavingTopic, setIsSavingTopic] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [createdTopicId, setCreatedTopicId] = useState<string | null>(null);

  const fetchWords = async () => {
    setLoading(true);
    setIsFinished(false);
    setQuizMode(null);
    setQuizLimit("all");
    setCurrentIndex(0);
    setCorrectWords([]);
    setMissedWords([]);
    setSelectedOptionId(null);
    setExpGained(0);
    setNewTopicName("");
    setIsSavingTopic(false);
    setSaveSuccess(false);
    setCreatedTopicId(null);
    setSelectedMissedIds([]);
    try {
      const mode = searchParams.get("mode");
      const folderParam = searchParams.get("folder");
      let url = "/api/words";
      
      const queryParams = new URLSearchParams();
      if (folderParam) {
        queryParams.set("folder", folderParam);
      }
      if (mode === "weak") {
        url = "/api/words/weak";
      } else if (mode === "review") {
        url = "/api/words/review";
      } else if (topicsParam) {
        url = "/api/words";
        queryParams.set("topics", topicsParam);
      } else if (topicId) {
        url = `/api/topics/${topicId}`;
      }

      const queryString = queryParams.toString();
      if (queryString && !topicId) {
        url += `?${queryString}`;
      }

      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();
      
      let wordsToQuiz: Word[] = [];
      if (mode === "weak") {
        wordsToQuiz = Array.isArray(data) ? data : [];
        if (folderParam) {
          try {
            const folderRes = await fetch(`/api/folders/${folderParam}`);
            const folderData = await folderRes.json();
            setSourceTopicName(`${folderData.name} - Weak Words`);
          } catch {
            setSourceTopicName("Folder Weak Words");
          }
        } else {
          setSourceTopicName("Weak Words");
        }
      } else if (mode === "review") {
        wordsToQuiz = Array.isArray(data) ? data : [];
        if (folderParam) {
          try {
            const folderRes = await fetch(`/api/folders/${folderParam}`);
            const folderData = await folderRes.json();
            setSourceTopicName(`${folderData.name} - Review Session`);
          } catch {
            setSourceTopicName("Folder Review Session");
          }
        } else {
          setSourceTopicName("Review Session");
        }
      } else if (topicsParam) {
        wordsToQuiz = Array.isArray(data) ? data : [];
        setSourceTopicName("Multiple Topics");
      } else if (topicId) {
        wordsToQuiz = data.words || [];
        setSourceTopicName(data.name || "Topic");
      } else {
        wordsToQuiz = Array.isArray(data) ? data : [];
        if (folderParam) {
          try {
            const folderRes = await fetch(`/api/folders/${folderParam}`);
            const folderData = await folderRes.json();
            setSourceTopicName(`${folderData.name} Folder`);
          } catch {
            setSourceTopicName("Folder Session");
          }
        } else {
          setSourceTopicName("All Words");
        }
      }

      setWords(wordsToQuiz.sort(() => Math.random() - 0.5));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const finalWords = useMemo(() => {
    if (quizLimit === "all") return words;
    return words.slice(0, quizLimit);
  }, [words, quizLimit]);

  const folderParam = searchParams.get("folder");
  useEffect(() => {
    fetchWords();
  }, [topicId, searchParams.get("mode"), topicsParam, folderParam]);

  const options = useMemo(() => {
    if (!quizMode || quizMode === "flashcard" || finalWords.length === 0 || isFinished) return [];
    
    const correctWord = finalWords[currentIndex];
    
    // 같은 단어명을 가진 다른 토픽의 단어들도 '정답'으로 간주하기 위해 필터링에서 제외
    const currentWordName = correctWord.word.toLowerCase().trim();
    
    // 오답 후보군: 단어명이 다른 것들만 추출
    const wrongOptions = words.filter(w => w.word.toLowerCase().trim() !== currentWordName);
    const shuffledWrong = [...wrongOptions].sort(() => Math.random() - 0.5);
    const selectedWrong = shuffledWrong.slice(0, 3);
    
    // 최종 옵션은 현재 문제 단어 + 3개의 다른 단어
    return [correctWord, ...selectedWrong].sort(() => Math.random() - 0.5);
  }, [quizMode, currentIndex, finalWords, words, isFinished]);

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
    const currentWord = finalWords[currentIndex];
    recordResult(currentWord.id, isCorrect);
    
    let nextCorrect = correctWords;
    let nextMissed = missedWords;
    if (isCorrect) {
      nextCorrect = [...correctWords, currentWord];
      setCorrectWords(nextCorrect);
    } else {
      nextMissed = [...missedWords, currentWord];
      setMissedWords(nextMissed);
    }
    goToNext(nextCorrect, nextMissed);
  };

  const handleMultipleChoice = (wordId: string) => {
    if (selectedOptionId) return;
    const correctWord = finalWords[currentIndex];
    const selectedOption = options.find(o => o.id === wordId);
    
    // 중요: 단어명이 같으면 ID가 달라도 정답으로 인정 (다른 토픽의 같은 단어 처리)
    const isCorrect = selectedOption?.word.toLowerCase().trim() === correctWord.word.toLowerCase().trim();
    
    setSelectedOptionId(wordId);

    recordResult(correctWord.id, isCorrect);

    let nextCorrect = correctWords;
    let nextMissed = missedWords;
    if (isCorrect) {
      nextCorrect = [...correctWords, correctWord];
      setCorrectWords(nextCorrect);
    } else {
      nextMissed = [...missedWords, correctWord];
      setMissedWords(nextMissed);
    }

    setTimeout(() => {
      goToNext(nextCorrect, nextMissed);
      setSelectedOptionId(null);
    }, 1500);
  };

  const goToNext = (updatedCorrect = correctWords, updatedMissed = missedWords) => {
    setShowDefinition(false);
    if (currentIndex === finalWords.length - 1) {
      finishQuiz(updatedCorrect, updatedMissed);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const finishQuiz = async (finalCorrect: Word[], finalMissed: Word[]) => {
    const totalCorrect = finalCorrect.length;
    const exp = totalCorrect * (quizMode === "flashcard" ? 10 : 15);
    setExpGained(exp);
    setIsFinished(true);

    setSelectedMissedIds(finalMissed.map(w => w.id));
    const dateStr = new Date().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    setNewTopicName(`Incorrect Words (${sourceTopicName || "Quiz"} - ${dateStr})`);

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

  const toggleWordSelection = (wordId: string) => {
    setSelectedMissedIds(prev =>
      prev.includes(wordId)
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };

  const handleSaveToNewTopic = async () => {
    if (selectedMissedIds.length === 0 || !newTopicName.trim() || isSavingTopic) return;
    setIsSavingTopic(true);
    setSaveSuccess(false);
    setCreatedTopicId(null);
    try {
      const selectedWords = missedWords.filter(w => selectedMissedIds.includes(w.id));
      
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTopicName.trim(),
          description: `Created from missed words during quiz of ${sourceTopicName || "quiz session"}.`,
          words: selectedWords.map(w => ({
            word: w.word,
            definition: w.definition,
            example: w.example,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save topic");
      }

      const data = await response.json();
      setCreatedTopicId(data.id);
      setSaveSuccess(true);
    } catch (error) {
      console.error("Failed to save topic with words", error);
    } finally {
      setIsSavingTopic(false);
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
        
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black text-blue-900 mb-2 tracking-tighter">Choose Your Mode</h2>
          <p className="text-gray-500 font-medium">Pick the best way to practice today.</p>
        </div>

        <div className="mb-12 bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-50 w-full max-w-2xl text-center">
          <h3 className="text-sm font-black text-blue-300 uppercase tracking-widest mb-6">How many words to practice?</h3>
          
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 w-full px-4">
              <input
                type="range"
                min="1"
                max={words.length}
                value={quizLimit === "all" ? words.length : quizLimit}
                onChange={(e) => setQuizLimit(parseInt(e.target.value))}
                className="flex-1 h-3 bg-blue-100 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex items-center gap-2 bg-blue-50 px-5 py-2 rounded-2xl border border-blue-100">
                <input
                  type="number"
                  min="1"
                  max={words.length}
                  value={quizLimit === "all" ? words.length : quizLimit}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setQuizLimit(Math.min(Math.max(1, val), words.length));
                  }}
                  className="w-16 bg-transparent text-center font-black text-blue-900 outline-none"
                />
                <span className="text-blue-300 font-bold">/ {words.length}</span>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm font-medium">
              You will practice <span className="text-blue-600 font-bold">{quizLimit === "all" ? words.length : quizLimit}</span> random words from this collection.
            </p>
          </div>
        </div>
        
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2 text-red-500 font-black text-xl uppercase tracking-wider"><XCircle size={24} /> Missed ({missedWords.length})</h3>
                {missedWords.length > 0 && (
                  <div className="flex gap-3 text-xs bg-white/60 backdrop-blur-sm border border-red-100 rounded-xl px-3 py-1.5 shadow-sm">
                    <button 
                      onClick={() => setSelectedMissedIds(missedWords.map(w => w.id))}
                      className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      onClick={() => setSelectedMissedIds([])}
                      className="text-gray-500 font-bold hover:text-gray-700 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {missedWords.map(w => {
                  const isSelected = selectedMissedIds.includes(w.id);
                  return (
                    <div 
                      key={w.id} 
                      onClick={() => toggleWordSelection(w.id)}
                      className={`p-5 rounded-2xl shadow-sm border transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected 
                          ? "bg-red-50/20 border-red-200 scale-[1.01]" 
                          : "bg-white border-red-50 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent div click
                        className="mt-1 rounded text-red-500 focus:ring-red-400 h-4 w-4 accent-red-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{w.word}</h4>
                        <p className="text-red-400 text-xs">{w.definition}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {missedWords.length > 0 && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-50 w-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                  <Save size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">틀린 단어 저장하기</h3>
                  <p className="text-gray-400 text-sm">선택한 틀린 단어들로 새로운 단어장을 만듭니다.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label htmlFor="newTopicName" className="block text-xs font-black text-blue-900 uppercase tracking-widest mb-2 ml-2">
                    단어장 이름
                  </label>
                  <input
                    type="text"
                    id="newTopicName"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="단어장 이름을 입력하세요..."
                    className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-6 py-4 text-gray-900 font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <button
                  onClick={handleSaveToNewTopic}
                  disabled={selectedMissedIds.length === 0 || !newTopicName.trim() || isSavingTopic}
                  className="w-full md:w-auto bg-blue-600 disabled:bg-gray-200 text-white disabled:text-gray-400 px-8 py-4 rounded-2xl font-bold shadow-lg disabled:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center gap-2 h-[58px]"
                >
                  {isSavingTopic ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      저장 중...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check size={20} />
                      저장 완료!
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {selectedMissedIds.length}개 단어 저장
                    </>
                  )}
                </button>
              </div>

              {saveSuccess && createdTopicId && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex justify-between items-center text-green-700 font-medium text-sm animate-in fade-in duration-300">
                  <span>새 단어장 "{newTopicName}"이 생성되었습니다!</span>
                  <Link href={`/topic/${createdTopicId}`} className="text-green-700 font-bold underline hover:text-green-800 flex items-center gap-1">
                    단어장으로 이동 <ChevronLeft className="rotate-180" size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button onClick={fetchWords} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"><RefreshCw size={20} /> Try Again</button>
            <Link href="/" className="bg-white text-gray-500 px-10 py-4 rounded-2xl font-bold border border-gray-100 hover:bg-gray-50 transition-all flex items-center gap-2"><ArrowLeft size={20} /> Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = finalWords[currentIndex];

  return (
    <main className="min-h-screen bg-blue-50/50 p-8 md:p-24 flex flex-col items-center">
      <header className="w-full max-w-2xl flex justify-between items-center mb-12">
        <button onClick={fetchWords} className="text-blue-900 font-bold flex items-center gap-2 hover:opacity-70 bg-white px-6 py-3 rounded-2xl border border-blue-100 shadow-sm transition-all"><ChevronLeft size={20} /> Exit</button>
        <div className="flex flex-col items-end">
          <span className="text-blue-900 font-black text-xl">{currentIndex + 1} / {finalWords.length}</span>
          <div className="w-32 h-2 bg-blue-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentIndex + 1) / finalWords.length) * 100}%` }} /></div>
        </div>
      </header>

      <div className="w-full max-w-2xl">
        {quizMode === "flashcard" ? (
          <>
            <div onClick={() => setShowDefinition(!showDefinition)} className="bg-white rounded-[3rem] shadow-2xl p-12 min-h-[400px] flex flex-col items-center justify-center text-center transition-all border-8 border-white relative cursor-pointer hover:scale-[1.01]">
              {!showDefinition ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><h2 className="text-6xl font-black text-blue-900 mb-8 tracking-tighter">{currentWord.word}</h2><div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-8 py-4 rounded-full font-bold"><Eye size={20} /> Click to reveal</div></div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-300 w-full"><h3 className="text-xl font-bold text-blue-300 mb-6 uppercase tracking-widest">{currentWord.word}</h3><p className="text-3xl font-bold text-gray-800 leading-tight mb-8">{currentWord.definition}</p>{currentWord.example && <div className="mt-8 text-blue-500 text-xl border-t border-blue-50 pt-8 px-6 bg-blue-50/30 rounded-3xl pb-8">"{currentWord.example}"</div>}<div className="mt-6 inline-flex items-center gap-2 text-gray-400 text-sm font-medium"><RefreshCw size={14} /> Click to flip back</div></div>
              )}
            </div>
            <div className="mt-12">{!showDefinition ? (
              <button onClick={() => setShowDefinition(true)} className="w-full bg-blue-100 hover:bg-blue-200 text-blue-600 p-8 rounded-[2rem] font-black text-2xl transition-all">Show Answer</button>
            ) : (
              <div className="flex gap-6"><button onClick={() => handleFlashcardChoice(false)} className="flex-1 bg-white text-red-500 p-8 rounded-[2.5rem] border-4 border-red-50 font-black text-xl shadow-lg flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform"><XCircle size={32} /> Missed</button><button onClick={() => handleFlashcardChoice(true)} className="flex-1 bg-green-500 text-white p-8 rounded-[2.5rem] font-black text-xl shadow-xl flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform"><CheckCircle2 size={32} /> Correct!</button></div>
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
                // 중요: 단어명이 같으면 정답 옵션으로 간주
                const isCorrectOption = option.word.toLowerCase().trim() === currentWord.word.toLowerCase().trim();
                
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

export default function Quiz() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-blue-600">Loading quiz...</div>}>
      <QuizContent />
    </Suspense>
  );
}
