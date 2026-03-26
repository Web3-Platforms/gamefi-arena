import { useState } from "react";
import { useMyFighters, useTrainFighterHook } from "@/hooks/use-fighters";
import { CyberButton } from "@/components/CyberUI";
import { FighterCard } from "@/components/FighterCard";
import { Dumbbell, Zap, Shield, Target, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const STATS = [
  { id: "aggression", label: "Aggression", icon: Target, color: "#ff003c" },
  { id: "defense", label: "Defense", icon: Shield, color: "#00f0ff" },
  { id: "speed", label: "Speed", icon: Zap, color: "#fff000" },
  { id: "power", label: "Power", icon: Dumbbell, color: "#ff8a00" },
  { id: "intelligence", label: "Intelligence", icon: Brain, color: "#b026ff" },
];

const TRAINING_TIERS = [
  { id: "BASIC", name: "Basic Algorithm", cost: 5, boost: "~2%" },
  { id: "ADVANCED", name: "Advanced Heuristics", cost: 15, boost: "~5%" },
  { id: "INTENSIVE", name: "Intensive Deep Learning", cost: 30, boost: "~12%" },
  { id: "AI_OPTIMIZED", name: "Quantum Optimization", cost: 50, boost: "~25%" },
];

export default function TrainingPage() {
  const { data: fightersResponse, isLoading } = useMyFighters();
  const { mutate: train, isPending } = useTrainFighterHook();
  
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null);
  const [selectedStat, setSelectedStat] = useState<string>("aggression");

  const fighters = fightersResponse?.fighters || [];
  const activeFighter = fighters.find(f => f.id === selectedFighter);

  const handleTrain = (tierId: string) => {
    if (!activeFighter) return;
    train({
      id: activeFighter.id,
      data: { type: tierId as any, stat: selectedStat as any }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold uppercase tracking-widest text-white">Training Center</h1>
        <p className="text-muted-foreground font-mono mt-2">Spend ONE tokens to optimize neural pathways.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Roster List */}
        <div className="lg:col-span-4 bg-card/50 border border-white/10 p-4 clip-angled">
          <h2 className="text-xl font-display text-primary mb-4 uppercase">Select Target</h2>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded" />)}
            </div>
          ) : fighters.length === 0 ? (
            <div className="text-muted-foreground font-mono text-sm py-4">No fighters available to train.</div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {fighters.map(f => (
                <div 
                  key={f.id}
                  onClick={() => setSelectedFighter(f.id)}
                  className={cn(
                    "p-3 flex items-center gap-4 cursor-pointer transition-all border-l-4 bg-black/40",
                    selectedFighter === f.id ? "border-primary bg-primary/10" : "border-transparent hover:border-white/20"
                  )}
                >
                  <div className="w-10 h-10 border border-white/20 flex items-center justify-center" style={{ backgroundColor: `${f.color}20`, borderColor: f.color }}>
                    <Bot className="w-6 h-6" style={{ color: f.color }} />
                  </div>
                  <div>
                    <div className="font-display font-bold uppercase text-white">{f.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">LVL {f.level}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Training UI */}
        <div className="lg:col-span-8">
          {!activeFighter ? (
            <div className="h-full min-h-[400px] flex items-center justify-center bg-card/20 border border-white/5 clip-angled border-dashed">
              <div className="text-center text-muted-foreground">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-mono text-lg">Select a fighter to begin optimization sequence.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Selected Fighter Overview */}
              <div className="max-w-md">
                <FighterCard fighter={activeFighter} />
              </div>

              {/* Stat Selection */}
              <div className="bg-card/50 border border-white/10 p-6 clip-angled">
                <h3 className="font-display text-xl uppercase mb-4 text-white">1. Select Target Parameter</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {STATS.map(stat => {
                    const Icon = stat.icon;
                    const isSelected = selectedStat === stat.id;
                    return (
                      <button
                        key={stat.id}
                        onClick={() => setSelectedStat(stat.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 border transition-all bg-black/40",
                          isSelected ? "border-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]" : "border-white/10 hover:border-white/30"
                        )}
                      >
                        <Icon className="w-6 h-6" style={{ color: isSelected ? stat.color : "#666" }} />
                        <span className="text-[10px] font-display uppercase tracking-wider text-center">{stat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Training Programs */}
              <div className="bg-card/50 border border-white/10 p-6 clip-angled">
                <h3 className="font-display text-xl uppercase mb-4 text-white">2. Execute Training Sequence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TRAINING_TIERS.map(tier => (
                    <div key={tier.id} className="border border-white/10 p-5 bg-black/60 hover:border-primary/50 transition-colors group flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-bold text-lg text-white mb-1 group-hover:text-primary transition-colors">{tier.name}</h4>
                        <p className="text-xs font-mono text-muted-foreground mb-4">Expected boost: <span className="text-accent">{tier.boost}</span></p>
                      </div>
                      <CyberButton 
                        onClick={() => handleTrain(tier.id)} 
                        disabled={isPending}
                        variant={tier.id === "AI_OPTIMIZED" ? "primary" : "outline"}
                        className="w-full justify-between"
                      >
                        <span>Execute</span>
                        <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm border border-white/10">{tier.cost} ONE</span>
                      </CyberButton>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
