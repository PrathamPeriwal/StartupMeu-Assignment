import { useEffect, useState } from 'react';
import { api } from './api.js';
import AuthForm from './components/AuthForm.jsx';
import Board from './components/Board.jsx';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking the session

  useEffect(() => {
    api('/auth/me').then(setUser, () => setUser(null));
  }, []);

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  }

  if (user === undefined) return null;
  if (!user) return <AuthForm onAuth={setUser} />;

  return (
    <>
      <header className="topbar">
        <h1>JobTrail</h1>
        <span className="muted">{user.name}</span>
        <button className="ghost" onClick={logout}>Log out</button>
      </header>
      <Board />
    </>
  );
}
