import { useCallback, useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import CheckinQr from '../../components/CheckinQr';
import PageTitle from '../../components/PageTitle';
import { Badge, Button, Card, EmptyState, Field, Notice, Select, Table, Td, Th } from '../../components/ui';
import { useRoleApi } from '../../hooks/useRoleApi';
import { formatDate } from '../../lib/api';

export default function Attendance() {
  const call = useRoleApi('organizer');
  const [events, setEvents] = useState(null);
  const [eventId, setEventId] = useState('');
  const [roster, setRoster] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    call('/events/mine')
      .then((all) => setEvents(all.filter((event) => event.approval_status === 'Approved')))
      .catch((err) => setError(err.message));
  }, [call]);

  const loadRoster = useCallback(
    async (id) => {
      if (!id) {
        setRoster(null);
        return;
      }
      try {
        const rows = await call(`/registrations/event/${id}`);
        setRoster(rows.filter((row) => row.status === 'Registered'));
      } catch (err) {
        setError(err.message);
      }
    },
    [call],
  );

  const chooseEvent = (event) => {
    setEventId(event.target.value);
    setNotice('');
    setError('');
    setRoster(null);
    loadRoster(event.target.value);
  };

  const mark = async (registrationId, status) => {
    setError('');
    setNotice('');
    try {
      await call('/attendance', { method: 'POST', body: { registration_id: registrationId, attendance_status: status } });
      await loadRoster(eventId);
    } catch (err) {
      setError(err.message);
    }
  };

  const issueCertificates = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await call('/certificates/issue', { method: 'POST', body: { event_id: Number(eventId) } });
      setNotice(result.message);
      await loadRoster(eventId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const present = roster?.filter((row) => row.attendance_status === 'Present').length ?? 0;
  const absent = roster?.filter((row) => row.attendance_status === 'Absent').length ?? 0;

  return (
    <>
      <PageTitle title="Attendance" subtitle="Mark who attended, then issue certificates to students marked present." />

      <Field label="Event" className="max-w-md">
        <Select value={eventId} onChange={chooseEvent} disabled={!events}>
          <option value="">{events ? (events.length ? 'Choose an event' : 'You have no events yet') : 'Loading...'}</option>
          {(events || []).map((event) => (
            <option key={event.event_id} value={event.event_id}>
              {event.title} ({formatDate(event.event_date)}, {event.status})
            </option>
          ))}
        </Select>
      </Field>

      <div className="mt-4 space-y-3">
        {notice && <Notice>{notice}</Notice>}
        {error && <Notice type="error">{error}</Notice>}
      </div>

      {eventId && <CheckinQr eventId={eventId} call={call} />}

      {roster && (
        <>
          <div className="mt-6 mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              {roster.length} registered &middot; <span className="text-green-700">{present} present</span> &middot;{' '}
              <span className="text-red-700">{absent} absent</span> &middot; {roster.length - present - absent} not marked
            </p>
            <Button onClick={issueCertificates} disabled={busy || present === 0}>
              <Award size={16} /> {busy ? 'Issuing...' : 'Issue certificates'}
            </Button>
          </div>

          {roster.length === 0 ? (
            <EmptyState>No students have registered for this event yet.</EmptyState>
          ) : (
            <Card>
              <Table>
                <thead>
                  <tr><Th>Student</Th><Th>Roll number</Th><Th>Department</Th><Th>Attendance</Th><Th>Certificate</Th><Th className="text-right">Mark</Th></tr>
                </thead>
                <tbody>
                  {roster.map((row) => (
                    <tr key={row.registration_id}>
                      <Td className="font-medium">{row.student_name}</Td>
                      <Td>{row.roll_number}</Td>
                      <Td>{row.department}</Td>
                      <Td>{row.attendance_status ? <Badge value={row.attendance_status} /> : <span className="text-zinc-400">Not marked</span>}</Td>
                      <Td>{row.certificate_id ? <Badge value="Approved">Issued</Badge> : <span className="text-zinc-400">-</span>}</Td>
                      <Td>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant={row.attendance_status === 'Present' ? 'default' : 'outline'} onClick={() => mark(row.registration_id, 'Present')}>Present</Button>
                          <Button size="sm" variant={row.attendance_status === 'Absent' ? 'destructive' : 'outline'} onClick={() => mark(row.registration_id, 'Absent')}>Absent</Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </>
      )}
    </>
  );
}
