import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transportApi } from '../lib/apiCalls'

export interface Job {
  id: string
  orderId: string
  transporterId: string | null
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled'
  costGhs: number
  distanceKm: number
  route: string
  createdAt: string
  order?: any
}

export function useJobs() {
  return useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => transportApi.getJobs().then((r) => r.data.data as Job[]),
  })
}

export function useAcceptJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transportApi.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateJobStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      transportApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
