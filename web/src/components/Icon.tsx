type IconName =
  | 'leaf'
  | 'truck'
  | 'shopping'
  | 'shield'
  | 'phone'
  | 'spark'
  | 'pin'
  | 'bag'
  | 'user'
  | 'clock'
  | 'map'

const paths: Record<IconName, string> = {
  leaf: 'M6 16c7-1 12-6 14-14-8 0-14 6-14 14 0 5 3 8 8 8 8 0 14-6 14-14 0-5-3-8-8-8-3 0-6 1-8 4',
  truck:
    'M3 7h11v10H3zM14 10h4l3 3v4h-7zm2 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM6 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z',
  shopping:
    'M4 6h2l1.5 9h10L20 9H8m1 12a1.5 1.5 0 1 0 0.01 0M16 21a1.5 1.5 0 1 0 0.01 0',
  shield: 'M12 3l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V6l7-3z',
  phone: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 15h2',
  spark: 'M12 4l1.8 4.2L18 10l-4.2 1.8L12 16l-1.8-4.2L6 10l4.2-1.8L12 4z',
  pin: 'M12 21s6-6 6-11a6 6 0 1 0-12 0c0 5 6 11 6 11zm0-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z',
  bag: 'M6 8h12l-1 12H7L6 8zm3 0a3 3 0 0 1 6 0',
  user: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-6 8a6 6 0 0 1 12 0',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  map: 'M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6zm5-2v14m6-12v14',
}

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  )
}

export type { IconName }