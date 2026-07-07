import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listingsApi } from '../lib/apiCalls'
import { useAuthStore } from '../store/auth.store'
import type { CreateListingFormData } from '../schemas'
import type { Listing } from '../types/api'

export function useMyListings(selectedFarmerId?: string) {
  const user = useAuthStore((s) => s.user)
  const farmerId = user?.role === 'farmer' ? user.id : selectedFarmerId

  return useQuery<Listing[]>({
    queryKey: ['listings', 'mine', farmerId],
    queryFn: () => {
      if (farmerId) {
        return listingsApi.getAll({ farmer_id: farmerId }).then((r) => r.data.data as Listing[])
      }
      return Promise.resolve([])
    },
    enabled: !!farmerId,
  })
}

export function useAllListings(params?: Record<string, string>) {
  return useQuery<Listing[]>({
    queryKey: ['listings', 'all', params],
    queryFn: () => listingsApi.getAll(params).then((r) => r.data.data as Listing[]),
  })
}

export function useListing(id: string) {
  return useQuery<Listing>({
    queryKey: ['listings', id],
    queryFn: () => listingsApi.getById(id).then((r) => r.data.data as Listing),
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
