/**
 * Product copy and constants that are not environment-specific.
 *
 * "The Chore Audit" is a working name. No trademark or domain search has been
 * done; do both before spending on marketing.
 */

export const site = {
  name: 'The Chore Audit',
  tagline: 'Stop arguing about whose turn it is.',
  description:
    'A 10-minute exercise for two. See where you and your partner disagree about who does what at home, then give every chore one owner and a clear definition of done.',
  /** Recorded on the Stripe payment so pre-orders are easy to filter. */
  stripeProductKey: 'chore-audit-preorder',
} as const;

/**
 * Sources for every statistic shown on the landing page. Figures were checked
 * against these pages on 2026-11-15. Re-check before launch and whenever the
 * copy changes.
 */
export const sources = {
  pew: {
    label: 'Pew Research Center, June 2026',
    url: 'https://www.pewresearch.org/social-trends/2026/06/16/how-working-parents-divide-family-responsibilities/',
  },
  yougov: {
    label: 'YouGov, February 2026',
    url: 'https://yougov.com/en-us/articles/54096-what-do-couples-argue-about-tone-of-voice-communication-styles-and-money',
  },
} as const;

export const steps = [
  {
    title: 'Answer separately',
    body: 'Each of you gets a private link and marks who handles about 40 everyday tasks, from taking out the trash to booking the dentist.',
  },
  {
    title: 'See the gap',
    body: 'Side by side, you see where your answers match and where they do not. No scores and no blame, only the differences worth talking about.',
  },
  {
    title: 'Agree on owners',
    body: 'Give each task one owner and write down what "done" means. Bin out includes a new bag in. You decide together where the toilet seat lives.',
  },
] as const;

export const included = [
  'The two-person audit, about 10 minutes each',
  'A gap report showing where your answers differ',
  'A one-page household agreement you can print',
  'A calendar file with recurring reminders for each owner',
  'One payment per household. No subscription and nothing to install.',
] as const;

/** Illustrative only. Labelled as such wherever it is rendered. */
export const exampleGap = {
  partners: ['Alex', 'Sam'],
  rows: [
    { task: 'Taking out the trash', a: 'Alex', b: 'Both of us' },
    { task: 'Cleaning the bathroom', a: 'Sam', b: 'Sam' },
    { task: 'Noticing we are out of toilet paper', a: 'Both of us', b: 'Sam' },
    { task: 'Dishes after dinner', a: 'Alex', b: 'Alex' },
  ],
} as const;
