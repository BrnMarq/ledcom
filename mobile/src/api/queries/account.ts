import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../client';

export const ACCOUNT_KEYS = {
  all: ['accounts'] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNT_KEYS.all,
    queryFn: async () => {
      const response = await client.get('/api/accounts');
      return response.data;
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newAccount: { name: string; symbol: string }) => {
      const response = await client.post('/api/accounts', newAccount);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all });
    },
  });
}
