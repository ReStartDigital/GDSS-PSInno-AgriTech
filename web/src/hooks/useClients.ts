import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../lib/apiCalls'

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
      usersApi.getClients().then((r) => r.data.data.data as Client[]),
  })
}

export function useRegisterClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterClientData) =>
      usersApi.registerClient(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUnassignClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (clientId: string) =>
      usersApi.unassignClient(clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
