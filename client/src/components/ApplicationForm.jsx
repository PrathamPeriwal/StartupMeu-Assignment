import { useEffect, useRef, useState } from 'react';
import { STATUSES } from '../api.js';

// `application` is null when closed, {} for a new entry, or an existing document.
export default function ApplicationForm({ application, onSave, onDelete, onClose }) {
  const dialog = useRef(null);
  const [error, setError] = useState('');
  const isNew = !application?._id;

  useEffect(() => {
    if (application) {
      setError('');
      dialog.current.showModal();
    } else {
      dialog.current.close();
    }
  }, [application]);

  async function run(action) {
    try {
      await action();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  function submit(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    body.appliedOn ||= null;
    run(() => onSave(body));
  }

  const a = application ?? {};
  return (
    <dialog ref={dialog} onClose={onClose}>
      {application && (
        <form onSubmit={submit} key={a._id ?? 'new'}>
          <h2>{isNew ? 'New application' : `${a.company} · ${a.role}`}</h2>
          <div className="grid">
            <label>Company<input name="company" required defaultValue={a.company} /></label>
            <label>Role<input name="role" required defaultValue={a.role} /></label>
            <label>
              Status
              <select name="status" defaultValue={a.status ?? 'wishlist'}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label>Applied on<input name="appliedOn" type="date" defaultValue={a.appliedOn?.slice(0, 10)} /></label>
            <label>Location<input name="location" defaultValue={a.location} /></label>
            <label>Job link<input name="link" type="url" placeholder="https://" defaultValue={a.link} /></label>
          </div>
          <label>Notes<textarea name="notes" rows={4} defaultValue={a.notes} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="actions">
            {!isNew && (
              <button type="button" className="danger" onClick={() => run(onDelete)}>Delete</button>
            )}
            <span className="spacer" />
            <button type="button" className="ghost" onClick={onClose}>Cancel</button>
            <button>{isNew ? 'Add' : 'Save'}</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
