import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import PageTitle from '../../components/PageTitle';
import { Badge, Button, Card, Dialog, EmptyState, Field, Input, Notice, Select, Table, Td, Th } from '../../components/ui';
import { useAdminData } from '../../hooks/useAdminData';

export default function Organizers() {
  const { data: organizers, error, reload, call } = useAdminData('/admin/organizers');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (organizers || []).filter(
      (o) =>
        (!term || [o.full_name, o.email, o.department].some((field) => (field || '').toLowerCase().includes(term))) &&
        (!status || o.approval_status === status),
    );
  }, [organizers, search, status]);

  const pending = (organizers || []).filter((o) => o.approval_status === 'Pending').length;

  const run = async (action, successMessage) => {
    setNotice('');
    setProblem('');
    try {
      await action();
      setNotice(successMessage);
      await reload();
    } catch (err) {
      setProblem(err.message);
    }
  };

  const approve = (organizer) => {
    if (!window.confirm(`Approve ${organizer.full_name}? They will be able to log in and create events.`)) return;
    run(() => call(`/admin/organizers/${organizer.organizer_id}/approve`, { method: 'PUT' }), `${organizer.full_name} approved.`);
  };

  const remove = (organizer) => {
    if (!window.confirm(`Delete ${organizer.full_name}? This only works if they have no events.`)) return;
    run(() => call(`/admin/organizers/${organizer.organizer_id}`, { method: 'DELETE' }), 'Organizer deleted.');
  };

  const openEdit = (organizer) => {
    setEditing(organizer);
    setForm({ full_name: organizer.full_name, phone: organizer.phone || '', department: organizer.department });
  };

  const save = async (event) => {
    event.preventDefault();
    await run(() => call(`/admin/organizers/${editing.organizer_id}`, { method: 'PUT', body: form }), 'Organizer updated.');
    setEditing(null);
  };

  return (
    <>
      <PageTitle title="Organizers" subtitle="Approve new organizer accounts and manage existing ones." />

      {pending > 0 && <div className="mb-3"><Notice type="error">{pending} organizer{pending > 1 ? 's are' : ' is'} waiting for approval.</Notice></div>}
      <div className="space-y-3">
        {notice && <Notice>{notice}</Notice>}
        {(problem || error) && <Notice type="error">{problem || error}</Notice>}
      </div>

      <div className="my-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search name, email or department" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option>Pending</option>
          <option>Approved</option>
        </Select>
      </div>

      {!organizers ? (
        <p className="text-sm text-zinc-500">Loading organizers...</p>
      ) : visible.length === 0 ? (
        <EmptyState>No organizers found.</EmptyState>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><Th>Name</Th><Th>Email</Th><Th>Department</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.organizer_id}>
                  <Td className="font-medium">{o.full_name}</Td>
                  <Td>{o.email}</Td>
                  <Td>{o.department}</Td>
                  <Td><Badge value={o.approval_status} /></Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      {o.approval_status === 'Pending' && <Button size="sm" onClick={() => approve(o)}><Check size={14} /> Approve</Button>}
                      <Button size="sm" variant="outline" onClick={() => openEdit(o)}>Edit</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(o)}>Delete</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit organizer">
        {editing && form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Email" hint="Can't be changed."><Input value={editing.email} disabled readOnly /></Field>
            <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required /></Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
