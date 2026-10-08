import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import PageTitle from '../../components/PageTitle';
import { Button, Card, Dialog, EmptyState, Field, Input, Notice, Select, Table, Td, Th } from '../../components/ui';
import { useAdminData } from '../../hooks/useAdminData';
import { formatDate } from '../../lib/api';
import { downloadCsv } from '../../lib/csv';

export default function Students() {
  const { data: students, error, reload, call } = useAdminData('/admin/students');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState('');

  const departments = useMemo(() => [...new Set((students || []).map((s) => s.department).filter(Boolean))].sort(), [students]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (students || []).filter(
      (s) =>
        (!term || [s.full_name, s.email, s.roll_number].some((field) => (field || '').toLowerCase().includes(term))) &&
        (!department || s.department === department) &&
        (!year || String(s.year_of_study) === year),
    );
  }, [students, search, department, year]);

  const openView = async (student) => {
    setProblem('');
    try {
      const [registrations, certificates] = await Promise.all([
        call(`/admin/students/${student.student_id}/registrations`),
        call(`/admin/students/${student.student_id}/certificates`),
      ]);
      setViewing({ student, registrations, certificates });
    } catch (err) {
      setProblem(err.message);
    }
  };

  const openEdit = (student) => {
    setEditing(student);
    setForm({ full_name: student.full_name, phone: student.phone || '', department: student.department, year_of_study: String(student.year_of_study) });
  };

  const save = async (event) => {
    event.preventDefault();
    setProblem('');
    try {
      await call(`/admin/students/${editing.student_id}`, {
        method: 'PUT',
        body: { ...form, year_of_study: Number(form.year_of_study) },
      });
      setEditing(null);
      setNotice('Student updated.');
      await reload();
    } catch (err) {
      setProblem(err.message);
    }
  };

  const remove = async (student) => {
    if (!window.confirm(`Delete ${student.full_name}? Their registrations and certificates will be deleted too.`)) return;
    setProblem('');
    try {
      await call(`/admin/students/${student.student_id}`, { method: 'DELETE' });
      setNotice('Student deleted.');
      await reload();
    } catch (err) {
      setProblem(err.message);
    }
  };

  const exportCsv = () =>
    downloadCsv('students.csv', visible, [
      { key: 'roll_number', label: 'Roll number' },
      { key: 'full_name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'department', label: 'Department' },
      { key: 'year_of_study', label: 'Year' },
      { key: 'phone', label: 'Phone' },
    ]);

  return (
    <>
      <PageTitle title="Students" subtitle="Search, edit and manage student accounts.">
        <Button variant="outline" onClick={exportCsv} disabled={!students}><Download size={16} /> Export CSV</Button>
      </PageTitle>

      <div className="space-y-3">
        {notice && <Notice>{notice}</Notice>}
        {(problem || error) && <Notice type="error">{problem || error}</Notice>}
      </div>

      <div className="my-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search name, email or roll number" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="max-w-[12rem]" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </Select>
        <Select className="max-w-[9rem]" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">All years</option>
          {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
        </Select>
      </div>

      {!students ? (
        <p className="text-sm text-zinc-500">Loading students...</p>
      ) : visible.length === 0 ? (
        <EmptyState>No students found.</EmptyState>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><Th>Roll number</Th><Th>Name</Th><Th>Email</Th><Th>Department</Th><Th>Year</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.student_id}>
                  <Td>{s.roll_number}</Td>
                  <Td className="font-medium">{s.full_name}</Td>
                  <Td>{s.email}</Td>
                  <Td>{s.department}</Td>
                  <Td>{s.year_of_study}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openView(s)}>View</Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(s)}>Delete</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} title="Student details">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-lg font-semibold">{viewing.student.full_name}</p>
              <p className="text-zinc-500">{viewing.student.email}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ['Roll number', viewing.student.roll_number],
                ['Department', viewing.student.department],
                ['Year', viewing.student.year_of_study],
                ['Phone', viewing.student.phone || 'Not provided'],
                ['Joined', formatDate(viewing.student.created_at)],
                ['Certificates', viewing.certificates.length],
              ].map(([label, value]) => (
                <div key={label}><dt className="text-xs text-zinc-500">{label}</dt><dd className="font-medium">{value}</dd></div>
              ))}
            </dl>
            <div>
              <p className="mb-1 text-xs text-zinc-500">Registrations ({viewing.registrations.length})</p>
              {viewing.registrations.length === 0 ? (
                <p className="text-zinc-500">None yet.</p>
              ) : (
                <ul className="space-y-1">
                  {viewing.registrations.map((r) => (
                    <li key={r.registration_id} className="flex justify-between"><span>{r.title}</span><span className="text-zinc-500">{r.status}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit student">
        {editing && form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Roll number" hint="Can't be changed."><Input value={editing.roll_number} disabled readOnly /></Field>
            <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required /></Field>
            <Field label="Year of study">
              <Select value={form.year_of_study} onChange={(e) => setForm({ ...form, year_of_study: e.target.value })}>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </Select>
            </Field>
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
