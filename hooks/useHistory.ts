import { useQuery } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export function useHistory(days: number) {
  const corridor = useAppStore((s) => s.corridor);
  const { isConnected } = useNetInfo();

  return useQuery({
    queryKey: ['history', corridor.to, days],
    queryFn: () => api.getHistory(corridor.from, corridor.to, days),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 2,
    enabled: isConnected !== false,
  });
}
