import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'

function extractMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const r = (error as { response?: { data?: { error?: { message?: string } } } }).response
    if (r?.data?.error?.message) return r.data.error.message
  }
  return 'Something went wrong. Please try again.'
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => console.error('[Query]', extractMessage(error)),
  }),
  mutationCache: new MutationCache({
    onError: (error) => console.error('[Mutation]', extractMessage(error)),
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
