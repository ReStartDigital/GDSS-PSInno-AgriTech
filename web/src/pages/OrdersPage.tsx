import { Icon } from '../components/Icon'
import { orderItems, type PageKey } from '../content'

export default function OrdersPage({ navigate }: { navigate: (page: PageKey) => void }) {
  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Orders</p>
          <h2>Clear order states for buyers, farmers, agents, and transporters.</h2>
          <p>
            Each order surfaces the current actor, payment state, and next action so the
            flow stays easy to scan.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={() => navigate('profile')}>
          Open profile
        </button>
      </section>

      <section className="listing-grid">
        {orderItems.map((order) => (
          <article className="listing-card wide" key={order.id}>
            <div className="listing-top">
              <span className="listing-badge">{order.status}</span>
              <Icon name="truck" />
            </div>
            <h3>{order.id}</h3>
            <p>
              {order.name} • {order.actor}
            </p>
            <div className="listing-meta">
              <span>{order.amount}</span>
              <span>{order.eta}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Lifecycle</p>
              <h3>Readable status progression.</h3>
            </div>
          </div>
          <div className="timeline">
            <div className="timeline-item">Order received</div>
            <div className="timeline-item">Payment verified</div>
            <div className="timeline-item">Transport assigned</div>
            <div className="timeline-item">Delivery complete</div>
          </div>
        </div>

        <div className="section-card accent-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Status handling</p>
              <h3>SMS-aware confirmation states.</h3>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-card dark">
              <Icon name="phone" />
              <strong>Pending SMS</strong>
              <p>Show a non-blocking waiting state when backend confirmations are external.</p>
            </div>
            <div className="detail-card dark">
              <Icon name="clock" />
              <strong>Action required</strong>
              <p>Highlight only the current step so the next move is obvious.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}