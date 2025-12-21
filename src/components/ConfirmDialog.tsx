"use client";

import { ReactNode, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalAccessibility } from '@/lib/accessibility';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  icon?: ReactNode;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon,
  loading = false,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  
  // Use custom accessibility hook for modal
  const dialogRef = useModalAccessibility<HTMLDivElement>(open, onClose, {
    initialFocusRef: cancelButtonRef, // Focus cancel button by default for safety
    returnFocusOnDeactivate: true,
    lockScroll: true,
  });

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    },
    warning: {
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    },
    default: {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      buttonClass: 'bg-primary hover:bg-primary/90 focus:ring-primary',
    },
  };

  const styles = variantStyles[variant];

  const defaultIcon = variant === 'danger' ? (
    <Trash2 className={`h-6 w-6 ${styles.iconColor}`} aria-hidden="true" />
  ) : (
    <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} aria-hidden="true" />
  );

  const dialogId = `confirm-dialog-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const titleId = `${dialogId}-title`;
  const descId = `${dialogId}-description`;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
          >
            <div 
              ref={dialogRef}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descId}
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 h-12 w-12 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
                    {icon || defaultIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 id={titleId} className="text-xl font-bold tracking-tight">{title}</h2>
                    <p id={descId} className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {description}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Close dialog"
                    type="button"
                  >
                    <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-muted/30 border-t border-border/50 flex gap-3 justify-end">
                <Button
                  ref={cancelButtonRef}
                  variant="outline"
                  onClick={onClose}
                  disabled={isConfirming || loading}
                  className="min-w-[100px] h-11 rounded-xl font-semibold"
                  type="button"
                >
                  {cancelText}
                </Button>
                <Button
                  ref={confirmButtonRef}
                  onClick={handleConfirm}
                  disabled={isConfirming || loading}
                  className={`min-w-[100px] h-11 rounded-xl font-semibold ${styles.buttonClass}`}
                  type="button"
                >
                  {isConfirming || loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    confirmText
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Pre-configured dialog variants
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    props: Partial<ConfirmDialogProps>;
    resolve: ((confirmed: boolean) => void) | null;
  }>({
    open: false,
    props: {},
    resolve: null,
  });

  const confirm = (props: Partial<Omit<ConfirmDialogProps, 'open' | 'onClose' | 'onConfirm'>>) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        props,
        resolve,
      });
    });
  };

  const handleClose = () => {
    state.resolve?.(false);
    setState({ open: false, props: {}, resolve: null });
  };

  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ open: false, props: {}, resolve: null });
  };

  const DialogComponent = (
    <ConfirmDialog
      open={state.open}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={state.props.title || 'Confirm Action'}
      description={state.props.description || 'Are you sure you want to continue?'}
      confirmText={state.props.confirmText}
      cancelText={state.props.cancelText}
      variant={state.props.variant}
      icon={state.props.icon}
    />
  );

  return { confirm, DialogComponent };
}

// Convenience hooks
export function useSignOutConfirm() {
  const { confirm, DialogComponent } = useConfirmDialog();

  const confirmSignOut = () =>
    confirm({
      title: 'Sign Out?',
      description: 'You will need to sign in again to access your hostel space and tasks.',
      confirmText: 'Sign Out',
      cancelText: 'Stay Signed In',
      variant: 'warning',
      icon: <LogOut className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />,
    });

  return { confirmSignOut, DialogComponent };
}

export function useDeleteConfirm() {
  const { confirm, DialogComponent } = useConfirmDialog();

  const confirmDelete = (itemName: string = 'this item') =>
    confirm({
      title: 'Delete Forever?',
      description: `This will permanently delete ${itemName}. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Keep It',
      variant: 'danger',
    });

  return { confirmDelete, DialogComponent };
}
