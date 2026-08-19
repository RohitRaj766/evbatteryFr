'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  children: React.ReactNode;
}

/**
 * Renders children into a portal attached directly to <body>.
 * This escapes ancestor `backdrop-filter` / `transform` containing blocks
 * that would otherwise prevent `position: fixed` from being viewport-relative.
 */
export const Modal: React.FC<ModalProps> = ({ children }) => {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (!elRef.current) {
    elRef.current = document.createElement('div');
  }

  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return createPortal(children, elRef.current);
};
