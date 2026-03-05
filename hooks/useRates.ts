import { useQuery } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';

// sendAmount is intentionally NOT in the queryKey.
// Rates do not change with amount — recipient is computed locally as rate × sendAmount.
// Only corridor change triggers a new fetch.
export function useRates() {
  const corridor = useAppStore((s) => s.corridor);
  const sendAmount = useAppStore((s) => s.sendAmount);
  const setCachedRates = useAppStore((s) => s.setCachedRates);
  const { isConnected } = useNetInfo();

  const query = useQuery({
    queryKey: ['rates', corridor.from, corridor.to],
    queryFn: async () => {
      const data = await api.getRates(corridor.from, corridor.to, sendAmount);
      setCachedRates(`${corridor.from}-${corridor.to}`, data.providers);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    retry: 2,
    enabled: isConnected !== false,
  });

  return query;
}
