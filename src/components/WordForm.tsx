"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

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
        onClose();
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative border-8 border-white">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {initialData ? "Edit Word" : "Add New Word"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Word</label>
            <input
              required
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="e.g. Resilient"
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
            {loading ? "Saving..." : (initialData ? "Update Word" : "Save to Vault")}
          </button>
        </form>
      </div>
    </div>
  );
}
