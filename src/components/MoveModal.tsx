"use client";

import { useState, useEffect } from "react";
import { X, Folder, ChevronRight, ArrowUp } from "lucide-react";

interface FolderBrief {
  id: string;
  name: string;
}

interface MoveModalProps {
  onClose: () => void;
  onSuccess: () => void;
  itemId: string;
  itemType: 'folder' | 'topic';
  itemName: string;
  currentFolderId: string | null;
}

export default function MoveModal({ onClose, onSuccess, itemId, itemType, itemName, currentFolderId }: MoveModalProps) {
  const [folders, setFolders] = useState<FolderBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        // Fetch all folders to list as destinations
        const response = await fetch('/api/folders?parentId=all'); // We'll need to support this in API
        // Alternatively, just fetch all folders regardless of parent
        const res = await fetch('/api/folders/all'); 
        const data = await res.json();
        if (res.ok) {
          // Filter out the current folder itself to prevent circular reference
          setFolders(data.filter((f: FolderBrief) => itemType === 'topic' || f.id !== itemId));
        }
      } catch (error) {
        console.error("Failed to fetch folders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFolders();
  }, [itemId, itemType]);

  const handleMove = async (targetFolderId: string | null) => {
    setMoving(true);
    try {
      const url = itemType === 'folder' ? `/api/folders/${itemId}` : `/api/topics/${itemId}`;
      const body = itemType === 'folder' ? { parentId: targetFolderId } : { folderId: targetFolderId };
      
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to move item");
      }
    } catch (error) {
      alert("Network error occurred");
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative border border-white/20 dark:border-gray-800 transition-colors flex flex-col max-h-[80vh]">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">
          Move Item
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">
          Move <span className="text-blue-600 dark:text-blue-400 font-bold">{itemName}</span> to...
        </p>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-6 no-scrollbar">
          {/* Root Option */}
          <button
            disabled={currentFolderId === null || moving}
            onClick={() => handleMove(null)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all font-bold ${currentFolderId === null ? 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
          >
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-gray-500">
              <ArrowUp size={20} />
            </div>
            <span>Move to Root (/)</span>
          </button>

          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading destinations...</div>
          ) : (
            folders.map(f => (
              <button
                key={f.id}
                disabled={f.id === currentFolderId || moving}
                onClick={() => handleMove(f.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all font-bold ${f.id === currentFolderId ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 cursor-not-allowed' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
              >
                <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg text-amber-500">
                  <Folder size={20} fill="currentColor" fillOpacity={0.2} />
                </div>
                <span className="truncate">{f.name}</span>
              </button>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
