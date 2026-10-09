import { useCallback, useEffect, useState } from 'react';
import { api, STATUSES } from '../api.js';
import ApplicationForm from './ApplicationForm.jsx';

export default function Board() {
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [error, setError] = useState('');

  const refreshStats = useCallback(() => api('/applications/stats').then(setStats, () => {}), []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Debounce search so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      api(`/applications?q=${encodeURIComponent(query)}`).then(setApps, (err) => setError(err.message));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function save(body) {
    const saved = editing._id
      ? await api(`/applications/${editing._id}`, { method: 'PATCH', body })
      : await api('/applications', { method: 'POST', body });
    setApps((list) => [saved, ...list.filter((a) => a._id !== saved._id)]);
    refreshStats();
  }

  async function remove() {
    await api(`/applications/${editing._id}`, { method: 'DELETE' });
    setApps((list) => list.filter((a) => a._id !== editing._id));
    refreshStats();
  }

  // Optimistic move; roll back if the server rejects it.
  async function move(id, status) {
    const before = apps;
    if (before.find((a) => a._id === id)?.status === status) return;
    setApps(before.map((a) => (a._id === id ? { ...a, status } : a)));
    try {
      await api(`/applications/${id}`, { method: 'PATCH', body: { status } });
      refreshStats();
    } catch (err) {
      setApps(before);
      setError(err.message);
    }
  }

  return (
    <main>
      <section className="toolbar">
        <input
          type="search"
          placeholder="Search company, role, location…"
          aria-label="Search applications"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={() => setEditing({})}>+ Add application</button>
      </section>

      {stats && (
        <section className="stats" aria-label="Statistics">
          <div><strong>{stats.total}</strong><span>tracked</span></div>
          <div><strong>{stats.total - stats.byStatus.wishlist}</strong><span>sent</span></div>
          <div><strong>{stats.byStatus.interview}</strong><span>interviewing</span></div>
          <div><strong>{stats.byStatus.offer}</strong><span>offers</span></div>
          <div><strong>{stats.responseRate}%</strong><span>response rate</span></div>
        </section>
      )}

      {error && (
        <p className="error" role="alert">
          {error} <button className="link" onClick={() => setError('')}>dismiss</button>
        </p>
      )}

      <section className="board">
        {STATUSES.map((status) => {
          const items = apps.filter((a) => a.status === status);
          return (
            <div
              key={status}
              className={`column ${dragOver === status ? 'over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { setDragOver(null); move(e.dataTransfer.getData('text/plain'), status); }}
            >
              <h3 className={`tag ${status}`}>{status} <span>{items.length}</span></h3>
              {items.map((a) => (
                <button
                  key={a._id}
                  className="job"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', a._id)}
                  onClick={() => setEditing(a)}
                >
                  <strong>{a.company}</strong>
                  <span>{a.role}</span>
                  {a.location && <small className="muted">{a.location}</small>}
                </button>
              ))}
              {!items.length && <p className="empty">Drop here</p>}
            </div>
          );
        })}
      </section>

      <ApplicationForm application={editing} onSave={save} onDelete={remove} onClose={() => setEditing(null)} />
    </main>
  );
}
