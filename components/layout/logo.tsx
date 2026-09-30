export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      className={className}
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="#0F2942" />
      <path
        d="M12 20L17 25L27 13"
        stroke="#10B981"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 10H29C30.1 10 31 10.9 31 12V18"
        stroke="#38BDF8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
