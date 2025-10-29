'use client';

import { ActionSheetProps, ActionSheetButtonProps } from './types';

export function ActionSheet({ isOpen, onClose, children }: ActionSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 z-50 pb-10 pt-2 rounded-t-[14px] animate-slide-up">
        <div className="w-[90%] max-w-[320px] mx-auto flex flex-col gap-2">
          {children}
        </div>
      </div>
    </>
  );
}

export function ActionSheetButton({ onClick, children, className = '', hasBorder = false }: ActionSheetButtonProps) {
  return (
    <button
      className={`
        block w-full h-[52px] text-[17px] font-medium text-primary-500
        hover:bg-gray-100/50 active:bg-gray-100
        transition-colors duration-200
        ${hasBorder ? 'border-t border-gray-200' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ActionSheetButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full bg-white rounded-[14px] overflow-hidden shadow-sm">
      {children}
    </div>
  );
}
