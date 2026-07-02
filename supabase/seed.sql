-- Sample catalog for the TCG Emperor storefront.
-- Safe to run repeatedly (idempotent on slug).

insert into public.categories (name, slug, description) values
  ('Pokémon', 'pokemon', 'Pokémon TCG singles, sealed product & accessories'),
  ('Magic: The Gathering', 'magic', 'MTG singles and sealed product'),
  ('Yu-Gi-Oh!', 'yugioh', 'Yu-Gi-Oh! cards and sealed product'),
  ('Sealed & Accessories', 'sealed', 'Booster boxes, sleeves, and supplies')
on conflict (slug) do nothing;

insert into public.products
  (name, slug, description, price_cents, currency, stock, image_url, category_id, game, set_name, rarity, condition, is_active, featured)
values
  ('Charizard VMAX (Rainbow Rare)', 'charizard-vmax-rainbow',
   'Iconic Charizard VMAX secret rainbow rare. A centerpiece for any collection.',
   24999, 'usd', 3, 'https://placehold.co/600x840/1a1a2e/f39c12/png?text=Charizard+VMAX',
   (select id from public.categories where slug='pokemon'), 'Pokémon', 'Champion''s Path', 'Secret Rare', 'Near Mint', true, true),

  ('Pikachu Illustrator (Reprint)', 'pikachu-illustrator',
   'Fan-favorite Pikachu promo reprint. Great display piece.',
   4999, 'usd', 12, 'https://placehold.co/600x840/1a1a2e/f1c40f/png?text=Pikachu',
   (select id from public.categories where slug='pokemon'), 'Pokémon', 'Promo', 'Promo', 'Near Mint', true, true),

  ('Black Lotus (Proxy Display)', 'black-lotus-display',
   'Premium display proxy of the most famous MTG card. Not tournament legal.',
   3999, 'usd', 25, 'https://placehold.co/600x840/0f3460/e94560/png?text=Black+Lotus',
   (select id from public.categories where slug='magic'), 'Magic: The Gathering', 'Alpha', 'Rare', 'Near Mint', true, true),

  ('Liliana of the Veil', 'liliana-of-the-veil',
   'Powerful planeswalker, a staple in many black decks.',
   1599, 'usd', 18, 'https://placehold.co/600x840/0f3460/9b59b6/png?text=Liliana',
   (select id from public.categories where slug='magic'), 'Magic: The Gathering', 'Innistrad', 'Mythic Rare', 'Lightly Played', true, false),

  ('Blue-Eyes White Dragon (1st Ed)', 'blue-eyes-white-dragon',
   'The legendary Blue-Eyes White Dragon, first edition.',
   8999, 'usd', 5, 'https://placehold.co/600x840/16213e/3498db/png?text=Blue-Eyes',
   (select id from public.categories where slug='yugioh'), 'Yu-Gi-Oh!', 'LOB', 'Ultra Rare', 'Near Mint', true, true),

  ('Dark Magician (Ultra Rare)', 'dark-magician-ultra',
   'Yugi''s signature monster in classic ultra rare finish.',
   3499, 'usd', 9, 'https://placehold.co/600x840/16213e/8e44ad/png?text=Dark+Magician',
   (select id from public.categories where slug='yugioh'), 'Yu-Gi-Oh!', 'LOB', 'Ultra Rare', 'Lightly Played', true, false),

  ('Pokémon Scarlet & Violet Booster Box', 'sv-booster-box',
   'Sealed 36-pack booster box. Factory sealed, English.',
   12999, 'usd', 15, 'https://placehold.co/600x840/1a1a2e/e74c3c/png?text=Booster+Box',
   (select id from public.categories where slug='sealed'), 'Pokémon', 'Scarlet & Violet', 'Sealed', 'Sealed', true, true),

  ('Premium Card Sleeves (100ct)', 'premium-sleeves-100',
   'Matte, tournament-legal sleeves. Protect your best cards.',
   999, 'usd', 120, 'https://placehold.co/600x840/222831/00adb5/png?text=Sleeves',
   (select id from public.categories where slug='sealed'), null, null, null, 'New', true, false),

  ('Toploaders 3x4 (25ct)', 'toploaders-25',
   'Rigid toploaders for single-card protection and shipping.',
   699, 'usd', 200, 'https://placehold.co/600x840/222831/00adb5/png?text=Toploaders',
   (select id from public.categories where slug='sealed'), null, null, null, 'New', true, false),

  ('Umbreon VMAX Alt Art', 'umbreon-vmax-alt-art',
   'Sought-after alternate art Umbreon VMAX. Chase card.',
   17999, 'usd', 2, 'https://placehold.co/600x840/1a1a2e/2ecc71/png?text=Umbreon+VMAX',
   (select id from public.categories where slug='pokemon'), 'Pokémon', 'Evolving Skies', 'Alternate Art', 'Near Mint', true, true)
on conflict (slug) do nothing;
