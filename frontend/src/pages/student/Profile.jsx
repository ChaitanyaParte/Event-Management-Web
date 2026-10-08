import { useEffect, useState } from 'react';
import { Field } from '../../components/AuthShell';
import { useRoleApi } from '../../hooks/useRoleApi';
import { getToken, parseToken } from '../../lib/auth';
import { btnDark, card } from '../../lib/ui';

export default function Profile() {
  const call = useRoleApi('student');
  const studentId = parseToken(getToken('student'))?.id;
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    call(`/students/${studentId}`)
      .then((data) =>
        setForm({
          full_name: data.full_name || '',
          email: data.email || '',
          roll_number: data.roll_number || '',
          phone: data.phone || '',
          department: data.department || '',
          year_of_study: String(data.year_of_study || ''),
        }),
      )
      .catch((err) => setError(err.message));
  }, [call, studentId]);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await call(`/students/${studentId}`, {
        method: 'PUT',
        body: {
          full_name: form.full_name,
          phone: form.phone,
          department: form.department,
          year_of_study: Number(form.year_of_study),
        },
      });
      setNotice('Profile updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!form) return <p>{error || 'Loading your profile...'}</p>;

  return (
    <>
      <h1 className="text-4xl font-bold">Profile</h1>
      <form onSubmit={save} className={`${card} mt-6 max-w-xl space-y-4 p-6`}>
        <Field label="Full name" name="full_name" value={form.full_name} onChange={update} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email (can't be changed)" value={form.email} readOnly className="opacity-60" />
          <Field label="Roll number (can't be changed)" value={form.roll_number} readOnly />
        </div>
        <Field label="Phone" type="tel" name="phone" value={form.phone} onChange={update} />
        <Field label="Department" name="department" value={form.department} onChange={update} required />
        <label className="block text-sm font-medium">
          Year of study
          <select
            name="year_of_study"
            value={form.year_of_study}
            onChange={update}
            className="mt-1 w-full rounded-md border-2 border-ink bg-white px-3 py-2 outline-none focus:bg-pop-lime/40"
          >
            {[1, 2, 3, 4].map((year) => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>
        </label>
        {error && <p className="rounded-md border-2 border-ink bg-pop-orange px-3 py-2 text-sm">{error}</p>}
        {notice && <p className="rounded-md border-2 border-ink bg-pop-lime px-3 py-2 text-sm">{notice}</p>}
        <button type="submit" disabled={busy} className={btnDark}>{busy ? 'Saving...' : 'Save profile'}</button>
      </form>
    </>
  );
}
