import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, Field, RoleTabs } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { dashboardPath } from '../lib/auth';

const emptyForm = {
  roll_number: '',
  year_of_study: '',
  username: '',
  full_name: '',
  email: '',
  password: '',
  phone: '',
  department: '',
};

export default function Register() {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const payloadFor = () => {
    const base = { full_name: form.full_name, email: form.email, password: form.password };
    if (role === 'admin') return { ...base, username: form.username };
    const common = { ...base, phone: form.phone, department: form.department };
    if (role === 'student') return { ...common, roll_number: form.roll_number, year_of_study: Number(form.year_of_study) };
    return common;
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api(`/auth/${role}/register`, { method: 'POST', body: payloadFor() });
      if (result.token) {
        login(role, result.token);
        navigate(dashboardPath(role));
      } else {
        setNotice(result.message || 'Registration received. An admin must approve your account before you can log in.');
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Join in" subtitle="Create an account to get started.">
      <form onSubmit={submit} className="space-y-4">
        <RoleTabs value={role} onChange={setRole} />

        {role === 'admin' && <Field label="Username" name="username" value={form.username} onChange={update} required />}
        {role === 'student' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Roll number" name="roll_number" value={form.roll_number} onChange={update} required />
            <label className="block text-sm font-medium">
              Year of study
              <select
                name="year_of_study"
                value={form.year_of_study}
                onChange={update}
                required
                className="mt-1 w-full rounded-md border-2 border-ink bg-white px-3 py-2 outline-none focus:bg-pop-lime/40"
              >
                <option value="">Select</option>
                {[1, 2, 3, 4].map((year) => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <Field label="Full name" name="full_name" value={form.full_name} onChange={update} required />
        <Field label="Email" type="email" name="email" value={form.email} onChange={update} required />
        <Field label="Password" type="password" name="password" value={form.password} onChange={update} required />
        {role !== 'admin' && (
          <>
            <Field label="Phone" type="tel" name="phone" value={form.phone} onChange={update} />
            <Field label="Department" name="department" value={form.department} onChange={update} required />
          </>
        )}

        {error && <p className="rounded-md border-2 border-ink bg-pop-orange px-3 py-2 text-sm">{error}</p>}
        {notice && <p className="rounded-md border-2 border-ink bg-pop-lime px-3 py-2 text-sm">{notice}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md border-2 border-ink bg-ink px-4 py-2.5 font-semibold text-paper transition hover:bg-pop-cyan hover:text-ink disabled:opacity-60"
        >
          {busy ? 'Creating account...' : 'Create account'}
        </button>
        <p className="text-center text-sm">
          Already registered? <Link to="/login" className="font-semibold underline">Log in</Link>
        </p>
      </form>
    </AuthCard>
  );
}
