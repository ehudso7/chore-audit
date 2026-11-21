import type { ProductDefinition } from '../types';

/**
 * "Anime Starter Pack" is a working name. No trademark or domain search has
 * been done; do both before spending on marketing.
 *
 * Copy rules for this product, which the tests enforce where they can:
 *  - No studio, series or character names, and no artwork. The page names no
 *    title at all; the pack itself will name titles as plain text only.
 *  - No testimonials, sales counts or promises that the recipient will like
 *    the picks. None exist yet.
 *  - No price in any copy. The price is configuration (PRICE_CENTS).
 */
export const animeStarterPack: ProductDefinition = {
  key: 'anime-starter-pack',
  name: 'Anime Starter Pack',
  tagline: 'The right first anime for someone who "doesn\'t watch anime."',
  description:
    'Tell us what they already watch. We pick five anime that fit, in the order to watch them. A one-time gift with no account and no subscription.',
  stripeProductKey: 'anime-starter-pack-preorder',
  defaultPriceCents: 900,
  purchaseUnit: 'pack',
  checkoutSummary: 'One-time purchase of one pack for one recipient.',
  deliverable: 'pack link',
  footerNote:
    'Anime Starter Pack is an independent recommendation service. It is not affiliated with, sponsored by or endorsed by any studio, publisher or streaming service. Titles are named for identification only and belong to their respective owners.',
  legal: {
    whatYouAreBuying:
      'a personalised list of five anime titles for one recipient, in a suggested watch order, with a short reason, the time commitment and content notes for each, delivered as a private web page with a printable card. It does not include access to any anime or to any streaming service',
    usingIt:
      'Each pack is for one recipient, as a gift or for yourself. Please do not resell it. You must be 18 or older to buy.',
    whatItIsNot:
      'an independent recommendation service. It is not affiliated with, sponsored by or endorsed by any studio, publisher or streaming service, it does not provide the titles it recommends, and it does not promise that the recipient will enjoy every pick.',
    privacyAtLaunch: {
      heading: 'When packs are delivered',
      body: 'Building a pack will store the quiz answers given for the recipient and, if you choose to give it, their first name. We do not need the recipient\'s email address. We will publish exactly how that information is stored and for how long before any pack is delivered. If you do not like what you read, you can have a full refund.',
    },
  },
};

export const steps = [
  {
    title: 'Pre-order',
    body: 'Pay once. There is no account to create and no subscription.',
  },
  {
    title: 'Tell us their taste',
    body: 'Pick the shows and films they already love from our list and answer four quick questions about pace, tone and what they cannot stand. Fill it in yourself to keep it a surprise, or send them the link.',
  },
  {
    title: 'They get their pack',
    body: 'Five titles in watch order on a private page, plus a printable card to hand over.',
  },
] as const;

export const included = [
  'Five titles, ordered from the easiest way in to the deeper cut',
  'A one-line reason for each, tied to something they already like',
  'The time each one takes: episode count and total hours',
  'Whether an English dub exists or it is subtitles only',
  'Plain notes on violence and fan service, so nothing ambushes them',
  'A "skip this if" line for each, so one miss does not end the experiment',
] as const;

export const faq = [
  {
    question: 'Is this a subscription?',
    answer: 'No. You pay once.',
  },
  {
    question: 'Does the pack include the shows themselves?',
    answer:
      'No. The pack tells them what to watch and in what order. Watching needs a streaming service or a disc, which is not included.',
  },
  {
    question: 'Does it say where to stream each title?',
    answer:
      'Not in this version. Streaming catalogues differ by country and change often, so we name the titles and leave the service to you.',
  },
  {
    question: 'Do they need an account?',
    answer: 'No. The link is all they need.',
  },
  {
    question: 'What if they have already seen some anime?',
    answer: 'The quiz asks. Anything they have seen is left out.',
  },
  {
    question: 'Can I buy one for a friend instead of a partner?',
    answer: 'Yes. A pack is for one person, whoever they are.',
  },
  {
    question: 'What do you keep about us?',
    answer:
      'Your email, for the receipt and the link, and the quiz answers. We do not need the recipient\'s email. Ask and we delete it all, apart from the payment record we must keep for tax.',
  },
  {
    question: 'Who can buy?',
    answer: 'Anyone 18 or older.',
  },
] as const;
