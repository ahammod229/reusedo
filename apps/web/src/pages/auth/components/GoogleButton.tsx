export function GoogleButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border bg-background text-sm font-semibold transition-colors hover:bg-accent"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <title>Google</title>
        <path
          fill="#4285F4"
          d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.400-1 2.500-2.200 3.300v2.700h3.500c2.100-1.900 3.300-4.700 3.300-8Z"
        />
        <path
          fill="#34A853"
          d="M12 23c3 0 5.500-1 7.300-2.700l-3.500-2.700c-1 .7-2.200 1.100-3.800 1.100-2.900 0-5.400-2-6.300-4.600H2.100v2.800C3.900 20.500 7.700 23 12 23Z"
        />
        <path
          fill="#FBBC05"
          d="M5.700 14.100c-.2-.7-.4-1.400-.4-2.100s.1-1.400.4-2.100V7.100H2.100C1.400 8.600 1 10.200 1 12s.4 3.400 1.100 4.900l3.600-2.800Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.300c1.600 0 3.100.6 4.200 1.700l3.100-3.100C17.500 2.100 15 1 12 1 7.700 1 3.900 3.500 2.100 7.100l3.600 2.800C6.600 7.300 9.100 5.300 12 5.300Z"
        />
      </svg>
      {label}
    </button>
  );
}
