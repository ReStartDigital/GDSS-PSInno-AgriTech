import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '../lib/apiCalls'
import type { PlaceOrderFormData } from '../schemas'
import type { Order } from '../types/api'

/**
 * Orders backend endpoints are not yet implemented.
 * These hooks will land in their error state (404) until the backend
 * orders feature is built. The hooks are structured to match the expected
 * backend response envelope when it is ready:
 *   GET  /orders         → { success, data: { data: Order[], meta } }
 *   GET  /orders/:id     → { success, data: { order: Order } }
 *   POST /orders         → { success, data: { order: Order } }
 *   PATCH /orders/:id/confirm → { success, data: { order: Order } }
 *   PATCH /orders/:id/cancel  → { success, data: { order: Order } }
 */

export function useMyOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () =>
      ordersApi.getMyOrders().then((r) => (r.data.data ?? []) as Order[]),
  })
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ['orders', id],
    queryFn: () =>
      ordersApi.getById(id).then((r) => r.data.data as Order),
    enabled: !!id,
  })
}

export function usePlaceOrder(listingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PlaceOrderFormData) =>
      ordersApi.place(listingId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useConfirmOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ordersApi.confirm(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      ordersApi.cancel(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
