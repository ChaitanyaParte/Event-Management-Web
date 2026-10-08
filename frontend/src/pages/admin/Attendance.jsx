import { useMemo, useState } from 'react';
import PageTitle from '../../components/PageTitle';
import { Badge, Button, Card, EmptyState, Input, Notice, Select, Table, Td, Th } from '../../components/ui';
import { useAdminData } from '../../hooks/useAdminData';
import { formatDate } from '../../lib/api';

export default function Attendance() {
  const { data: records, error, reload, call } = useAdminData('/admin/attendance');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (records || []).filter(
      (r) =>
        (!term || [r.student_name, r.event_title].some((field) => (field || '').toLowerCase().includes(term))) &&
        (!status || r.attendance_status === status),
    );
  }, [records, search, status]);

  const toggle = async (record) => {
    const next = record.attendance_status === 'Present' ? 'Absent' : 'Present';
    setNotice('');
    setProblem('');
    try {
      await call(`/admin/attendance/${record.attendance_id}`, { method: 'PUT', body: { attendance_status: next } });
      setNotice(`${record.student_name} marked ${next.toLowerCase()}.`);
      await reload();
    } catch (err) {
      setProblem(err.message);
    }
  };

  return (
    <>
      <PageTitle title="Attendance" subtitle="Review and correct attendance records marked by organizers." />

      <div className="space-y-3">
        {notice && <Notice>{notice}</Notice>}
        {(problem || error) && <Notice type="error">{problem || error}</Notice>}
      </div>

      <div className="my-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search student or event" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>Present</option>
          <option>Absent</option>
        </Select>
      </div>

      {!records ? (
        <p className="text-sm text-zinc-500">Loading attendance...</p>
      ) : visible.length === 0 ? (
        <EmptyState>No attendance records found.</EmptyState>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><Th>Student</Th><Th>Event</Th><Th>Status</Th><Th>Marked on</Th><Th>Marked by</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.attendance_id}>
                  <Td className="font-medium">{r.student_name}</Td>
                  <Td>{r.event_title}</Td>
                  <Td><Badge value={r.attendance_status} /></Td>
                  <Td>{formatDate(r.attendance_date)}</Td>
                  <Td>{r.marked_by || '-'}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => toggle(r)}>
                        Mark {r.attendance_status === 'Present' ? 'absent' : 'present'}
                      </Button>
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
