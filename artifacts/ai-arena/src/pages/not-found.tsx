import { useLocation } from "wouter";
import { CyberButton } from "@/components/CyberUI";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="w-16 h-16 text-secondary animate-pulse" />
          <div>
            <div className="text-8xl font-display font-bold text-primary text-glow-primary">404</div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-white mt-2">
              Signal Lost
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          The node you're looking for doesn't exist on the network.
        </p>
        <CyberButton onClick={() => setLocation("/")}>
          Return to HQ
        </CyberButton>
      </div>
    </div>
  );
}
