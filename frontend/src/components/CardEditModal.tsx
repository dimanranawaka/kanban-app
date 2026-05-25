"use client";

import { useState, useEffect } from "react";
import { type Card } from "@/lib/kanban";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "medium", label: "Medium", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { value: "high", label: "High", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "critical", label: "Critical", color: "text-red-600 bg-red-50 border-red-200" },
];

const PRESET_LABELS = ["bug", "feature", "urgent", "design", "backend", "frontend", "docs", "test"];

type Props = {
  card: Card;
  onSave: (fields: { title?: string; details?: string; dueDate?: string; priority?: string; labels?: string[] }) => void;
  onClose: () => void;
};

export default function CardEditModal({ card, onSave, onClose }: Props) {
  const [title, setTitle] = useState(card.title);
  const [details, setDetails] = useState(card.details);
  const [dueDate, setDueDate] = useState(card.dueDate ?? "");
  const [priority, setPriority] = useState(card.priority ?? "medium");
  const [labels, setLabels] = useState<string[]>(card.labels ?? []);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleLabel = (l: string) => {
    setLabels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  };

  const addCustomLabel = () => {
    const l = newLabel.trim().toLowerCase();
    if (l && !labels.includes(l)) {
      setLabels(prev => [...prev, l]);
    }
    setNewLabel("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim() || card.title,
      details,
      dueDate: dueDate || undefined,
      priority,
      labels,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--primary-blue)] to-[var(--secondary-purple)] px-6 py-4">
          <h2 className="text-white font-bold text-lg">Edit Card</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-[var(--navy-dark)] block mb-1">Title</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-[var(--navy-dark)] block mb-1">Description</label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={3}
              placeholder="Add details..."
              className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] resize-none"
            />
          </div>

          {/* Due date */}
          <div>
            <label className="text-sm font-semibold text-[var(--navy-dark)] block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-semibold text-[var(--navy-dark)] block mb-2">Priority</label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    priority === opt.value
                      ? opt.color + " ring-2 ring-offset-1 ring-current"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-sm font-semibold text-[var(--navy-dark)] block mb-2">Labels</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_LABELS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLabel(l)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    labels.includes(l)
                      ? "bg-[var(--primary-blue)] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {labels.filter(l => !PRESET_LABELS.includes(l)).map(l => (
              <span key={l} className="inline-flex items-center gap-1 mr-1 mb-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {l}
                <button type="button" onClick={() => toggleLabel(l)} className="ml-0.5 hover:text-red-500">×</button>
              </span>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomLabel(); } }}
                placeholder="Custom label..."
                className="flex-1 rounded-lg border border-[var(--stroke)] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
              />
              <button
                type="button"
                onClick={addCustomLabel}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--stroke)] px-4 py-2 text-sm font-medium text-[var(--gray-text)] hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-gradient-to-r from-[var(--primary-blue)] to-[var(--secondary-purple)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
