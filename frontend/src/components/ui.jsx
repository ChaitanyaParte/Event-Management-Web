import { useEffect } from 'react';
import { X } from 'lucide-react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const buttonVariants = {
  default: 'bg-zinc-900 text-white hover:bg-zinc-700',
  outline: 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-zinc-700 hover:bg-zinc-100',
};
const buttonSizes = { sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm' };

export function Button({ variant = 'default', size = 'md', className, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

const controlClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-zinc-50 disabled:text-zinc-500';

export const Input = ({ className, ...props }) => <input className={cx(controlClass, className)} {...props} />;
export const Textarea = ({ className, ...props }) => <textarea rows={3} className={cx(controlClass, className)} {...props} />;
export const Select = ({ className, ...props }) => <select className={cx(controlClass, className)} {...props} />;

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx('block space-y-1.5 text-sm font-medium text-zinc-800', className)}>
      <span>{label}</span>
      {children}
      {hint && <span className="block text-xs font-normal text-zinc-500">{hint}</span>}
    </label>
  );
}

export function Card({ className, ...props }) {
  return <div className={cx('rounded-lg border border-zinc-200 bg-white shadow-sm', className)} {...props} />;
}

const badgeVariants = {
  Upcoming: 'border-blue-200 bg-blue-50 text-blue-700',
  Ongoing: 'border-green-200 bg-green-50 text-green-700',
  Completed: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  Cancelled: 'border-red-200 bg-red-50 text-red-700',
  Registered: 'border-green-200 bg-green-50 text-green-700',
  Present: 'border-green-200 bg-green-50 text-green-700',
  Absent: 'border-red-200 bg-red-50 text-red-700',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Approved: 'border-green-200 bg-green-50 text-green-700',
};

export function Badge({ value, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        badgeVariants[value] || 'border-zinc-200 bg-zinc-50 text-zinc-700',
      )}
    >
      {children || value}
    </span>
  );
}

export function Notice({ type = 'success', children }) {
  const styles = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-800',
  };
  return <p className={cx('rounded-md border px-3 py-2 text-sm', styles[type])}>{children}</p>;
}

export function Dialog({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-10"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-zinc-500 hover:bg-zinc-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}
export const Th = ({ children, className }) => (
  <th className={cx('border-b border-zinc-200 px-4 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase', className)}>{children}</th>
);
export const Td = ({ children, className }) => (
  <td className={cx('border-b border-zinc-100 px-4 py-3 align-middle text-zinc-800', className)}>{children}</td>
);

export function EmptyState({ children }) {
  return <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500">{children}</div>;
}
