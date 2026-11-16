import { BuyForm } from '@/components/buy-form';
import { PreorderTerms } from '@/components/preorder-terms';
import type { HomePageProps } from '../types';
import { GapExample } from './gap-example';
import { included, sources, steps } from './product';

export function ChoreAuditHome({
  product,
  available,
  price,
  shipBy,
  supportEmail,
}: HomePageProps) {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Pre-order · Delivered by {shipBy}</p>
          <h1>{product.tagline}</h1>
          <p className="lede">
            {product.name} is a 10-minute exercise for two. You each answer privately
            who does what around the house. It shows where your answers differ, then
            helps you give every chore (the trash, the bathroom, the dishes) one owner
            and a clear definition of done.
          </p>
          <BuyForm
            id="buy"
            available={available}
            price={price}
            shipBy={shipBy}
            purchaseUnit={product.purchaseUnit}
          />
        </div>
      </section>

      <section aria-labelledby="why">
        <div className="wrap">
          <h2 id="why">Why the same fight keeps happening</h2>
          <p>
            Most couples are not really fighting about the trash. They are working from
            two different pictures of who does what, and neither picture gets said out
            loud until someone is already annoyed.
          </p>
          <div className="stats">
            <figure className="stat">
              <p className="stat-number">43% vs 63%</p>
              <figcaption>
                In couples where both parents work full time, 43% of parents said the
                mother does more of the household chores. Asked about their own home,
                63% of the mothers said they do more.{' '}
                <a href={sources.pew.url} rel="noopener noreferrer">
                  {sources.pew.label}
                </a>
              </figcaption>
            </figure>
            <figure className="stat">
              <p className="stat-number">27% vs 15%</p>
              <figcaption>
                Among Americans in relationships, 27% of women said they sometimes argue
                with their partner about chores. 15% of men said the same.{' '}
                <a href={sources.yougov.url} rel="noopener noreferrer">
                  {sources.yougov.label}
                </a>
              </figcaption>
            </figure>
          </div>
          <p>
            A shared task list does not help with that, because it assumes you already
            agree. The audit starts one step earlier.
          </p>
        </div>
      </section>

      <section aria-labelledby="how" className="tinted">
        <div className="wrap">
          <h2 id="how">How it works</h2>
          <ol className="steps">
            {steps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <GapExample />
        </div>
      </section>

      <section aria-labelledby="included">
        <div className="wrap">
          <h2 id="included">What you get</h2>
          <ul className="checklist">
            {included.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <PreorderTerms
        productName={product.name}
        deliverable={product.deliverable}
        shipBy={shipBy}
        supportEmail={supportEmail}
      />

      <section aria-labelledby="faq">
        <div className="wrap">
          <h2 id="faq">Questions</h2>
          <dl className="faq">
            <dt>Is this an app?</dt>
            <dd>
              No. It runs in the browser on your phone or laptop. There is nothing to
              install.
            </dd>
            <dt>Do we both have to pay?</dt>
            <dd>No. One purchase covers both of you.</dd>
            <dt>Is this couples therapy?</dt>
            <dd>
              No. It is a practical tool for dividing housework. It is not counselling
              and cannot replace it.
            </dd>
            <dt>What happens to our answers?</dt>
            <dd>
              Your answers are shared only with your partner. The full privacy details
              for the audit will be published before it launches, and you can have a
              refund if you do not like them.
            </dd>
          </dl>
          <BuyForm
            available={available}
            price={price}
            shipBy={shipBy}
            purchaseUnit={product.purchaseUnit}
          />
        </div>
      </section>
    </>
  );
}
