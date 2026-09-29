export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded border border-[var(--danger)]/40 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">
      {message}
    </div>
  );
}
