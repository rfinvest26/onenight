import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-drag"></div>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        {title && <h3 className="modal-title" style={{ marginTop: '0.5rem' }}>{title}</h3>}
        <div style={{ marginTop: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
