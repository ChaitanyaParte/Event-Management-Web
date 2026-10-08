import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, Field, RoleTabs } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { dashboardPath } from '../lib/auth';

export default function Login() {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api(`/auth/${role}/login`, { method: 'POST', body: form });
      login(role, result.token);
      navigate(dashboardPath(role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to register for events and track your certificates.">
      <form onSubmit={submit} className="space-y-4">
        <RoleTabs value={role} onChange={setRole} />
        <Field label="Email" type="email" name="email" value={form.email} onChange={update} required />
        <Field label="Password" type="password" name="password" value={form.password} onChange={update} required />
        {error && <p className="rounded-md border-2 border-ink bg-pop-orange px-3 py-2 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md border-2 border-ink bg-ink px-4 py-2.5 font-semibold text-paper transition hover:bg-pop-cyan hover:text-ink disabled:opacity-60"
        >
          {busy ? 'Logging in...' : 'Log in'}
        </button>
        <p className="text-center text-sm">
          New here? <Link to="/register" className="font-semibold underline">Create an account</Link>
        </p>
      </form>
    </AuthCard>
  );
}
