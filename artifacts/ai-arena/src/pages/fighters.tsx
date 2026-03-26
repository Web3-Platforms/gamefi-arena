import { useState } from "react";
import { useMyFighters, useMintFighterHook } from "@/hooks/use-fighters";
import { CyberButton, CyberModal, CyberInput } from "@/components/CyberUI";
import { FighterCard } from "@/components/FighterCard";
import { Plus, Bot } from "lucide-react";

const NEON_COLORS = ["#00f0ff", "#ff003c", "#39ff14", "#fff000", "#b026ff", "#ff8a00"];

export default function FightersPage() {
  const { data: fightersResponse, isLoading } = useMyFighters();
  const { mutate: mintFighter, isPending: isMinting } = useMintFighterHook();
  
  const [isMintModalOpen, setMintModalOpen] = useState(false);
  const [mintName, setMintName] = useState("");
  const [mintColor, setMintColor] = useState(NEON_COLORS[0]);

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintName.trim()) return;
    
    mintFighter({ 
      data: { name: mintName, color: mintColor, description: "Newly minted AI core." } 
    }, {
      onSuccess: () => {
        setMintModalOpen(false);
        setMintName("");
      }
    });
  };

  const fighters = fightersResponse?.fighters || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-widest text-white">My Roster</h1>
          <p className="text-muted-foreground font-mono mt-2">Manage your AI neural combatants.</p>
        </div>
        <CyberButton onClick={() => setMintModalOpen(true)} className="shrink-0">
          <Plus className="w-5 h-5 mr-2" /> Mint New Fighter
        </CyberButton>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[400px] bg-card/30 animate-pulse clip-angled" />
          ))}
        </div>
      ) : fighters.length === 0 ? (
        <div className="text-center py-20 bg-card/30 border border-white/5 clip-angled">
          <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-display text-white mb-4">No Fighters Found</h2>
          <p className="text-muted-foreground mb-8">You need to mint an AI fighter to enter the Arena.</p>
          <CyberButton onClick={() => setMintModalOpen(true)}>Initialize First Fighter</CyberButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fighters.map(fighter => (
            <FighterCard key={fighter.id} fighter={fighter} />
          ))}
        </div>
      )}

      {/* Mint Modal */}
      <CyberModal isOpen={isMintModalOpen} onClose={() => setMintModalOpen(false)} title="Mint AI Fighter">
        <form onSubmit={handleMint} className="space-y-6">
          <CyberInput 
            label="Designation Name"
            placeholder="e.g. OBLITERATOR-X"
            value={mintName}
            onChange={e => setMintName(e.target.value)}
            required
            maxLength={20}
          />
          
          <div>
            <label className="block text-sm font-display uppercase tracking-widest text-primary mb-3">
              Core Energy Color
            </label>
            <div className="flex flex-wrap gap-3">
              {NEON_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setMintColor(color)}
                  className={`w-10 h-10 clip-angled-sm border-2 transition-all ${mintColor === color ? 'scale-110 shadow-[0_0_15px_currentColor]' : 'scale-90 opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: color, borderColor: color, color }}
                />
              ))}
            </div>
          </div>

          <div className="bg-black/50 border border-white/10 p-4 font-mono text-xs text-muted-foreground mt-4 clip-angled-sm">
            Neural stats (Aggression, Defense, Speed, Power, Intelligence) will be initialized with random base values.
          </div>

          <CyberButton type="submit" className="w-full mt-6" disabled={isPending || !mintName.trim()}>
            {isMinting ? "Initializing..." : "Mint NFT (Cost: Free)"}
          </CyberButton>
        </form>
      </CyberModal>
    </div>
  );
}
