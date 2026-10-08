import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRoleApi } from '../../hooks/useRoleApi';
import { formatDate, formatTime } from '../../lib/api';
import { getToken, parseToken } from '../../lib/auth';
import { btnLight, card, chip } from '../../lib/ui';

export default function MyEvents() {
  const call = useRoleApi('student');
  const [registrations, setRegistrations] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    const studentId = parseToken(getToken('student'))?.id;
    return call(`/registrations/student/${studentId}`)
      .then(setRegistrations)
      .catch((err) => setError(err.message));
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (item) => {
    if (!window.confirm(`Cancel your registration for "${item.title}"?`)) return;
    setNotice('');
    try {
      await call(`/registrations/${item.registration_id}`, { method: 'DELETE' });
      setNotice('Registration cancelled.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <p>{error}</p>;
  if (!registrations) return <p>Loading your events...</p>;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl font-bold">My events</h1>
        <Link to="/" className={btnLight}>Browse events</Link>
      </div>
      {notice && <p className="mt-4 rounded-md border-2 border-ink bg-pop-lime px-3 py-2 text-sm">{notice}</p>}

      {registrations.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-ink p-8 text-center">You haven't registered for any events yet.</div>
      ) : (
        <div className="mt-6 grid gap-4">
          {registrations.map((item) => {
            const canCancel = item.status === 'Registered' && item.event_status !== 'Completed' && item.event_status !== 'Cancelled';
            return (
              <div key={item.registration_id} className={`${card} flex flex-wrap items-center justify-between gap-4 p-5`}>
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className={chip('')}>{item.category_name}</span>
                    <span className={chip(item.event_status)}>{item.event_status}</span>
                    <span className={chip(item.status)}>{item.status}</span>
                    {item.attendance_status === 'Present' && <span className={chip('Ongoing')}>Attended</span>}
                  </div>
                  <Link to={`/events/${item.event_id}`} className="text-xl font-semibold hover:underline">{item.title}</Link>
                  <p className="text-sm">{formatDate(item.event_date)} &middot; {formatTime(item.start_time)} &middot; {item.venue}</p>
                </div>
                {canCancel && <button type="button" onClick={() => cancel(item)} className={btnLight}>Cancel registration</button>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
