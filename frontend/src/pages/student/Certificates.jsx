import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRoleApi } from '../../hooks/useRoleApi';
import { formatDate } from '../../lib/api';
import { getToken, parseToken } from '../../lib/auth';
import { btnDark, btnLight, card } from '../../lib/ui';

export default function Certificates() {
  const call = useRoleApi('student');
  const [certificates, setCertificates] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const studentId = parseToken(getToken('student'))?.id;
    call(`/certificates/student/${studentId}`)
      .then(setCertificates)
      .catch((err) => setError(err.message));
  }, [call]);

  if (error) return <p>{error}</p>;
  if (!certificates) return <p>Loading your certificates...</p>;

  return (
    <>
      <h1 className="text-4xl font-bold">Certificates</h1>
      <p className="mt-1">Certificates are issued by your organizer after you're marked present at an event.</p>

      {certificates.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-ink p-8 text-center">
          <p>No certificates yet. Attend an event and your organizer will issue one.</p>
          <Link to="/" className="mt-3 inline-block font-semibold underline">Browse events</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <div key={cert.certificate_id} className={`${card} flex flex-col justify-between gap-4 p-5`}>
              <div>
                <h3 className="text-xl font-semibold">{cert.event_title}</h3>
                <p className="text-sm">Issued {formatDate(cert.issue_date)} &middot; {cert.venue}</p>
                <p className="mt-1 text-xs">Certificate ID: {cert.certificate_code}</p>
              </div>
              <button type="button" onClick={() => setSelected(cert)} className={`${btnDark} self-start`}>View certificate</button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="print-area fixed inset-0 z-50 overflow-y-auto bg-ink/80 p-4 sm:p-8">
          <div className="mx-auto max-w-3xl border-[10px] border-double border-ink bg-[#fffdf7] p-8 text-center sm:p-12">
            <h2 className="text-3xl font-bold uppercase tracking-widest sm:text-4xl">Certificate of participation</h2>
            <p className="mt-6">This certificate is proudly presented to</p>
            <p className="mx-auto mt-3 inline-block border-b-2 border-ink px-8 pb-1 text-3xl font-bold">{selected.student_name}</p>
            <p className="mt-6">for attending</p>
            <p className="mt-2 text-2xl font-semibold">{selected.event_title}</p>
            <p className="mt-2">held on {formatDate(selected.event_date)} at {selected.venue}</p>
            <p className="mt-10 text-sm">
              Organized by {selected.organizer_name}
              <br />
              Issued on {formatDate(selected.issue_date)} &middot; Certificate ID: {selected.certificate_code}
            </p>
          </div>
          <div className="no-print mx-auto mt-5 flex max-w-3xl justify-center gap-3">
            <button type="button" onClick={() => window.print()} className={btnDark}>Print / save as PDF</button>
            <button type="button" onClick={() => setSelected(null)} className={btnLight}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
