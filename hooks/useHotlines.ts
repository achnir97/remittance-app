import { useQuery } from '@tanstack/react-query';
import { legalApi } from '../services/legal';

export function useHotlines() {
  return useQuery({
    queryKey: ['legal', 'hotlines'],
    queryFn: legalApi.getHotlines,
    staleTime: 1000 * 60 * 60 * 24,  // 24 hours — hotlines are static data
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days for offline use
    retry: 1,
  });
}
