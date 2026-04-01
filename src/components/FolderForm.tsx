"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface FolderFormProps {
  onClose: () => void;
  onSuccess: () => void;
  parentId?: string | null;
  initialData?: {
    id: string;
    name: string;
  };
}

export default function FolderForm({ onClose, onSuccess, parentId, initialData }: FolderFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData ? `/api/folders/${initialData.id}` : "/api/folders";
      const method = initialData ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          parentId: parentId || null 
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${initialData ? 'update' : 'create'} folder`);
      }
    } catch (error) {
      alert("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative border border-white/20 dark:border-gray-800 transition-colors">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-black mb-8 text-gray-900 dark:text-white tracking-tight">
          {initialData ? "Edit Folder" : "New Folder"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-1">Folder Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
              placeholder="e.g. Languages, Science, Personal"
              autoFocus
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-5 rounded-2xl transition-all shadow-lg hover:shadow-blue-500/25 mt-4"
          >
            {loading ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Update Folder" : "Create Folder")}
          </button>
        </form>
      </div>
    </div>
  );
}
