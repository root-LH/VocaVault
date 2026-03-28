"use client";

import { useState, useEffect } from "react";
import { X, FolderPlus, Move, Copy, Check } from "lucide-react";

interface Topic {
  id: string;
  name: string;
}

interface TransferModalProps {
  wordIds: string[];
  currentTopicId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function TransferModal({ wordIds, currentTopicId, onClose, onSuccess }: TransferModalProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"move" | "copy">("move");
  const [newTopicName, setNewTopicName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch("/api/topics");
        const data = await res.json();
        // 현재 토픽은 목록에서 제외 (이동 시에는 의미가 없으므로)
        setTopics(data.filter((t: Topic) => t.id !== currentTopicId));
      } catch (err) {
        console.error("Failed to fetch topics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [currentTopicId]);

  const handleTransfer = async () => {
    let targetId = selectedTopicId;

    // 새 토픽을 만드는 경우
    if (isCreatingNew) {
      if (!newTopicName.trim()) {
        alert("Please enter a name for the new topic");
        return;
      }
      try {
        const createRes = await fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newTopicName, description: `Created from selection` }),
        });
        const newTopic = await createRes.json();
        if (createRes.ok) {
          targetId = newTopic.id;
        } else {
          throw new Error("Failed to create topic");
        }
      } catch (err) {
        alert("Error creating new topic");
        return;
      }
    }

    if (!targetId) {
      alert("Please select a target topic");
      return;
    }

    try {
      const res = await fetch("/api/words/bulk/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordIds, targetTopicId: targetId, mode }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data.message);
        onClose();
      } else {
        alert("Transfer failed");
      }
    } catch (err) {
      alert("An error occurred during transfer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight italic">Transfer Words</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
              <X size={24} />
            </button>
          </div>

          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
            Moving {wordIds.length} words to another topic.
          </p>

          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-8">
            <button
              onClick={() => setMode("move")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                mode === "move" ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Move size={18} />
              Move
            </button>
            <button
              onClick={() => setMode("copy")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                mode === "copy" ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Copy size={18} />
              Copy
            </button>
          </div>

          <div className="space-y-6">
            {!isCreatingNew ? (
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Topic</label>
                {loading ? (
                  <div className="h-14 bg-gray-50 dark:bg-gray-800 animate-pulse rounded-2xl" />
                ) : (
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Choose a topic...</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  <FolderPlus size={18} />
                  Or create a new topic...
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">New Topic Name</label>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="e.g., Important Words"
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  autoFocus
                />
                <button
                  onClick={() => setIsCreatingNew(false)}
                  className="mt-4 text-gray-500 font-bold hover:underline"
                >
                  Back to selection
                </button>
              </div>
            )}
          </div>

          <div className="mt-12 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl font-bold bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={(!selectedTopicId && !isCreatingNew) || (isCreatingNew && !newTopicName)}
              className="flex-1 py-4 px-6 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Confirm {mode === "move" ? "Move" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
