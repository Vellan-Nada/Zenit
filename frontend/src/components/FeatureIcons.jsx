import React from 'react';

const IconBase = ({ children, className, size = 26 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const HabitIcon = ({ className, size }) => (
  <IconBase className={className} size={size}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </IconBase>
);

export const NoteIcon = ({ className, size }) => (
  <IconBase className={className} size={size}>
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5Z" />
    <path d="M15 3v6h6" />
  </IconBase>
);

export const TodoIcon = ({ className, size }) => (
  <IconBase className={className} size={size}>
    <rect x="3" y="5" width="6" height="6" rx="1" />
    <path d="m3 17 2 2 4-4" />
    <path d="M13 6h8" />
    <path d="M13 12h8" />
    <path d="M13 18h8" />
  </IconBase>
);

export const TimerIcon = ({ className, size }) => (
  <IconBase className={className} size={size}>
    <line x1="10" x2="14" y1="2" y2="2" />
    <line x1="12" x2="15" y1="14" y2="11" />
    <circle cx="12" cy="14" r="8" />
  </IconBase>
);

export const SourceIcon = ({ className, size }) => (
  <IconBase className={className} size={size}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </IconBase>
);

export const JournalIcon = ({ className, size }) => (
  <IconBase className={className} size={size}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </IconBase>
);

export const BookIcon = ({ className, size }) => (
  <IconBase className={className} size={size}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M12 8a2 2 0 1 0 0 4 2 2 0 1 0 0-4z" />
  </IconBase>
);

export const FilmIcon = ({ className, size }) => (
  <IconBase className={className} size={size}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="7" x2="7" y1="3" y2="21" />
    <line x1="17" x2="17" y1="3" y2="21" />
    <line x1="3" x2="21" y1="12" y2="12" />
    <line x1="3" x2="7" y1="7" y2="7" />
    <line x1="3" x2="7" y1="17" y2="17" />
    <line x1="17" x2="21" y1="17" y2="17" />
    <line x1="17" x2="21" y1="7" y2="7" />
  </IconBase>
);

export const LayoutDashboardIcon = ({ className, size }) => (
  <IconBase className={className} size={size}>
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </IconBase>
);

export default IconBase;
