import { useMemo, useState } from 'react';
import PageTitle from '../../components/PageTitle';
import { Badge, Button, Card, EmptyState, Input, Notice, Select, Table, Td, Th } from '../../components/ui';
import { useAdminData } from '../../hooks/useAdminData';
import { formatDate } from '../../lib/api';

export default function Registrations() {
  const { data: registrations, error, reload, call } = useAdminData('/admin/registrations');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (registrations || []).filter(
      (r) =>
        (!term || [r.student_name, r.event_title, r.email].some((field) => (field || '').toLowerCase().includes(term))) &&
        (!status || r.status === status),
    );
  }, [registrations, search, status]);

  const cancel = async (registration) => {
    if (!window.confirm(`Cancel ${registration.student_name}'s registration for "${registration.event_title}"?`)) return;
    setNotice('');
    setProblem('');
    try {
      await call(`/admin/registrations/${registration.registration_id}/cancel`, { method: 'PUT' });
      setNotice('Registration cancelled.');
      await reload();
    } catch (err) {
      setProblem(err.message);
    }
  };

  return (
    <>
      <PageTitle title="Registrations" subtitle="Every student registration across all events." />

      <div className="space-y-3">
        {notice && <Notice>{notice}</Notice>}
        {(problem || error) && <Notice type="error">{problem || error}</Notice>}
      </div>

      <div className="my-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search student or event" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>Registered</option>
          <option>Cancelled</option>
        </Select>
      </div>

      {!registrations ? (
        <p className="text-sm text-zinc-500">Loading registrations...</p>
      ) : visible.length === 0 ? (
        <EmptyState>No registrations found.</EmptyState>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><Th>Student</Th><Th>Event</Th><Th>Registered on</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.registration_id}>
                  <Td className="font-medium">{r.student_name}<span className="block text-xs font-normal text-zinc-500">{r.email}</span></Td>
                  <Td>{r.event_title}</Td>
                  <Td>{formatDate(r.registration_date)}</Td>
                  <Td><Badge value={r.status} /></Td>
                  <Td>
                    <div className="flex justify-end">
                      {r.status === 'Registered' && <Button size="sm" variant="outline" onClick={() => cancel(r)}>Cancel</Button>}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
