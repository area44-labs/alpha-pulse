import * as React from "react";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "right",
  className = "",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="block w-full cursor-pointer border-none bg-transparent p-0 text-left outline-none"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`animate-fade-in absolute z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg outline-none dark:border-gray-800 dark:bg-gray-950 ${align === "right" ? "right-0" : "left-0"}`}
        >
          <div onClick={() => setIsOpen(false)} role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function DropdownMenuItem({
  children,
  className = "",
  onClick,
  ...props
}: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-700 transition-colors outline-none hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-gray-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
