import { useEffect, useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import PageTitle from '../../components/PageTitle';
import { Button, Card, EmptyState, Input, Notice, Select, Table, Td, Th } from '../../components/ui';
import { useAdminData } from '../../hooks/useAdminData';
import { formatDate } from '../../lib/api';

export default function Certificates() {
  const { data: certificates, error, reload, call } = useAdminData('/admin/certificates');
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    call('/admin/events')
      .then((list) => setEvents(list.filter((event) => event.status !== 'Cancelled')))
      .catch(() => {});
  }, [call]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (certificates || []).filter(
      (c) => !term || [c.student_name, c.certificate_code, c.event_title].some((field) => (field || '').toLowerCase().includes(term)),
    );
  }, [certificates, search]);

  const issue = async () => {
    setBusy(true);
    setNotice('');
    setProblem('');
    try {
      const result = await call('/certificates/issue', { method: 'POST', body: { event_id: Number(eventId) } });
      setNotice(result.message);
      await reload();
    } catch (err) {
      setProblem(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageTitle title="Certificates" subtitle="Issued certificates. Students marked present get one per event." />

      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[14rem] flex-1">
          <label className="mb-1.5 block text-sm font-medium text-zinc-800">Issue certificates for an event</label>
          <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">Select an event</option>
            {events.map((event) => <option key={event.event_id} value={event.event_id}>{event.title} ({event.status})</option>)}
          </Select>
        </div>
        <Button onClick={issue} disabled={!eventId || busy}><Award size={16} /> {busy ? 'Issuing...' : 'Issue certificates'}</Button>
      </Card>

      <div className="space-y-3">
        {notice && <Notice>{notice}</Notice>}
        {(problem || error) && <Notice type="error">{problem || error}</Notice>}
      </div>

      <div className="my-4">
        <Input className="max-w-xs" placeholder="Search student, event or code" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!certificates ? (
        <p className="text-sm text-zinc-500">Loading certificates...</p>
      ) : visible.length === 0 ? (
        <EmptyState>No certificates found.</EmptyState>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><Th>Code</Th><Th>Student</Th><Th>Event</Th><Th>Issued</Th></tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.certificate_id}>
                  <Td><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{c.certificate_code}</code></Td>
                  <Td className="font-medium">{c.student_name}</Td>
                  <Td>{c.event_title}</Td>
                  <Td>{formatDate(c.issue_date)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
