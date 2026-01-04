"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

interface ActionSheetOption {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "primary";
  disabled?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  options: ActionSheetOption[];
  showCancel?: boolean;
  cancelLabel?: string;
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  description,
  options,
  showCancel = true,
  cancelLabel = "Cancel",
}: ActionSheetProps) {
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.velocity.y > 300 || info.offset.y > 100) {
        triggerHaptic('light');
        onClose();
      }
    },
    [onClose]
  );

  const handleOptionClick = useCallback((option: ActionSheetOption) => {
    if (option.disabled) return;
    triggerHaptic(option.variant === 'destructive' ? 'warning' : 'medium');
    option.onClick();
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-background rounded-t-3xl shadow-2xl pb-safe"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="px-6 pb-4 pt-2 text-center border-b border-border/50">
                {title && (
                  <h3 className="text-lg font-bold">{title}</h3>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            )}

            {/* Options */}
            <div className="px-4 py-2">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  disabled={option.disabled}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all",
                    "active:scale-[0.98] touch-target",
                    option.variant === "destructive" && "text-red-500 hover:bg-red-500/10",
                    option.variant === "primary" && "text-primary font-bold hover:bg-primary/10",
                    option.variant === "default" && "text-foreground hover:bg-muted/50",
                    !option.variant && "text-foreground hover:bg-muted/50",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Cancel Button */}
            {showCancel && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  className="w-full py-4 rounded-2xl bg-muted/50 font-bold text-muted-foreground hover:bg-muted transition-all active:scale-[0.98] touch-target"
                >
                  {cancelLabel}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for easy action sheet usage
interface ActionSheetContextType {
  showActionSheet: (props: Omit<ActionSheetProps, "isOpen" | "onClose">) => void;
  hideActionSheet: () => void;
}

const ActionSheetContext = createContext<ActionSheetContextType | null>(null);

export function ActionSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetProps, setSheetProps] = useState<Omit<ActionSheetProps, "isOpen" | "onClose">>({
    options: [],
  });

  const showActionSheet = useCallback((props: Omit<ActionSheetProps, "isOpen" | "onClose">) => {
    setSheetProps(props);
    setIsOpen(true);
    triggerHaptic('light');
  }, []);

  const hideActionSheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ActionSheetContext.Provider value={{ showActionSheet, hideActionSheet }}>
      {children}
      <ActionSheet
        isOpen={isOpen}
        onClose={hideActionSheet}
        {...sheetProps}
      />
    </ActionSheetContext.Provider>
  );
}

export function useActionSheet() {
  const context = useContext(ActionSheetContext);
  if (!context) {
    throw new Error("useActionSheet must be used within ActionSheetProvider");
  }
  return context;
}
