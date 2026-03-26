import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Battle } from "@workspace/api-client-react";
import { Sword } from "lucide-react";
import { CyberButton } from "./CyberUI";

interface BattleReplayProps {
  battle: Battle;
  onComplete: () => void;
}

export function BattleReplay({ battle, onComplete }: BattleReplayProps) {
  const [roundIdx, setRoundIdx] = useState(-1);
  const [isFinished, setIsFinished] = useState(false);

  const logs = battle.battleLog || [];
  const hasStarted = roundIdx >= 0;
  
  useEffect(() => {
    if (roundIdx < logs.length) {
      const timer = setTimeout(() => {
        setRoundIdx((r) => r + 1);
      }, roundIdx === -1 ? 1500 : 1800);
      return () => clearTimeout(timer);
    } else if (!isFinished) {
      const finishTimer = setTimeout(() => setIsFinished(true), 1500);
      return () => clearTimeout(finishTimer);
    }
    return undefined;
  }, [roundIdx, logs.length, isFinished]);

  const currentLog = roundIdx >= 0 && roundIdx < logs.length ? logs[roundIdx] : null;
  const isEnd = roundIdx >= logs.length;
  
  // Calculate current HP
  const f1Hp = currentLog ? currentLog.fighter1Hp : (isEnd ? battle.fighter1FinalHp : 100);
  const f2Hp = currentLog ? currentLog.fighter2Hp : (isEnd ? battle.fighter2FinalHp : 100);

  // We assume max HP is 100 for the visual bars
  const f1HpPercent = Math.max(0, Math.min(100, f1Hp));
  const f2HpPercent = Math.max(0, Math.min(100, f2Hp));

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col overflow-hidden scanline">
      {/* Background ambient light */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-secondary/10" />
      
      {/* Top Health Bars */}
      <div className="relative z-10 w-full max-w-5xl mx-auto p-6 pt-12 flex items-center justify-between gap-8">
        {/* Fighter 1 */}
        <div className="w-full">
          <div className="flex justify-between items-end mb-2">
            <h2 className="font-display text-2xl font-bold text-primary uppercase text-glow-primary">{battle.fighter1.name}</h2>
            <span className="font-mono text-xl">{f1Hp} HP</span>
          </div>
          <div className="h-6 bg-black border-2 border-primary/50 clip-angled-sm relative overflow-hidden transform skew-x-[-10deg]">
            <motion.div 
              className="h-full bg-primary relative"
              initial={{ width: "100%" }}
              animate={{ width: `${f1HpPercent}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite]" />
            </motion.div>
          </div>
        </div>

        {/* VS */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center bg-black animate-pulse">
            <Sword className="w-8 h-8 text-secondary" />
          </div>
        </div>

        {/* Fighter 2 */}
        <div className="w-full text-right">
          <div className="flex justify-between items-end mb-2 flex-row-reverse">
            <h2 className="font-display text-2xl font-bold text-secondary uppercase text-glow-secondary">{battle.fighter2.name}</h2>
            <span className="font-mono text-xl">{f2Hp} HP</span>
          </div>
          <div className="h-6 bg-black border-2 border-secondary/50 clip-angled-sm relative overflow-hidden transform skew-x-[10deg]">
            <motion.div 
              className="h-full bg-secondary relative float-right"
              initial={{ width: "100%" }}
              animate={{ width: `${f2HpPercent}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite]" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Action Area */}
      <div className="flex-1 relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!hasStarted && (
            <motion.div
              key="intro"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-6xl font-display font-bold uppercase tracking-[1em] text-white text-glow-primary"
            >
              FIGHT!
            </motion.div>
          )}

          {currentLog && !isEnd && (
            <motion.div
              key={roundIdx}
              initial={{ y: 50, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <div className="text-xl font-mono text-muted-foreground mb-4">ROUND {currentLog.round}</div>
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
                <span className={currentLog.attacker === battle.fighter1.name ? "text-primary" : "text-secondary"}>
                  {currentLog.attacker}
                </span>
                {" "}used{" "}
                <span className="text-accent text-glow-primary uppercase tracking-wider">{currentLog.move}</span>!
              </h3>
              <div className="text-3xl text-destructive font-bold font-mono mt-4 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
                -{currentLog.damage.toFixed(1)} DMG
              </div>
            </motion.div>
          )}

          {isFinished && (
            <motion.div
              key="winner"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center bg-black/80 p-12 border-2 border-accent clip-angled shadow-[0_0_50px_rgba(57,255,20,0.3)]"
            >
              <h2 className="text-5xl font-display font-bold text-accent mb-4 text-glow-secondary uppercase">
                {battle.winnerId === battle.fighter1Id ? battle.fighter1.name : battle.fighter2.name} WINS!
              </h2>
              <p className="text-2xl text-white font-mono mb-8">
                Prize: <span className="text-accent">+{battle.winnerReward} ONE</span>
              </p>
              <CyberButton size="lg" onClick={onComplete}>Return to Arena</CyberButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
