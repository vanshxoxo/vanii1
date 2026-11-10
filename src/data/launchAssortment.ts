import { formatINR } from '../data';

export type LaunchProposal = {
  key: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  ageSuggestion: string;
  price: number;
  image: string;
  description: string;
};

const catalogPhoto = (id: string) => `/images/catalog-preview/pexels-kidswear-editorial-${id}.webp`;

// These are owner-approved assortment proposals, never product records for sale.
// Photos are editorial inspiration only and do not depict the proposed garments.
export const launchAssortment: LaunchProposal[] = [
  { key: 'soft-play-romper', slug: 'soft-play-romper', name: 'Soft Play Romper', category: 'Rompers', categorySlug: 'rompers', ageSuggestion: 'baby', price: 799, image: catalogPhoto('29562273'), description: 'A relaxed everyday silhouette for little moments.' },
  { key: 'little-sun-romper', slug: 'little-sun-romper', name: 'Little Sun Romper', category: 'Rompers', categorySlug: 'rompers', ageSuggestion: 'toddler', price: 999, image: catalogPhoto('32234111'), description: 'A bright, easygoing look for the first assortment.' },
  { key: 'everyday-snap-romper', slug: 'everyday-snap-romper', name: 'Everyday Snap Romper', category: 'Rompers', categorySlug: 'rompers', ageSuggestion: 'newborn', price: 899, image: catalogPhoto('32233627'), description: 'A simple one-piece concept with a familiar feel.' },
  { key: 'sunday-cotton-coord', slug: 'sunday-cotton-coord', name: 'Sunday Cotton Co-ord', category: 'Co-ord Sets', categorySlug: 'co-ord-sets', ageSuggestion: 'toddler', price: 1499, image: catalogPhoto('15443075'), description: 'An easy two-piece idea for unhurried days.' },
  { key: 'playday-tee-shorts-set', slug: 'playday-tee-shorts-set', name: 'Playday Tee & Shorts Set', category: 'Co-ord Sets', categorySlug: 'co-ord-sets', ageSuggestion: 'little-kids', price: 1299, image: catalogPhoto('13627298'), description: 'A playful pairing proposed for everyday dressing.' },
  { key: 'weekend-lounge-set', slug: 'weekend-lounge-set', name: 'Weekend Lounge Set', category: 'Co-ord Sets', categorySlug: 'co-ord-sets', ageSuggestion: 'baby', price: 1599, image: catalogPhoto('15967300'), description: 'A laid-back set concept for slower weekends.' },
  { key: 'everyday-cotton-tee', slug: 'everyday-cotton-tee', name: 'Everyday Cotton Tee', category: 'Tees & Tops', categorySlug: 'tees-tops', ageSuggestion: 'toddler', price: 499, image: catalogPhoto('33581402'), description: 'A considered staple for a small everyday wardrobe.' },
  { key: 'little-bloom-tee', slug: 'little-bloom-tee', name: 'Little Bloom Tee', category: 'Tees & Tops', categorySlug: 'tees-tops', ageSuggestion: 'toddler', price: 599, image: catalogPhoto('38543840'), description: 'A cheerful top concept with a gentle point of view.' },
  { key: 'peter-pan-collar-top', slug: 'peter-pan-collar-top', name: 'Peter Pan Collar Top', category: 'Tees & Tops', categorySlug: 'tees-tops', ageSuggestion: 'baby', price: 699, image: catalogPhoto('29562273'), description: 'A classic collar idea for a more dressed-up day.' },
  { key: 'daisy-day-dress', slug: 'daisy-day-dress', name: 'Daisy Day Dress', category: 'Dresses', categorySlug: 'dresses', ageSuggestion: 'toddler', price: 1199, image: catalogPhoto('30111516'), description: 'A bright dress concept for days out and about.' },
  { key: 'gathered-cotton-dress', slug: 'gathered-cotton-dress', name: 'Gathered Cotton Dress', category: 'Dresses', categorySlug: 'dresses', ageSuggestion: 'baby', price: 1399, image: catalogPhoto('18279333'), description: 'A softly gathered silhouette proposed for the range.' },
  { key: 'occasion-smock-dress', slug: 'occasion-smock-dress', name: 'Occasion Smock Dress', category: 'Dresses', categorySlug: 'dresses', ageSuggestion: 'little-kids', price: 1699, image: catalogPhoto('37529058'), description: 'A special-day dress concept with a timeless shape.' },
  { key: 'easy-pull-on-pants', slug: 'easy-pull-on-pants', name: 'Easy Pull-on Pants', category: 'Bottoms', categorySlug: 'bottoms', ageSuggestion: 'toddler', price: 699, image: catalogPhoto('13627298'), description: 'A straightforward bottomwear idea for little wardrobes.' },
  { key: 'everyday-cotton-shorts', slug: 'everyday-cotton-shorts', name: 'Everyday Cotton Shorts', category: 'Bottoms', categorySlug: 'bottoms', ageSuggestion: 'little-kids', price: 599, image: catalogPhoto('28490495'), description: 'A simple shorts concept for warm-weather outfits.' },
  { key: 'relaxed-joggers', slug: 'relaxed-joggers', name: 'Relaxed Joggers', category: 'Bottoms', categorySlug: 'bottoms', ageSuggestion: 'toddler', price: 899, image: catalogPhoto('33581402'), description: 'An easy jogger silhouette proposed for everyday wear.' },
  { key: 'cloud-cotton-pj-set', slug: 'cloud-cotton-pj-set', name: 'Cloud Cotton PJ Set', category: 'Sleepwear', categorySlug: 'sleepwear', ageSuggestion: 'baby', price: 1199, image: catalogPhoto('33253247'), description: 'A two-piece sleepwear idea for a quieter end to the day.' },
  { key: 'little-moon-sleepsuit', slug: 'little-moon-sleepsuit', name: 'Little Moon Sleepsuit', category: 'Sleepwear', categorySlug: 'sleepwear', ageSuggestion: 'newborn', price: 899, image: catalogPhoto('31380756'), description: 'A one-piece sleepwear concept for the proposed range.' },
  { key: 'bedtime-two-piece-set', slug: 'bedtime-two-piece-set', name: 'Bedtime Two-Piece Set', category: 'Sleepwear', categorySlug: 'sleepwear', ageSuggestion: 'little-kids', price: 1099, image: catalogPhoto('7787255'), description: 'A calm two-piece idea for a little bedtime routine.' },
];

export const formatProposedPrice = (amount: number) => formatINR(amount);
