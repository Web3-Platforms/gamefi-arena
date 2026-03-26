import { useStats } from "@/hooks/use-stats";
import { CyberButton } from "@/components/CyberUI";
import { Link } from "wouter";
import { Users, Swords, Trophy, Coins } from "lucide-react";
import { FighterCard } from "@/components/FighterCard";

export default function Home() {
  const { data: stats, isLoading } = useStats();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0 bg-background">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Cyberpunk Arena" 
            className="w-full h-full object-cover opacity-30 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-12">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 uppercase tracking-[0.2em] text-glow-primary">
            Dominate the <span className="text-primary">Grid</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-body mb-10 max-w-2xl mx-auto">
            Mint unique AI fighters, train their neural networks, and battle on-chain to earn ONE tokens. Only the strongest algorithms survive.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/arena">
              <CyberButton size="lg" variant="primary">Enter Arena</CyberButton>
            </Link>
            <Link href="/fighters">
              <CyberButton size="lg" variant="outline">My Roster</CyberButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <StatBox icon={Users} label="Total Players" value={stats?.totalUsers ?? 0} loading={isLoading} />
            <StatBox icon={Swords} label="Battles Fought" value={stats?.totalBattles ?? 0} loading={isLoading} />
            <StatBox icon={Trophy} label="AI Fighters" value={stats?.totalFighters ?? 0} loading={isLoading} />
            <StatBox icon={Coins} label="ONE Distributed" value={stats?.totalOneDistributed?.toLocaleString() ?? 0} loading={isLoading} color="text-accent" />
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold uppercase tracking-widest text-white inline-flex items-center gap-3">
              <Trophy className="text-secondary w-8 h-8" />
              Global Leaderboard
            </h2>
            <div className="w-24 h-1 bg-secondary mx-auto mt-4 glow-secondary" />
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stats?.topFighters?.map((fighter, i) => (
                <div key={fighter.id} className="relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary text-white font-bold flex items-center justify-center z-20 clip-angled-sm">
                    #{i + 1}
                  </div>
                  <FighterCard fighter={fighter} compact />
                </div>
              ))}
              {(!stats?.topFighters || stats.topFighters.length === 0) && (
                <div className="col-span-full text-center text-muted-foreground p-12 bg-card/30 border border-white/5 clip-angled">
                  No fighters have entered the arena yet.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, loading, color = "text-primary" }: any) {
  return (
    <div className="bg-card/40 border border-white/5 p-6 clip-angled flex flex-col items-center text-center hover:bg-card/60 transition-colors">
      <Icon className={`w-8 h-8 ${color} mb-3`} />
      {loading ? (
        <div className="h-8 w-16 bg-white/10 animate-pulse rounded mb-1" />
      ) : (
        <div className="text-3xl font-display font-bold text-white mb-1">{value}</div>
      )}
      <div className="text-xs font-mono text-muted-foreground uppercase">{label}</div>
    </div>
  );
}
