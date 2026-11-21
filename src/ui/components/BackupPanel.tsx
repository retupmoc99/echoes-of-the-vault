/**
 * Back up and restore progress with a save code (text) or a file.
 * Restoring replaces the current save, so it needs a second tap.
 */
import { useRef, useState } from 'react';
import { formatDuration } from '../format';

interface Props {
  lastBackupAt: number | null;
  exportCode: () => string;
  importCode: (code: string) => string | undefined;
  onRestored: () => void;
}

export function BackupPanel({ lastBackupAt, exportCode, importCode, onRestored }: Props) {
  const [shown, setShown] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [paste, setPaste] = useState('');
  const [confirm, setConfirm] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const age = lastBackupAt ? `${formatDuration(Date.now() - lastBackupAt)} ago` : 'never';
  const stale = !lastBackupAt || Date.now() - lastBackupAt > 7 * 24 * 3_600_000;

  const copy = async () => {
    const code = exportCode();
    try {
      await navigator.clipboard.writeText(code);
      setStatus('Save code copied. Paste it somewhere safe: a note, a message to yourself.');
      setShown(undefined);
    } catch {
      // Clipboard can be blocked; show the code so it can be copied by hand.
      setShown(code);
      setStatus('Copy the code below by hand.');
    }
  };

  const download = () => {
    const code = exportCode();
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `echoes-save-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Save file created.');
  };

  const restore = (code: string) => {
    const error = importCode(code);
    setConfirm(false);
    if (error) setStatus(error);
    else {
      setPaste('');
      setStatus(undefined);
      onRestored();
    }
  };

  const fromFile = async (file: File | undefined) => {
    if (!file) return;
    restore(await file.text());
  };

  return (
    <div className="backup">
      <p className={`record ${stale ? 'warn' : ''}`}>
        Last backup: {age}. Your progress lives only in this browser; a backup protects it.
      </p>
      <div className="row">
        <button className="primary-btn" onClick={copy}>
          Copy save code
        </button>
        <button className="ghost-btn" onClick={download}>
          Save as file
        </button>
      </div>
      {shown && <textarea className="code-box" readOnly value={shown} onFocus={(e) => e.currentTarget.select()} rows={3} />}

      <textarea
        className="code-box"
        placeholder="Paste a save code to restore it"
        value={paste}
        onChange={(e) => {
          setPaste(e.target.value);
          setConfirm(false);
        }}
        rows={2}
      />
      <div className="row">
        <button
          className={`ghost-btn ${confirm ? 'danger' : ''}`}
          disabled={!paste.trim()}
          onClick={() => (confirm ? restore(paste) : setConfirm(true))}
        >
          {confirm ? 'Tap again: replace current progress' : 'Restore from code'}
        </button>
        <button className="ghost-btn" onClick={() => fileInput.current?.click()}>
          Restore from file
        </button>
      </div>
      <input ref={fileInput} type="file" accept=".txt,text/plain" hidden onChange={(e) => fromFile(e.target.files?.[0])} />
      {status && <p className="record">{status}</p>}
    </div>
  );
}
