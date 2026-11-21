import { Fragment } from 'react';
import { BuyForm } from '@/components/buy-form';
import { PreorderTerms } from '@/components/preorder-terms';
import type { HomePageProps } from '../types';
import { faq, included, steps } from './product';

export function AnimeStarterPackHome({
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
            Tell us the shows they already love. We pick five anime that fit their taste
            and put them in the order to watch. It is a gift from you, built around
            them.
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

      <section aria-labelledby="how">
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
        </div>
      </section>

      <section aria-labelledby="included" className="tinted">
        <div className="wrap">
          <h2 id="included">What is in the pack</h2>
          <ul className="checklist">
            {included.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="compare">
        <div className="wrap">
          <h2 id="compare">Why not a top-ten list or a chatbot?</h2>
          <p>
            You can use either, and both are free. A top-ten list is written for
            everyone. A chatbot answers the fan who asked it.
          </p>
          <p>
            This starts from the other person&apos;s taste, screens out what puts
            newcomers off, and arrives as a gift instead of homework. A person checks
            every title in our catalogue by hand.
          </p>
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
            <dt>When do I get it?</dt>
            <dd>
              On or before {shipBy}. You get an email with a private link as soon as it
              is ready.
            </dd>
            {faq.map((entry) => (
              <Fragment key={entry.question}>
                <dt>{entry.question}</dt>
                <dd>{entry.answer}</dd>
              </Fragment>
            ))}
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
