import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface Client {
  id: string
  phone: string
  firstName: string
  lastName: string
  email?: string | null
  isActive: boolean
  createdAt: string
}

export interface RegisterClientData {
  phone: string
  firstName: string
  lastName: string
  email?: string
}

export function useMyClients() {
  return useQuery<Client[]>({
    queryKey: ['clients', 'mine'],
    queryFn: () =>
      api.get('/users/agent/clients').then((r) => r.data.data.data as Client[]),
  })
}

export function useRegisterClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterClientData) =>
      api.post('/users/agent/clients', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUnassignClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (clientId: string) =>
      api.patch(`/users/agent/clients/${clientId}/unassign`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
