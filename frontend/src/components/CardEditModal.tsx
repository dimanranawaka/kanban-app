"use client";

import { useState, useEffect } from "react";
import { type Card } from "@/lib/kanban";

const PRIORITY_OPTIONS = [
  { value: "low",      label: "Low",      color: '#059669', bg: 'rgba(5,150,105,0.10)' },
  { value: "medium",   label: "Medium",   color: '#D97706', bg: 'rgba(217,119,6,0.10)' },
  { value: "high",     label: "High",     color: '#EA580C', bg: 'rgba(234,88,12,0.10)' },
  { value: "critical", label: "Critical", color: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleLabel = (l: string) =>
    setLabels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  const addCustomLabel = () => {
    const l = newLabel.trim().toLowerCase();
    if (l && !labels.includes(l)) setLabels(prev => [...prev, l]);
    setNewLabel("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title: title.trim() || card.title, details, dueDate: dueDate || undefined, priority, labels });
    onClose();
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box animate-slide-up" style={{ maxWidth: 520 }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>
            Edit card
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Field label="Title">
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="field-input"
              required
            />
          </Field>

          <Field label="Description">
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={3}
              placeholder="Add details…"
              className="field-input resize-none"
            />
          </Field>

          <Field label="Due Date">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="field-input"
            />
          </Field>

          <Field label="Priority">
            <div className="flex gap-2 flex-wrap">
              {PRIORITY_OPTIONS.map(opt => {
                const active = priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: active ? opt.bg : 'var(--surface-2)',
                      color: active ? opt.color : 'var(--text-2)',
                      border: active ? `1.5px solid ${opt.color}40` : '1.5px solid var(--border)',
                      boxShadow: active ? `0 0 0 2px ${opt.color}14` : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Labels">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_LABELS.map(l => {
                const active = labels.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleLabel(l)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: active ? 'var(--primary-light)' : 'var(--surface-2)',
                      color: active ? 'var(--primary)' : 'var(--text-2)',
                      border: active ? '1.5px solid rgba(59,91,219,0.25)' : '1.5px solid var(--border)',
                    }}
                  >
                    {l}
                  </button>
                );
              })}
            </div>

            {/* Custom labels */}
            {labels.filter(l => !PRESET_LABELS.includes(l)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {labels.filter(l => !PRESET_LABELS.includes(l)).map(l => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: 'rgba(124,58,237,0.08)',
                      color: '#7C3AED',
                      border: '1.5px solid rgba(124,58,237,0.22)',
                    }}
                  >
                    {l}
                    <button
                      type="button"
                      onClick={() => toggleLabel(l)}
                      className="ml-0.5 opacity-60 hover:opacity-100 text-sm leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomLabel(); } }}
                placeholder="Add custom label…"
                className="field-input flex-1 text-xs"
                style={{ padding: '7px 12px' }}
              />
              <button type="button" onClick={addCustomLabel} className="btn btn-secondary btn-sm">
                Add
              </button>
            </div>
          </Field>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</label>
      {children}
    </div>
  );
}
