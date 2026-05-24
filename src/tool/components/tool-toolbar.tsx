'use client';

import Link from 'next/link';

export function ToolToolbar() {
  return (
    <div className="notepad-toolbar">
      <Link href="/help" className="toolbar-btn toolbar-help-link" aria-label="Open help page">
        Help
      </Link>
    </div>
  );
}
