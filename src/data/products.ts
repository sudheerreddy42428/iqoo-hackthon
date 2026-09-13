import { SimulatedProduct } from '../types/reprox';

export const COFFEE_PRODUCTS: SimulatedProduct[] = [
  {
    id: 'prod-cold-coffee',
    name: 'Cold Coffee Classic',
    category: 'Cold Brews',
    price: 4.50,
    rating: 4.8,
    description: 'Slow-steeped artisan roast over crisp ice with velvety cream.',
    image: '☕',
    badge: 'Bestseller'
  },
  {
    id: 'prod-caramel-latte',
    name: 'Caramel Macchiato',
    category: 'Espresso',
    price: 5.25,
    rating: 4.9,
    description: 'Freshly steamed milk with vanilla, marked with espresso and caramel.',
    image: '🥛',
    badge: 'Popular'
  },
  {
    id: 'prod-nitro-brew',
    name: 'Nitro Cold Brew',
    category: 'Cold Brews',
    price: 5.75,
    rating: 4.7,
    description: 'Nitrogen-infused cold brew delivering a naturally sweet, frothy head.',
    image: '🧊',
  },
  {
    id: 'prod-matcha-latte',
    name: 'Ceremonial Matcha Latte',
    category: 'Tea & Specialty',
    price: 4.95,
    rating: 4.6,
    description: 'Organic Japanese ceremonial matcha blended with oat milk and honey.',
    image: '🍵',
  },
  {
    id: 'prod-croissant',
    name: 'Butter Croissant',
    category: 'Bakery',
    price: 3.80,
    rating: 4.5,
    description: 'Flaky, golden layered French pastry baked fresh every morning.',
    image: '🥐',
  },
  {
    id: 'prod-avocado-toast',
    name: 'Artisan Avocado Toast',
    category: 'Bakery',
    price: 7.20,
    rating: 4.7,
    description: 'Sourdough toast topped with crushed Haas avocado, chili flakes, and microgreens.',
    image: '🥑',
  }
];
