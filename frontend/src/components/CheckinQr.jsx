import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize2, QrCode } from 'lucide-react';
import { Button, Card, Dialog, Notice } from './ui';

export default function CheckinQr({ eventId, call }) {
  const [token, setToken] = useState(null);
  const [error, setError] = useState('');
  const [large, setLarge] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setToken(null);
    setError('');
    call(`/attendance/event/${eventId}/checkin-token`)
      .then((result) => !cancelled && setToken(result.token))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [call, eventId]);

  const link = token ? `${window.location.origin}/checkin?token=${token}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this check-in link:', link);
    }
  };

  return (
    <Card className="mt-6 p-4">
      <div className="flex flex-wrap items-center gap-5">
        <div className="rounded-md border border-zinc-200 bg-[#ffffff] p-3">
          {token ? <QRCodeSVG value={link} size={132} bgColor="#ffffff" fgColor="#000000" /> : (
            <div className="flex h-[132px] w-[132px] items-center justify-center text-zinc-400"><QrCode size={40} /></div>
          )}
        </div>
        <div className="min-w-[14rem] flex-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><QrCode size={16} /> Check-in QR code</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Show this at the venue. Registered students scan it with their phone to mark themselves present. It works from 30 minutes before the event until 3 hours after it ends.
          </p>
          {error && <div className="mt-3"><Notice type="error">{error}</Notice></div>}
          {token && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setLarge(true)}><Maximize2 size={14} /> Show large</Button>
              <Button size="sm" variant="outline" onClick={copyLink}>{copied ? 'Link copied' : 'Copy link'}</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={large} onClose={() => setLarge(false)} title="Scan to check in">
        <div className="flex justify-center rounded-md bg-[#ffffff] p-4">
          {token && <QRCodeSVG value={link} size={300} bgColor="#ffffff" fgColor="#000000" />}
        </div>
        <p className="mt-3 text-center text-sm text-zinc-500">Students scan this with their phone camera.</p>
      </Dialog>
    </Card>
  );
}
