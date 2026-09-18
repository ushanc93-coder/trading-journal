"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AlertCircle, X } from "lucide-react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: ConfirmOptions) => Promise<void>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<(ConfirmOptions & { resolve: (value: boolean) => void, isAlert: boolean }) | null>(null);

  const confirm = (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setModalState({ ...options, resolve, isAlert: false });
    });
  };

  const alert = (options: ConfirmOptions) => {
    return new Promise<void>((resolve) => {
      setModalState({ ...options, resolve: () => resolve(), isAlert: true });
    });
  };

  const handleConfirm = () => {
    modalState?.resolve(true);
    setModalState(null);
  };

  const handleCancel = () => {
    modalState?.resolve(false);
    setModalState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {modalState && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-sm shadow-2xl transform transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${modalState.danger ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-400'}`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {modalState.title || (modalState.isAlert ? 'Notice' : 'Confirm Action')}
                </h3>
              </div>
              <button onClick={handleCancel} className="text-[var(--muted-foreground)] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-[var(--muted-foreground)] text-sm mb-6 leading-relaxed">
              {modalState.message}
            </p>
            
            <div className="flex justify-end gap-3">
              {!modalState.isAlert && (
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:text-white hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  {modalState.cancelText || 'Cancel'}
                </button>
              )}
              <button 
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  modalState.isAlert 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : modalState.danger 
                      ? 'bg-rose-600 hover:bg-rose-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {modalState.confirmText || (modalState.isAlert ? 'OK' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmProvider");
  return context;
}
