import { useState, type FormEvent } from "react";

const initialFormState = { title: "", details: "" };

type NewCardFormProps = {
  onAdd: (title: string, details: string) => void;
};

export const NewCardForm = ({ onAdd }: NewCardFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      return;
    }
    onAdd(formState.title.trim(), formState.details.trim());
    setFormState(initialFormState);
    setIsOpen(false);
  };

  return (
    <div>
      {isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={formState.title}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Card title"
            className="w-full rounded-lg border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy-dark)] placeholder-[var(--gray-text)] outline-none transition focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            required
            autoFocus
          />
          <textarea
            value={formState.details}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, details: event.target.value }))
            }
            placeholder="Add details..."
            rows={2}
            className="w-full resize-none rounded-lg border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--gray-text)] placeholder-[var(--gray-text)]/50 outline-none transition focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          />
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[var(--secondary-purple)] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110 active:scale-95"
            >
              Add card
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setFormState(initialFormState);
              }}
              className="rounded-lg border border-[var(--stroke)] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--gray-text)] transition hover:bg-[var(--surface)] hover:text-[var(--navy-dark)]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full rounded-lg border-2 border-dashed border-[var(--stroke)]/50 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--primary-blue)] transition hover:border-[var(--primary-blue)] hover:bg-blue-50/50"
        >
          + Add a card
        </button>
      )}
    </div>
  );
};
