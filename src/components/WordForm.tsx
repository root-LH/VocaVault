"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check } from "lucide-react";

interface WordFormProps {
  topicId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: string;
    word: string;
    definition: string;
    example: string | null;
  };
}

export default function WordForm({ topicId, onClose, onSuccess, initialData }: WordFormProps) {
  const [word, setWord] = useState(initialData?.word || "");
  const [definition, setDefinition] = useState(initialData?.definition || "");
  const [example, setExample] = useState(initialData?.example || "");
  const [loading, setLoading] = useState(false);
  const [keepAdding, setKeepAdding] = useState(false);
  
  const wordInputRef = useRef<HTMLInputElement>(null);

  // Initialize keepAdding from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("keepAddingWords");
    if (saved === "true") {
      setKeepAdding(true);
    }
    
    // Auto-focus on mount
    if (wordInputRef.current) {
      wordInputRef.current.focus();
    }
  }, []);

  // Update localStorage when keepAdding changes
  const handleKeepAddingToggle = (checked: boolean) => {
    setKeepAdding(checked);
    localStorage.setItem("keepAddingWords", String(checked));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEdit = !!initialData;
    const url = isEdit ? `/api/words/${initialData.id}` : `/api/topics/${topicId}/words`;
    const method = isEdit ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, definition, example }),
      });

      const data = await response.json();

      if (response.ok) {
        if (!isEdit) {
          // Add 10 EXP only for adding a new word
          await fetch("/api/stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expToAdd: 10, wordAdded: true }),
          });
        }
        
        onSuccess();
        
        if (keepAdding && !isEdit) {
          // Reset form but keep it open
          setWord("");
          setDefinition("");
          setExample("");
          wordInputRef.current?.focus();
        } else {
          onClose();
        }
      } else {
        alert(`Failed to save: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to save word", error);
      alert("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative border border-white/20 dark:border-gray-800 transition-colors animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-black mb-8 text-gray-900 dark:text-white tracking-tight">
          {initialData ? "Edit Word" : "New Word"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Word</label>
            <input
              ref={wordInputRef}
              required
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
              placeholder="e.g. Resilient"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Definition</label>
            <textarea
              required
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white min-h-[120px] resize-none"
              placeholder="What does it mean?"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Example (Optional)</label>
            <input
              type="text"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
              placeholder="Use it in a sentence"
            />
          </div>

          {!initialData && (
            <div className="flex items-center space-x-3 px-1">
              <label className="relative flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={keepAdding}
                  onChange={(e) => handleKeepAddingToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center group-hover:border-blue-400">
                  <Check className={`text-white transition-all ${keepAdding ? 'scale-100' : 'scale-0'}`} size={16} strokeWidth={4} />
                </div>
                <span className="ml-3 text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                  Keep adding words
                </span>
              </label>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-5 rounded-2xl transition-all shadow-lg hover:shadow-blue-500/25 mt-4"
          >
            {loading ? "Saving..." : (initialData ? "Update Word" : "Save to Vault")}
          </button>
        </form>
      </div>
    </div>
  );
}
