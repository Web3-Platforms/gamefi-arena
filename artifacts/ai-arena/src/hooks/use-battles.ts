import { useQueryClient } from "@tanstack/react-query";
import {
  useListBattles,
  useCreateBattle,
  useGetBattle,
  getListBattlesQueryKey,
  getListFightersQueryKey,
  getGetWalletQueryKey,
  type ErrorType,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useBattleHistory() {
  return useListBattles();
}

export function useBattle(id: string) {
  return useGetBattle(id);
}

export function useCreateBattleHook() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useCreateBattle({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListBattlesQueryKey() });
        qc.invalidateQueries({ queryKey: getListFightersQueryKey() });
        qc.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      },
      onError: (err: ErrorType<unknown>) => {
        toast({
          title: "Battle Initiation Failed",
          description: err.message || "Could not start the battle.",
          variant: "destructive",
        });
      },
    },
  });
}
