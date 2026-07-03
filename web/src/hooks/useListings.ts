import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listingsApi } from '../lib/apiCalls'
import type { CreateListingFormData } from '../schemas'

export function useMyListings() {
  return useQuery({
    queryKey: ['listings', 'mine'],
    queryFn: () => listingsApi.getMyListings().then((r) => r.data.data),
  })
}

export function useAllListings(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['listings', 'all', params],
    queryFn: () => listingsApi.getAll(params).then((r) => r.data.data),
  })
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: () => listingsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateListingFormData) => listingsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings'] }),
  })
}

export function useDeleteListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => listingsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings'] }),
  })
}
