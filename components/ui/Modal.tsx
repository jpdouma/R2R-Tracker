
import React from 'react';

interface ModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ onClose, title, children, footer, maxWidth = 'max-w-4xl' }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <section
        className={`relative bg-brand-surface rounded-lg shadow-lg p-6 w-full ${maxWidth} mx-4 flex flex-col max-h-[85vh]`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-brand-border flex-shrink-0">
            <h2 id="modal-title" className="text-xl font-bold text-brand-text-primary flex items-center">
              {title}
            </h2>
             <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-white text-2xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2">
            {children}
        </div>
        
        {footer && (
            <div className="mt-4 pt-4 border-t border-brand-border flex-shrink-0">
                {footer}
            </div>
        )}
      </section>
    </div>
  );
};
