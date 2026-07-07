interface PageHeroProps {
  eyebrow: string
  title: string
  description?: string
  action?: React.ReactNode
}

/**
 * Shared hero banner used at the top of every main page.
 * Replaces the repeated `<section className="page-hero">` pattern.
 */
export function PageHero({ eyebrow, title, description, action }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </section>
  )
}
