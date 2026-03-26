import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWallet,
  useListTransactions,
  useStakeTokens,
  useUnstakeTokens,
  getGetWalletQueryKey,
  getListTransactionsQueryKey,
  type ErrorType,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useWallet() {
  return useGetWallet();
}

export function useTransactions() {
  return useListTransactions();
}

export function useStakeHook() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useStakeTokens({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetWalletQueryKey() });
        qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        toast({
          title: "Tokens Staked",
          description: "Your ONE tokens are now earning rewards.",
        });
      },
      onError: (err: ErrorType<unknown>) => {
        toast({
          title: "Staking Failed",
          description: err.message || "Failed to stake tokens.",
          variant: "destructive",
        });
      },
    },
  });
}

export function useUnstakeHook() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useUnstakeTokens({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetWalletQueryKey() });
        qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        toast({
          title: "Tokens Unstaked",
          description: "Your ONE tokens have been returned to your balance.",
        });
      },
      onError: (err: ErrorType<unknown>) => {
        toast({
          title: "Unstaking Failed",
          description: err.message || "Failed to unstake tokens.",
          variant: "destructive",
        });
      },
    },
  });
}
