import { Link, useLocation } from "wouter";
import { useAuthSession, useDisconnectHook } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { truncate, cn } from "@/lib/utils";
import { Coins, LogOut, Swords, User, Activity, Wallet, Trophy } from "lucide-react";
import { CyberButton } from "./CyberUI";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: session } = useAuthSession();
  const { data: wallet } = useWallet();
  const { mutate: disconnect } = useDisconnectHook();

  const navLinks = [
    { href: "/", label: "HQ", icon: Trophy },
    { href: "/fighters", label: "Roster", icon: User },
    { href: "/arena", label: "Arena", icon: Swords },
    { href: "/training", label: "Training", icon: Activity },
    { href: "/wallet", label: "Wallet", icon: Wallet },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary/10 border border-primary clip-angled-sm flex items-center justify-center group-hover:glow-primary transition-all">
                <Swords className="w-6 h-6 text-primary" />
              </div>
              <span className="font-display text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 group-hover:from-primary group-hover:to-secondary transition-all">
                AI ARENA
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "px-4 py-2 flex items-center gap-2 font-display uppercase tracking-wider text-sm transition-all clip-angled-sm",
                      isActive 
                        ? "bg-primary/20 text-primary border-b-2 border-primary" 
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Meta */}
            {session && (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-accent font-mono text-sm">
                    <Coins className="w-4 h-4" />
                    <span>{wallet?.balance?.toLocaleString() ?? "0"} ONE</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {truncate(session.user?.walletAddress)}
                  </div>
                </div>
                <button 
                  onClick={() => disconnect()}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav Bar (Bottom) */}
      <nav className="md:hidden fixed bottom-0 w-full z-40 bg-background/90 backdrop-blur-lg border-t border-white/10 flex justify-around p-2">
        {navLinks.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "p-3 flex flex-col items-center gap-1 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-display uppercase">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
