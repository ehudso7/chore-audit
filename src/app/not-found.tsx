import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="narrow">
      <div className="wrap">
        <h1>That page does not exist.</h1>
        <p>
          <Link href="/">Back to the home page</Link>
        </p>
      </div>
    </section>
  );
}
