import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '../lib/apiCalls'
import type { PlaceOrderFormData } from '../schemas'

export function useMyOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getMyOrders().then((r) => r.data.data),
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function usePlaceOrder(listingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PlaceOrderFormData) => ordersApi.place(listingId, data),
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
    mutationFn: ({ id, reason }: { id: string; reason: string }) => ordersApi.cancel(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
