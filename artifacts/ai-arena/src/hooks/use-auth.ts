import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetSession, 
  useConnectWallet, 
  useDisconnectWallet,
  getGetSessionQueryKey 
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useAuthSession() {
  return useGetSession({
    query: {
      queryKey: getGetSessionQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  });
}

export function useConnectHook() {
  const qc = useQueryClient();
  const { toast } = useToast();
  
  return useConnectWallet({
    mutation: {
      onSuccess: (data) => {
        qc.setQueryData(getGetSessionQueryKey(), { user: data.user, wallet: data.wallet });
        toast({
          title: "Wallet Connected",
          description: `Welcome back to the Arena.`,
        });
      },
      onError: (err: any) => {
        toast({
          title: "Connection Failed",
          description: err.message || "Could not connect wallet.",
          variant: "destructive"
        });
      }
    }
  });
}

export function useDisconnectHook() {
  const qc = useQueryClient();
  const { toast } = useToast();
  
  return useDisconnectWallet({
    mutation: {
      onSuccess: () => {
        qc.setQueryData(getGetSessionQueryKey(), null);
        qc.clear();
        localStorage.removeItem("walletAddress");
        toast({
          title: "Disconnected",
          description: "Wallet safely disconnected.",
        });
      }
    }
  });
}
