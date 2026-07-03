import { Icon } from '../components/Icon'
import { farmerListings, type PageKey } from '../content'

export default function ListingsPage({ navigate }: { navigate: (page: PageKey) => void }) {
  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">My Listings</p>
          <h2>Farmer inventory with GPS-aware status and quick management.</h2>
          <p>
            Listings stay compact on web while still surfacing price, availability, and
            the next required action.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={() => navigate('auth')}>
          Create new listing
        </button>
      </section>

      <section className="listing-grid">
        {farmerListings.map((item) => (
          <article className="listing-card wide" key={item.title}>
            <div className="listing-top">
              <span className="listing-badge">{item.status}</span>
              <Icon name="leaf" />
            </div>
            <h3>{item.title}</h3>
            <p>{item.note}</p>
            <div className="listing-meta">
              <span>{item.price}</span>
              <span>{item.location}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Creation</p>
              <h3>Camera and GPS ready.</h3>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-card">
              <Icon name="map" />
              <strong>Auto location</strong>
              <p>Capture the field position before publishing.</p>
            </div>
            <div className="detail-card">
              <Icon name="phone" />
              <strong>Photo upload</strong>
              <p>Show one produce image per listing to keep browsing fast.</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Publishing</p>
              <h3>Lifecycle notes.</h3>
            </div>
          </div>
          <div className="timeline">
            <div className="timeline-item">Draft listing</div>
            <div className="timeline-item">Upload image</div>
            <div className="timeline-item">Pin location</div>
            <div className="timeline-item">Publish live</div>
          </div>
        </div>
      </section>
    </div>
  )
}