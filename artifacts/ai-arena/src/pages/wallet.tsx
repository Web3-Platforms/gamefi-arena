import { useState } from "react";
import { useWallet, useTransactions, useStakeHook, useUnstakeHook } from "@/hooks/use-wallet";
import { CyberButton, CyberInput } from "@/components/CyberUI";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Pickaxe, Swords, Trophy, Activity, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function WalletPage() {
  const { data: wallet, isLoading: loadW } = useWallet();
  const { data: txData, isLoading: loadT } = useTransactions();
  const { mutate: stake, isPending: isStaking } = useStakeHook();
  const { mutate: unstake, isPending: isUnstaking } = useUnstakeHook();

  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const transactions = txData?.transactions || [];

  const handleStake = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(stakeAmount);
    if (!amt || amt <= 0) return;
    stake({ data: { amount: amt } }, { onSuccess: () => setStakeAmount("") });
  };

  const handleUnstake = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(unstakeAmount);
    if (!amt || amt <= 0) return;
    unstake({ data: { amount: amt } }, { onSuccess: () => setUnstakeAmount("") });
  };

  if (loadW) return <div className="p-20 text-center animate-pulse text-primary font-mono">Loading Wallet...</div>;
  if (!wallet) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 flex items-center justify-center clip-angled-sm border border-primary">
          <WalletIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-widest text-white">Treasury</h1>
          <p className="text-muted-foreground font-mono mt-1">Manage your ONE tokens and staking yields.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Balances & Staking */}
        <div className="lg:col-span-1 space-y-8">
          {/* Main Balance Card */}
          <div className="bg-card/80 border border-primary/40 p-6 clip-angled shadow-[0_0_30px_rgba(0,240,255,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
            <div className="text-sm font-display uppercase tracking-widest text-muted-foreground mb-2">Available Balance</div>
            <div className="text-5xl font-display font-bold text-white text-glow-primary">
              {wallet.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-2xl text-primary">ONE</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-1">Total Earned</div>
                <div className="text-xl font-mono text-accent">+{wallet.totalEarned.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-1">Total Spent</div>
                <div className="text-xl font-mono text-destructive">-{wallet.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          {/* Staking Controls */}
          <div className="bg-card/50 border border-white/10 p-6 clip-angled">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <Lock className="w-5 h-5 text-accent" />
              <div>
                <div className="text-sm font-display uppercase text-muted-foreground">Staked Assets</div>
                <div className="text-2xl font-mono text-white">{wallet.stakedAmount.toLocaleString()} ONE</div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-xs font-mono text-muted-foreground mb-1">Unclaimed Yield</div>
              <div className="text-xl font-mono text-accent">+{wallet.stakingRewards.toLocaleString()} ONE</div>
            </div>

            <div className="space-y-6">
              <form onSubmit={handleStake} className="flex items-end gap-3">
                <CyberInput 
                  type="number" 
                  step="0.01" 
                  label="Stake ONE" 
                  placeholder="0.00" 
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  max={wallet.balance}
                />
                <CyberButton type="submit" disabled={isStaking || !stakeAmount} className="shrink-0 h-[46px] px-4"><Lock className="w-4 h-4" /></CyberButton>
              </form>

              <form onSubmit={handleUnstake} className="flex items-end gap-3">
                <CyberInput 
                  type="number" 
                  step="0.01" 
                  label="Unstake ONE" 
                  placeholder="0.00" 
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  max={wallet.stakedAmount}
                />
                <CyberButton type="submit" variant="secondary" disabled={isUnstaking || !unstakeAmount} className="shrink-0 h-[46px] px-4"><Unlock className="w-4 h-4" /></CyberButton>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Transactions */}
        <div className="lg:col-span-2 bg-black/40 border border-white/5 p-6 clip-angled">
          <h2 className="text-2xl font-display uppercase text-white mb-6">Transaction Log</h2>
          
          {loadT ? (
            <div className="animate-pulse space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/5 rounded" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-muted-foreground font-mono py-10">No transactions recorded.</div>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => {
                const isPositive = ["BATTLE_REWARD", "STAKING_REWARD", "UNSTAKE"].includes(tx.type);
                const isTransfer = tx.type === "STAKE" || tx.type === "UNSTAKE";
                const colorClass = isTransfer ? "text-blue-400" : (isPositive ? "text-accent" : "text-destructive");
                const sign = isPositive || isTransfer ? "+" : "-";
                
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-card/60 border border-white/5 hover:bg-card transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-black", colorClass)}>
                        <TxIcon type={tx.type} />
                      </div>
                      <div>
                        <div className="font-display font-bold uppercase text-white">{tx.type.replace(/_/g, ' ')}</div>
                        <div className="text-xs font-mono text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, HH:mm")}</div>
                      </div>
                    </div>
                    <div className={cn("font-mono text-lg font-bold", colorClass)}>
                      {sign}{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TxIcon({ type }: { type: string }) {
  switch (type) {
    case 'MINT_FIGHTER': return <Pickaxe className="w-5 h-5" />;
    case 'TRAIN_FIGHTER': return <Activity className="w-5 h-5" />;
    case 'BATTLE_REWARD': return <Trophy className="w-5 h-5" />;
    case 'BATTLE_ENTRY': return <Swords className="w-5 h-5" />;
    case 'STAKE': return <Lock className="w-5 h-5" />;
    case 'UNSTAKE': return <Unlock className="w-5 h-5" />;
    case 'STAKING_REWARD': return <ArrowUpRight className="w-5 h-5" />;
    default: return <ArrowDownRight className="w-5 h-5" />;
  }
}
