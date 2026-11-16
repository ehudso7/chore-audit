'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="narrow">
      <div className="wrap">
        <h1>Something went wrong on our side.</h1>
        <p>You have not been charged by this page. Try again in a moment.</p>
        <p>
          <button type="button" className="button" onClick={reset}>
            Try again
          </button>
        </p>
      </div>
    </section>
  );
}
