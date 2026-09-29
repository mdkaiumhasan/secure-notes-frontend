'use client';

import { useState } from 'react';

export function NoteForm({
  initial, onSubmit, onCancel, busy,
}: {
  initial?: { title: string; content: string };
  onSubmit: (v: { title: string; content: string }) => Promise<void>;
  onCancel?: () => void;
  busy?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');

  return (
    <form
      className="card space-y-2 p-3"
      onSubmit={async (e) => { e.preventDefault(); await onSubmit({ title, content }); if (!initial) { setTitle(''); setContent(''); } }}
    >
      <input className="field font-medium" placeholder="Title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="field" placeholder="Write your note…" rows={3} maxLength={10000} value={content} onChange={(e) => setContent(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={busy} type="submit">{initial ? 'Save' : 'Add note'}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
