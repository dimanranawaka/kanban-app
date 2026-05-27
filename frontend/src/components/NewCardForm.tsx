import { useState, type FormEvent } from "react";

type NewCardFormProps = { onAdd: (title: string, details: string) => void };

export const NewCardForm = ({ onAdd }: NewCardFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), details.trim());
    setTitle(""); setDetails(""); setIsOpen(false);
  };

  const handleCancel = () => { setIsOpen(false); setTitle(""); setDetails(""); };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 w-full rounded-lg px-2 py-2 text-xs font-semibold transition-colors"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--primary)';
          e.currentTarget.style.background = 'var(--primary-light)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-3)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 animate-fade-up">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Card title…"
        className="field-input text-[13px]"
        style={{ padding: '8px 12px' }}
        required
        autoFocus
      />
      <textarea
        value={details}
        onChange={e => setDetails(e.target.value)}
        placeholder="Details (optional)…"
        rows={2}
        className="field-input resize-none text-[12px]"
        style={{ padding: '8px 12px' }}
      />
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm flex-1">Add card</button>
        <button type="button" onClick={handleCancel} className="btn btn-secondary btn-sm">Cancel</button>
      </div>
    </form>
  );
};
