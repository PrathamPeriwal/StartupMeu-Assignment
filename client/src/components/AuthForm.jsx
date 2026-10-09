import { useState } from 'react';
import { api } from '../api.js';

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      onAuth(await api(`/auth/${mode}`, { method: 'POST', body }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <h1>JobTrail</h1>
      <p className="muted">Track every application from wishlist to offer.</p>
      <form onSubmit={submit} className="card">
        {isRegister && (
          <label>Name<input name="name" required autoComplete="name" /></label>
        )}
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={isRegister ? 8 : undefined}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={busy}>{isRegister ? 'Create account' : 'Log in'}</button>
      </form>
      <button className="link" onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}>
        {isRegister ? 'Have an account? Log in' : 'New here? Create an account'}
      </button>
    </main>
  );
}
