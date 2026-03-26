import { useQueryClient } from "@tanstack/react-query";
import {
  useListFighters,
  useMintFighter,
  useListAllFighters,
  useGetFighter,
  useTrainFighter,
  getListFightersQueryKey,
  getListAllFightersQueryKey,
  getGetFighterQueryKey,
  type ErrorType,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useMyFighters() {
  return useListFighters();
}

export function useAllFighters() {
  return useListAllFighters();
}

export function useFighter(id: string) {
  return useGetFighter(id);
}

export function useMintFighterHook() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMintFighter({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListFightersQueryKey() });
        qc.invalidateQueries({ queryKey: getListAllFightersQueryKey() });
        toast({
          title: "Fighter Minted",
          description: "A new AI warrior joins your roster.",
        });
      },
      onError: (err: ErrorType<unknown>) => {
        toast({
          title: "Minting Failed",
          description: err.message || "Failed to mint fighter.",
          variant: "destructive",
        });
      },
    },
  });
}

export function useTrainFighterHook() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useTrainFighter({
    mutation: {
      onSuccess: (data, variables) => {
        qc.invalidateQueries({ queryKey: getListFightersQueryKey() });
        qc.invalidateQueries({ queryKey: getGetFighterQueryKey(variables.id) });
        toast({
          title: "Training Complete",
          description: `${data.fighter.name} improved ${data.statImproved} by +${(data.improvement * 100).toFixed(1)}%!`,
        });
      },
      onError: (err: ErrorType<unknown>) => {
        toast({
          title: "Training Failed",
          description: err.message || "Not enough ONE tokens or server error.",
          variant: "destructive",
        });
      },
    },
  });
}
