interface FormActionsProps {
  onCancel: () => void
  submitLabel: string
  cancelLabel?: string
  isPending: boolean
  pendingLabel?: string
}

/**
 * Standard two-button form footer: [Cancel] [Submit].
 * Replaces the repeated flex+gap button row in CreateListingForm and OrderModal.
 */
export function FormActions({
  onCancel,
  submitLabel,
  cancelLabel = 'Cancel',
  isPending,
  pendingLabel,
}: FormActionsProps) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
      <button
        type="button"
        className="secondary-button"
        onClick={onCancel}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        className="primary-button"
        disabled={isPending}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        {isPending ? (pendingLabel ?? `${submitLabel}…`) : submitLabel}
      </button>
    </div>
  )
}
