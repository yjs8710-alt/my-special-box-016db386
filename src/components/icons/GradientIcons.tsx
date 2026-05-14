// Gradient bell & user icons (purple → blue)
// Stroke uses linear-gradient via inline SVG defs

type Props = { className?: string; size?: number };

const GRADIENT_ID_BELL = "lvbl-grad-bell";
const GRADIENT_ID_USER = "lvbl-grad-user";

export const GradientBellIcon = ({ className, size = 24 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id={GRADIENT_ID_BELL} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#d946ef" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <path
      d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
      stroke={`url(#${GRADIENT_ID_BELL})`}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
      stroke={`url(#${GRADIENT_ID_BELL})`}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GradientUserIcon = ({ className, size = 24 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id={GRADIENT_ID_USER} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#d946ef" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <circle
      cx="12"
      cy="8"
      r="4"
      stroke={`url(#${GRADIENT_ID_USER})`}
      strokeWidth="2"
    />
    <path
      d="M4 21a8 8 0 0 1 16 0"
      stroke={`url(#${GRADIENT_ID_USER})`}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
