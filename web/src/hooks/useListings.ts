import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listingsApi } from '../lib/apiCalls'
import { useAuthStore } from '../store/auth.store'
import type { CreateListingFormData } from '../schemas'
import type { Listing } from '../types/api'

/**
 * Backend GET /listings response envelope:
 *   { success, data: { data: Listing[], meta: PaginationMeta } }
 *
 * Backend GET /listings/:id response envelope:
 *   { success, data: { listing: Listing } }
 *
 * Backend POST/PATCH /listings response envelope:
 *   { success, data: { listing: Listing } }
 */

/** Fetch listings belonging to a specific farmer (farmer role: self, agent role: selected client) */
export function useMyListings(selectedFarmerId?: string) {
  const user = useAuthStore((s) => s.user)
  const farmerId = user?.role === 'farmer' ? user.id : selectedFarmerId

  return useQuery<Listing[]>({
    queryKey: ['listings', 'mine', farmerId],
    queryFn: () =>
      listingsApi
        .getAll({ farmerId: farmerId })
        // data.data is { data: Listing[], meta: {} } — extract the array
        .then((r) => (r.data.data.data ?? []) as Listing[]),
    enabled: !!farmerId,
  })
}

/** Fetch all active listings with optional filters */
export function useAllListings(
  params?: Record<string, string | number | undefined>,
) {
  return useQuery<Listing[]>({
    queryKey: ['listings', 'all', params],
    queryFn: () =>
      listingsApi
        .getAll(params)
        .then((r) => (r.data.data.data ?? []) as Listing[]),
  })
}

/** Fetch a single listing by UUID */
export function useListing(id: string) {
  return useQuery<Listing>({
    queryKey: ['listings', id],
    queryFn: () =>
      listingsApi.getById(id).then((r) => r.data.data.listing as Listing),
    enabled: !!id,
  })
}

/** POST /listings — create a new listing */
export function useCreateListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateListingFormData & { farmerId?: string }) =>
      listingsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings'] }),
  })
}

/** PATCH /listings/:id — update one or more fields */
export function useUpdateListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<CreateListingFormData & { status: string }>
    }) => listingsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings'] }),
  })
}

/** DELETE /listings/:id — soft-cancel */
export function useDeleteListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => listingsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings'] }),
  })
}
