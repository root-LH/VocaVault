"use client";

import { useState, useRef } from "react";
import { X, CheckCircle2 } from "lucide-react";

interface WordFormProps {
  topicId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WordForm({ topicId, onClose, onSuccess }: WordFormProps) {
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const wordInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/topics/${topicId}/words`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, definition, example }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add 10 EXP for adding a word
        await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expToAdd: 10, wordAdded: true }),
        });
        
        // Reset form for next word
        setWord("");
        setDefinition("");
        setExample("");
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
        
        onSuccess();
        wordInputRef.current?.focus();
      } else {
        alert(`Failed to save: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to add word", error);
      alert("Network error or server is down.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Word</h2>
          {justAdded && (
            <span className="flex items-center text-green-600 text-sm font-medium animate-bounce">
              <CheckCircle2 size={16} className="mr-1" /> Added!
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Word</label>
            <input
              ref={wordInputRef}
              required
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="e.g. Resilient"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Definition</label>
            <textarea
              required
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 min-h-[100px]"
              placeholder="What does it mean?"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Example (Optional)</label>
            <input
              type="text"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="Use it in a sentence"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl mt-4"
          >
            {loading ? "Adding..." : "Save to Vault"}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-2">
            Tip: Press Enter to save and add another word.
          </p>
        </form>
      </div>
    </div>
  );
}
