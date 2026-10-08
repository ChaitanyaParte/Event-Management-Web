// Shows an event banner in full (never cropped). Any spare space is filled with a blurred copy of the picture.
export default function Banner({ src, alt = '', className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-zinc-200 ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-xl"
      />
      <img src={src} alt={alt} loading="lazy" className="relative h-full w-full object-contain" />
    </div>
  );
}
