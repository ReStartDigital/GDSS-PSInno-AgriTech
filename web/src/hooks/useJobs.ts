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
  pickupLocation?: {
    type: 'Point'
    coordinates: [number, number]
  }
  dropoffLocation?: {
    type: 'Point'
    coordinates: [number, number]
  }
}

function mapBackendJob(job: any): Job {
  let mappedStatus = job.status
  if (job.status === 'open') mappedStatus = 'pending'
  else if (job.status === 'accepted') mappedStatus = 'assigned'
  else if (job.status === 'en_route') mappedStatus = 'in_transit'

  const pickupName = job.order?.listing?.farmer?.region || 'Farm'
  const dropoffName = job.order?.deliveryAddress || 'Buyer'
  const route = `${pickupName} to ${dropoffName}`

  return {
    ...job,
    status: mappedStatus,
    costGhs: Number(job.estimatedCostGhs || job.estimated_cost_ghs || 0),
    route: job.route || route,
  } as Job
}

export function useJobs() {
  return useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () =>
      transportApi.getJobs().then((r) => {
        const resData = r.data
        let jobs: any[] = []
        if (resData.success && Array.isArray(resData.data)) {
          jobs = resData.data
        } else if (resData.success && resData.data && Array.isArray(resData.data.data)) {
          jobs = resData.data.data
        }
        return jobs.map(mapBackendJob)
      }),
  })
}

export function useMyTransporterJobs() {
  return useQuery<Job[]>({
    queryKey: ['my-jobs'],
    queryFn: () =>
      transportApi.getMyJobs().then((r) => {
        const resData = r.data
        let jobs: any[] = []
        if (resData.success && Array.isArray(resData.data)) {
          jobs = resData.data
        } else if (resData.success && resData.data && Array.isArray(resData.data.data)) {
          jobs = resData.data.data
        }
        return jobs.map(mapBackendJob)
      }),
  })
}

export function useAcceptJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transportApi.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['my-jobs'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateJobStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, pin }: { id: string; status: string; pin?: string }) => {
      if (status === 'in_transit' || status === 'arrived') {
        return transportApi.arrive(id)
      }
      if (status === 'delivered') {
        return transportApi.confirmDelivery(id, pin ?? '')
      }
      throw new Error(`Unsupported status action: ${status}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['my-jobs'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
