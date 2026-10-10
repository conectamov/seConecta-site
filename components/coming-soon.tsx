type ComingSoonProps = {
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  label?: string;
  message?: string;
};

export function ComingSoon({ action, children, className = "", label = "Em breve", message }: ComingSoonProps) {
  return <div className={`relative isolate overflow-hidden ${className}`}>
    <div className="pointer-events-none select-none blur-[3px] opacity-55" aria-hidden="true">{children}</div>
    <div className="absolute inset-0 z-10 grid place-items-center bg-white/24 backdrop-blur-[1px]">
      <div className="mx-5 flex max-w-sm flex-col items-center rounded-[22px] border border-[#c8d8d1] bg-white/95 px-6 py-5 text-center shadow-[0_16px_42px_rgba(28,54,43,.14)]">
        <span className="rounded-full bg-[#eef5f1] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.13em] text-[#52615a]">{label}</span>
        {message && <p className="mt-3 text-[11px] leading-5 text-[#65736c]">{message}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  </div>;
}
