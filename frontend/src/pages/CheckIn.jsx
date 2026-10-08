import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRoleApi } from '../hooks/useRoleApi';
import { btnDark, card } from '../lib/ui';

export default function CheckIn() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { roles } = useAuth();
  const call = useRoleApi('student');
  const [state, setState] = useState({ status: 'idle', message: '' });

  const checkIn = async () => {
    setState({ status: 'working', message: '' });
    try {
      const result = await call('/attendance/checkin', { method: 'POST', body: { token } });
      setState({ status: 'done', message: `${result.message} (${result.event_title})` });
    } catch (error) {
      setState({ status: 'error', message: error.message });
    }
  };

  const returnPath = `/checkin?token=${token}`;
  const nextSuffix = `?next=${encodeURIComponent(returnPath)}`;

  let body;
  if (!token) {
    body = <p>This check-in link is missing its code. Scan the QR code at the venue again.</p>;
  } else if (!roles.includes('student')) {
    body = (
      <>
        <p>Log in with your student account to check in to this event.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={`/login${nextSuffix}`} className={btnDark}>Log in</Link>
          <Link to={`/register${nextSuffix}`} className="rounded-md border-2 border-ink bg-white px-4 py-2 text-sm font-semibold hover:bg-pop-pink hover:text-black">
            Create an account
          </Link>
        </div>
      </>
    );
  } else if (state.status === 'done') {
    body = (
      <>
        <p className="rounded-md border-2 border-ink bg-pop-lime px-4 py-3 font-medium text-black">{state.message}</p>
        <Link to="/student/events" className="mt-4 inline-block font-semibold underline">View my events</Link>
      </>
    );
  } else {
    body = (
      <>
        <p>Tap the button to mark yourself present for this event. You can only check in if you're registered.</p>
        {state.status === 'error' && <p className="mt-3 rounded-md border-2 border-ink bg-pop-orange px-3 py-2 text-sm text-black">{state.message}</p>}
        <button type="button" onClick={checkIn} disabled={state.status === 'working'} className={`${btnDark} mt-4`}>
          {state.status === 'working' ? 'Checking in...' : 'Check me in'}
        </button>
      </>
    );
  }

  return (
    <div className={`${card} mx-auto mt-8 max-w-md p-6`}>
      <h1 className="mb-3 text-3xl font-bold">Event check-in</h1>
      {body}
    </div>
  );
}
