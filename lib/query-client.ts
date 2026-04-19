import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

export function getApiUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  if (Platform.OS === 'web') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export { queryClient };
export default queryClient;
