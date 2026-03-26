import { useState } from "react";
import { useMyFighters, useAllFighters } from "@/hooks/use-fighters";
import { useCreateBattleHook } from "@/hooks/use-battles";
import { CyberButton } from "@/components/CyberUI";
import { FighterCard } from "@/components/FighterCard";
import { BattleReplay } from "@/components/BattleReplay";
import { Swords } from "lucide-react";
import type { Battle } from "@workspace/api-client-react";

export default function ArenaPage() {
  const { data: myFightersData, isLoading: load1 } = useMyFighters();
  const { data: allFightersData, isLoading: load2 } = useAllFighters();
  const { mutate: createBattle, isPending: isBattling } = useCreateBattleHook();

  const [selectedFighter1, setSelectedFighter1] = useState<string | null>(null);
  const [selectedFighter2, setSelectedFighter2] = useState<string | null>(null);
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);

  const myFighters = myFightersData?.fighters || [];
  // All fighters (including own) are valid opponents — important for single-wallet demo
  const allFighters = allFightersData?.fighters || [];
  // Opponents: exclude the fighter already selected as fighter 1
  const opponents = selectedFighter1
    ? allFighters.filter(f => f.id !== selectedFighter1)
    : allFighters;

  const handleBattle = () => {
    if (!selectedFighter1 || !selectedFighter2) return;
    
    createBattle(
      { data: { fighter1Id: selectedFighter1, fighter2Id: selectedFighter2 } },
      {
        onSuccess: (battle) => {
          setActiveBattle(battle);
        }
      }
    );
  };

  const handleReplayComplete = () => {
    setActiveBattle(null);
    setSelectedFighter1(null);
    setSelectedFighter2(null);
  };

  if (load1 || load2) {
    return <div className="p-20 text-center text-primary font-mono animate-pulse">Loading Arena Data...</div>;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-80px)] flex flex-col">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-display font-bold uppercase tracking-widest text-white text-glow-primary">Combat Arena</h1>
          <p className="text-muted-foreground font-mono mt-3">Select your combatant and an opponent.</p>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-start">
          
          {/* Left Column: My Fighters */}
          <div className="bg-card/30 p-6 border border-primary/20 clip-angled h-full">
            <h2 className="text-2xl font-display text-primary mb-6 text-center border-b border-primary/20 pb-4">Select Your Fighter</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {myFighters.length === 0 ? (
                <div className="text-center text-muted-foreground font-mono py-10">You have no fighters.</div>
              ) : (
                myFighters.map(f => (
                  <FighterCard 
                    key={f.id} 
                    fighter={f} 
                    compact 
                    selected={selectedFighter1 === f.id}
                    onClick={() => setSelectedFighter1(f.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Center Column: VS & Battle Button */}
          <div className="flex flex-col justify-center items-center py-10 lg:py-40 gap-8">
            <div className="w-20 h-20 bg-black border-4 border-white/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <Swords className="w-10 h-10 text-muted-foreground" />
            </div>
            
            <CyberButton 
              size="lg" 
              className="text-2xl px-12 py-6 w-full lg:w-auto"
              disabled={!selectedFighter1 || !selectedFighter2 || isBattling}
              onClick={handleBattle}
            >
              {isBattling ? "Simulating..." : "INITIATE BATTLE"}
            </CyberButton>
          </div>

          {/* Right Column: Opponents */}
          <div className="bg-card/30 p-6 border border-secondary/20 clip-angled h-full">
            <h2 className="text-2xl font-display text-secondary mb-6 text-center border-b border-secondary/20 pb-4">Select Opponent</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {opponents.length === 0 ? (
                <div className="text-center text-muted-foreground font-mono py-10">No opponents found on the network.</div>
              ) : (
                opponents.map(f => (
                  <FighterCard 
                    key={f.id} 
                    fighter={f} 
                    compact 
                    selected={selectedFighter2 === f.id}
                    onClick={() => setSelectedFighter2(f.id)}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {activeBattle && (
        <BattleReplay battle={activeBattle} onComplete={handleReplayComplete} />
      )}
    </>
  );
}
