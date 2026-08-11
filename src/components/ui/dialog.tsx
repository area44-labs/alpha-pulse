import { X } from "lucide-react";
import * as React from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
        role="presentation"
      />

      {/* Dialog container */}
      <dialog
        open
        className="relative z-10 block max-h-[90vh] w-full max-w-lg scale-100 transform overflow-hidden overflow-y-auto rounded-md border border-gray-200 bg-white p-6 shadow-xl transition-all dark:border-gray-800 dark:bg-gray-950"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-950 focus:ring-1 focus:ring-gray-300 focus:outline-none dark:hover:bg-gray-900 dark:hover:text-gray-50 dark:focus:ring-gray-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {children}
      </dialog>
    </div>
  );
}

export function DialogHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col space-y-1.5 text-left ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-lg font-bold tracking-tight text-gray-900 dark:text-gray-50 ${className}`}
      {...props}
    >
      {children || "Phân tích"}
    </h3>
  );
}

export function DialogDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-gray-500 dark:text-gray-400 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function DialogFooter({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
