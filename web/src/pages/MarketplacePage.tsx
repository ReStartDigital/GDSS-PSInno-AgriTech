import { Icon } from '../components/Icon'
import { marketplaceListings, type PageKey } from '../content'

export default function MarketplacePage({ navigate }: { navigate: (page: PageKey) => void }) {
  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h2>Buyer-facing produce discovery with fast scanning and clear pricing.</h2>
          <p>
            The layout uses large readable cards, high-contrast labels, and soft green cues
            to keep the buying flow calm and easy to scan.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={() => navigate('orders')}>
          View orders
        </button>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Filters</p>
            <h3>Choose by crop, freshness, and location.</h3>
          </div>
        </div>

        <div className="filter-row">
          <button type="button" className="filter-chip active">All produce</button>
          <button type="button" className="filter-chip">Fresh</button>
          <button type="button" className="filter-chip">Urgent sale</button>
          <button type="button" className="filter-chip">Near me</button>
        </div>
      </section>

      <section className="listing-grid">
        {marketplaceListings.map((listing) => (
          <article className="listing-card" key={listing.name}>
            <div className="listing-top">
              <span className="listing-badge">{listing.freshness}</span>
              <Icon name={listing.icon} />
            </div>
            <h3>{listing.name}</h3>
            <p>{listing.farm}</p>
            <div className="listing-meta">
              <span>{listing.price}</span>
              <span>{listing.location}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Map preview</p>
              <h3>Location-aware browsing stays lightweight.</h3>
            </div>
          </div>
          <div className="map-preview">
            <span>Greater Accra cluster</span>
            <strong>12 listings in your radius</strong>
            <p>Use the map on demand; cards stay readable without heavy visual noise.</p>
          </div>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Actions</p>
              <h3>Buyer workflow shortcuts.</h3>
            </div>
          </div>
          <div className="quick-links">
            <button type="button" className="quick-link">
              <Icon name="shopping" /> Add to cart
            </button>
            <button type="button" className="quick-link">
              <Icon name="truck" /> Request delivery
            </button>
            <button type="button" className="quick-link">
              <Icon name="clock" /> Hold for review
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}