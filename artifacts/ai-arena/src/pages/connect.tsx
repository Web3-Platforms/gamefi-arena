import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useConnectHook, useAuthSession } from "@/hooks/use-auth";
import { CyberButton, CyberInput } from "@/components/CyberUI";
import { Cpu } from "lucide-react";

export default function ConnectPage() {
  const [address, setAddress] = useState("");
  const [, setLocation] = useLocation();
  const { mutate: connect, isPending, isSuccess } = useConnectHook();
  const { data: session } = useAuthSession();

  useEffect(() => {
    if (isSuccess || session) {
      setLocation("/");
    }
  }, [isSuccess, session, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAddress = address.trim();
    if (!trimmedAddress) return;
    localStorage.setItem("walletAddress", trimmedAddress);
    connect({ data: { walletAddress: trimmedAddress } });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
      <div className="absolute w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />
      
      <div className="relative z-10 w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border border-primary/30 clip-angled shadow-[0_0_50px_rgba(0,240,255,0.1)]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-black border-2 border-primary clip-angled mb-6 flex items-center justify-center glow-primary">
            <Cpu className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white uppercase tracking-widest text-glow-primary">
            AI ARENA
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-2">
            Establish Neural Link to Continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <CyberInput 
              label="Wallet Address (Simulated)"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground text-left px-1">
              Enter any string to create or load an account.
            </p>
          </div>

          <CyberButton 
            type="submit" 
            className="w-full h-14 text-lg" 
            disabled={isPending}
          >
            {isPending ? "Connecting..." : "Initialize Link"}
          </CyberButton>
        </form>
      </div>
    </div>
  );
}
