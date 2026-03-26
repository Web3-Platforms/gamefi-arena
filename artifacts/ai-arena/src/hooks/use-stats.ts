import { useGetPlatformStats } from "@workspace/api-client-react";

export function useStats() {
  return useGetPlatformStats();
}
