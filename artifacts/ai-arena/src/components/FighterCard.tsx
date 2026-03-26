import { Bot, Crosshair, Shield, Zap, BrainCircuit, Activity } from "lucide-react";
import { CyberButton, StatBar } from "./CyberUI";
import { cn } from "@/lib/utils";
import type { Fighter } from "@workspace/api-client-react";

interface FighterCardProps {
  fighter: Fighter;
  onClick?: () => void;
  selected?: boolean;
  actionLabel?: string;
  onAction?: (e: React.MouseEvent) => void;
  actionDisabled?: boolean;
  compact?: boolean;
}

export function FighterCard({ fighter, onClick, selected, actionLabel, onAction, actionDisabled, compact = false }: FighterCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative bg-card/60 backdrop-blur-md border border-white/10 transition-all duration-300 group clip-angled",
        onClick ? "cursor-pointer hover:border-primary/50" : "",
        selected ? "border-primary glow-primary scale-[1.02]" : ""
      )}
    >
      <div className="absolute top-0 right-0 px-3 py-1 bg-black/50 border-b border-l border-white/10 text-xs font-mono text-primary font-bold clip-angled-sm">
        LVL {fighter.level}
      </div>

      <div className={cn("p-5", compact ? "pb-4" : "pb-6")}>
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 shrink-0 flex items-center justify-center clip-angled-sm border-2 shadow-lg relative overflow-hidden"
            style={{ 
              borderColor: fighter.color, 
              backgroundColor: `${fighter.color}15`,
              boxShadow: `0 0 20px ${fighter.color}40`
            }}
          >
            <Bot className="w-8 h-8 relative z-10" style={{ color: fighter.color }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          
          <div className="overflow-hidden">
            <h3 className="font-display text-xl font-bold uppercase tracking-wider text-white truncate text-glow-primary">
              {fighter.name}
            </h3>
            <div className="text-sm font-mono text-muted-foreground mt-1 flex items-center gap-2">
              <span className="text-accent">{fighter.wins}W</span> 
              <span className="text-white/30">/</span> 
              <span className="text-destructive">{fighter.losses}L</span>
            </div>
          </div>
        </div>

        <div className="space-y-1 relative z-10">
          <StatBar label="Aggression" value={fighter.aggression} color="#ff003c" />
          <StatBar label="Defense" value={fighter.defense} color="#00f0ff" />
          {!compact && (
            <>
              <StatBar label="Speed" value={fighter.speed} color="#fff000" />
              <StatBar label="Power" value={fighter.power} color="#ff8a00" />
              <StatBar label="Intelligence" value={fighter.intelligence} color="#b026ff" />
            </>
          )}
        </div>

        {actionLabel && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <CyberButton 
              className="w-full" 
              variant={selected ? "primary" : "outline"} 
              onClick={(e) => { e.stopPropagation(); onAction?.(e); }}
              disabled={actionDisabled}
            >
              {actionLabel}
            </CyberButton>
          </div>
        )}
      </div>
      
      {/* Decorative corners */}
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/20" />
    </div>
  );
}
