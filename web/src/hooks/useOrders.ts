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
      ordersApi.getMyOrders().then((r) => {
        const resData = r.data
        if (resData.success && Array.isArray(resData.data)) {
          return resData.data as Order[]
        }
        if (resData.success && resData.data && Array.isArray(resData.data.data)) {
          return resData.data.data as Order[]
        }
        return [] as Order[]
      }),
  })
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ['orders', id],
    queryFn: () =>
      ordersApi.getById(id).then((r) => {
        const resData = r.data
        if (resData.success && resData.data) {
          return (resData.data.order ?? resData.data) as Order
        }
        return {} as Order
      }),
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

export function useNegotiateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, counterPricePerKgGhs }: { id: string; counterPricePerKgGhs: number }) =>
      ordersApi.negotiate(id, counterPricePerKgGhs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useReadyPickupOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ordersApi.readyPickup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useVerifyPickupOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => ordersApi.verifyPickup(id, pin),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
