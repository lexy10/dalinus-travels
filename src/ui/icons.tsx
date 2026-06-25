/**
 * Inline SVG icon set (Heroicons-inspired, outline 20px).
 * Kept inline to avoid pulling in an icon library.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = "h-5 w-5 shrink-0";

function Icon({ children, className, ...props }: P & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? base}
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => (
  <Icon {...p}>
    <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
  </Icon>
);
export const IconGlobe = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
  </Icon>
);
export const IconAcademic = (p: P) => (
  <Icon {...p}>
    <path d="M22 10L12 5 2 10l10 5 10-5z" />
    <path d="M6 12v4c0 2 3 3 6 3s6-1 6-3v-4" />
  </Icon>
);
export const IconCompass = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5L13 13l-4.5 2.5L11 11l4.5-2.5z" />
  </Icon>
);
export const IconDocument = (p: P) => (
  <Icon {...p}>
    <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" />
    <path d="M14 3v6h6" />
  </Icon>
);
export const IconCalendar = (p: P) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </Icon>
);
export const IconUsers = (p: P) => (
  <Icon {...p}>
    <path d="M16 14a4 4 0 10-4-4 4 4 0 004 4z" transform="translate(-4 -2)" />
    <path d="M2 21a6 6 0 0112 0M16 11a4 4 0 100-8M22 21a6 6 0 00-6-6" />
  </Icon>
);
export const IconBriefcase = (p: P) => (
  <Icon {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
  </Icon>
);
export const IconNews = (p: P) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 8h10M7 12h10M7 16h6" />
  </Icon>
);
export const IconLayers = (p: P) => (
  <Icon {...p}>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5M3 18l9 5 9-5" />
  </Icon>
);
export const IconChart = (p: P) => (
  <Icon {...p}>
    <path d="M3 21V3M3 21h18M7 17V11M12 17V7M17 17v-3" />
  </Icon>
);
export const IconClipboard = (p: P) => (
  <Icon {...p}>
    <rect x="6" y="5" width="12" height="16" rx="2" />
    <path d="M9 5V3h6v2M9 11h6M9 15h6M9 19h6" />
  </Icon>
);
export const IconTag = (p: P) => (
  <Icon {...p}>
    <path d="M3 12l9-9h8v8l-9 9-8-8z" />
    <circle cx="14" cy="10" r="1.5" />
  </Icon>
);
export const IconBell = (p: P) => (
  <Icon {...p}>
    <path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 004 0" />
  </Icon>
);
export const IconSearch = (p: P) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.5-4.5" />
  </Icon>
);
export const IconArrowUp = (p: P) => (
  <Icon {...p}>
    <path d="M7 14l5-5 5 5" />
  </Icon>
);
export const IconArrowDown = (p: P) => (
  <Icon {...p}>
    <path d="M7 10l5 5 5-5" />
  </Icon>
);
export const IconLogout = (p: P) => (
  <Icon {...p}>
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l-5-5 5-5M5 12h13" />
  </Icon>
);
export const IconExternal = (p: P) => (
  <Icon {...p}>
    <path d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" />
  </Icon>
);
export const IconPlus = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const IconChevronRight = (p: P) => (
  <Icon {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);
