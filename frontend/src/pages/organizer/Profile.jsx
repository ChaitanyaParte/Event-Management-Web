import { useEffect, useState } from 'react';
import PageTitle from '../../components/PageTitle';
import { Badge, Button, Card, Field, Input, Notice } from '../../components/ui';
import { useRoleApi } from '../../hooks/useRoleApi';
import { userId } from '../../lib/auth';

export default function Profile() {
  const call = useRoleApi('organizer');
  const id = userId('organizer');
  const [form, setForm] = useState(null);
  const [approval, setApproval] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    call(`/organizers/${id}`)
      .then((data) => {
        setForm({ full_name: data.full_name || '', email: data.email || '', phone: data.phone || '', department: data.department || '' });
        setApproval(data.approval_status);
      })
      .catch((err) => setError(err.message));
  }, [call, id]);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await call(`/organizers/${id}`, {
        method: 'PUT',
        body: { full_name: form.full_name, phone: form.phone, department: form.department },
      });
      setNotice('Profile updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageTitle title="Profile" subtitle="Keep your organizer details up to date." />
      {!form ? (
        <p className="text-sm text-zinc-500">{error || 'Loading your profile...'}</p>
      ) : (
        <Card className="max-w-xl p-6">
          <form onSubmit={save} className="space-y-4">
            <Field label="Full name"><Input name="full_name" value={form.full_name} onChange={update} required /></Field>
            <Field label="Email" hint="Your email can't be changed."><Input value={form.email} readOnly disabled /></Field>
            <Field label="Phone"><Input type="tel" name="phone" value={form.phone} onChange={update} /></Field>
            <Field label="Department"><Input name="department" value={form.department} onChange={update} required /></Field>
            <div className="flex items-center gap-2 text-sm text-zinc-600">Account status <Badge value={approval} /></div>
            {error && <Notice type="error">{error}</Notice>}
            {notice && <Notice>{notice}</Notice>}
            <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</Button>
          </form>
        </Card>
      )}
    </>
  );
}
