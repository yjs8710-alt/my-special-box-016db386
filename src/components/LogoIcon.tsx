const LogoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* House outline */}
    <path
      d="M20 4L3 18H8V35H32V18H37L20 4Z"
      stroke="white"
      strokeWidth="2.2"
      fill="none"
      strokeLinejoin="round"
    />
    {/* Window / door */}
    <rect
      x="15"
      y="20"
      width="10"
      height="10"
      rx="1.5"
      stroke="white"
      strokeWidth="2"
      fill="none"
    />
    {/* Window cross */}
    <line x1="20" y1="20" x2="20" y2="30" stroke="white" strokeWidth="1.5" />
    <line x1="15" y1="25" x2="25" y2="25" stroke="white" strokeWidth="1.5" />
  </svg>
);

export default LogoIcon;
