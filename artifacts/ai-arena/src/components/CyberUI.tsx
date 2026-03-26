import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// --- CyberButton ---
export interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-display font-bold uppercase tracking-wider overflow-hidden transition-all clip-angled disabled:opacity-50 disabled:cursor-not-allowed group";
    
    const sizeStyles = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };
    
    const variantStyles = {
      primary: "bg-primary text-background hover:bg-primary/90 glow-primary",
      secondary: "bg-secondary text-foreground hover:bg-secondary/90 glow-secondary",
      accent: "bg-accent text-background hover:bg-accent/90 shadow-[0_0_15px_rgba(57,255,20,0.4)]",
      outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/10",
      ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5",
    };

    return (
      <button ref={ref} className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props}>
        {/* Scanline overlay effect on hover */}
        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite] skew-x-12" />
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);
CyberButton.displayName = "CyberButton";

// --- CyberInput ---
export interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && <label className="text-sm font-display uppercase tracking-widest text-primary">{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "w-full bg-background border-b-2 border-primary/30 px-4 py-3 text-foreground font-body focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/40",
              className
            )}
            {...props}
          />
          <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-300 peer-focus:w-full" />
        </div>
      </div>
    );
  }
);
CyberInput.displayName = "CyberInput";

// --- CyberModal ---
interface CyberModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function CyberModal({ isOpen, onClose, title, children }: CyberModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-card border border-primary/30 shadow-[0_0_40px_rgba(0,240,255,0.15)] clip-angled p-1"
          >
            <div className="bg-background/50 h-full w-full clip-angled-sm p-6 relative scanline">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-primary/50 hover:text-primary transition-colors z-20"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-white mb-6 uppercase tracking-widest relative z-20">
                {title}
              </h2>
              
              <div className="relative z-20">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- StatBar ---
interface StatBarProps {
  label: string;
  value: number; // 0.0 to 1.0
  color?: string;
}

export function StatBar({ label, value, color = "hsl(var(--primary))" }: StatBarProps) {
  return (
    <div className="mb-3 w-full">
      <div className="flex justify-between text-xs font-bold mb-1 font-display uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span style={{ color }}>{Math.round(value * 100)}</span>
      </div>
      <div className="h-2.5 bg-black/60 rounded-sm overflow-hidden border border-white/5 relative clip-angled-sm">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full relative"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        >
          <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>
    </div>
  );
}
