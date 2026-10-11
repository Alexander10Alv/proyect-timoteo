import type { CSSProperties, ReactNode } from 'react';

const adminStyle = { '--font-serif': 'var(--font-display)' } as CSSProperties;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-skin" style={adminStyle}>
      {children}
    </div>
  );
}