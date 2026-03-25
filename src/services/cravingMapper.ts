/**
 * Maps user craving inputs to actual restaurant/cuisine keywords that Google Maps understands
 * This ensures accurate restaurant discovery based on what the user actually wants
 */

const CRAVING_MAPPINGS: Record<string, string[]> = {
  // SWEET CRAVINGS
  'sweet': ['dessert', 'bakery', 'cafe', 'pastry'],
  'dessert': ['dessert', 'bakery', 'cafe'],
  'cake': ['bakery', 'dessert'],
  'cookies': ['bakery', 'dessert', 'cafe'],
  'ice cream': ['ice cream', 'dessert'],
  'chocolate': ['dessert', 'bakery', 'cafe'],
  'candy': ['dessert', 'candy store'],
  'donut': ['bakery', 'donut shop'],
  'pastry': ['bakery', 'pastry', 'cafe'],

  // SPICY CRAVINGS
  'spicy': ['indian', 'thai', 'mexican', 'sichuan'],
  'thai': ['thai'],
  'indian': ['indian'],
  'mexican': ['mexican'],
  'sichuan': ['sichuan', 'chinese'],
  'curry': ['indian', 'thai'],
  'hot': ['indian', 'thai', 'mexican', 'sichuan'],
  'chili': ['mexican', 'thai', 'sichuan'],

  // SEAFOOD CRAVINGS
  'seafood': ['seafood', 'sushi', 'fish'],
  'fish': ['seafood', 'fish'],
  'sushi': ['sushi', 'japanese'],
  'oyster': ['seafood', 'oyster bar'],
  'shrimp': ['seafood', 'thai'],
  'crab': ['seafood'],

  // NOODLE CRAVINGS
  'noodle': ['ramen', 'pho', 'pasta', 'noodle'],
  'ramen': ['ramen', 'japanese'],
  'pho': ['pho', 'vietnamese'],
  'pasta': ['italian', 'pasta'],
  'noodles': ['ramen', 'pho', 'pasta'],

  // MEAT CRAVINGS
  'burger': ['burger', 'american'],
  'steak': ['steakhouse', 'bbq'],
  'bbq': ['bbq', 'barbecue'],
  'chicken': ['chicken', 'fried chicken'],
  'fried chicken': ['fried chicken', 'chicken'],
  'meat': ['steakhouse', 'bbq', 'burger'],

  // ASIAN CRAVINGS
  'chinese': ['chinese'],
  'japanese': ['japanese', 'sushi', 'ramen'],
  'korean': ['korean'],
  'vietnamese': ['vietnamese', 'pho'],
  'asian': ['asian fusion', 'pan-asian'],
  'korean bbq': ['korean', 'bbq'],

  // FRESH/HEALTHY CRAVINGS
  'healthy': ['salad', 'vegetarian', 'vegan', 'healthy'],
  'salad': ['salad', 'vegetarian'],
  'fresh': ['salad', 'healthy', 'smoothie'],
  'vegan': ['vegan', 'vegetarian'],
  'vegetarian': ['vegetarian', 'vegan'],
  'smoothie': ['smoothie bowl', 'cafe'],

  // COMFORT FOOD CRAVINGS
  'comfort': ['burger', 'pizza', 'american', 'comfort food'],
  'pizza': ['pizza', 'italian'],
  'fried': ['fried chicken', 'american', 'fast food'],
  'breakfast': ['breakfast', 'brunch', 'cafe'],
  'brunch': ['brunch', 'breakfast'],

  // COFFEE/BEVERAGE CRAVINGS
  'coffee': ['cafe', 'coffee shop'],
  'tea': ['tea', 'bubble tea', 'cafe'],
  'bubble tea': ['bubble tea', 'tea'],
  'matcha': ['matcha cafe', 'matcha bar', 'tea', 'cafe'],
  'boba': ['bubble tea', 'boba tea'],
  'latte': ['cafe', 'coffee shop'],
  'cappuccino': ['cafe', 'coffee shop'],
  'espresso': ['cafe', 'coffee shop'],

  // SPECIFIC/SPECIALTY ITEMS
  'acai bowl': ['acai bowl', 'smoothie', 'breakfast'],
  'poke': ['poke', 'sushi', 'seafood'],
  'ramen bowl': ['ramen', 'noodle'],
  'hotpot': ['hotpot', 'hot pot'],
  'shabu': ['shabu', 'hotpot'],
  'okonomiyaki': ['japanese', 'okonomiyaki'],
  'takoyaki': ['takoyaki', 'japanese'],
  'crepe': ['crepe', 'dessert', 'cafe'],
  'waffles': ['waffle', 'breakfast', 'dessert'],
  'pancakes': ['pancake', 'breakfast', 'brunch'],
  'dim sum': ['dim sum', 'chinese'],
  'dumplings': ['dumplings', 'asian'],
  'tapas': ['tapas', 'spanish'],
  'wings': ['wings', 'chicken', 'american'],
  'ribs': ['ribs', 'bbq'],
  'pho': ['pho', 'vietnamese'],
  'banh mi': ['banh mi', 'vietnamese'],
  'kebab': ['kebab', 'middle eastern'],
  'gyro': ['gyro', 'greek'],

  // MISC
  'fast food': ['fast food', 'burger'],
  'pizza': ['pizza', 'italian'],
  'italian': ['italian', 'pizza', 'pasta'],
};

/**
 * Intelligently map a craving to restaurant/cuisine keywords
 * Returns an array of keywords to search for, in priority order
 */
export function mapCravingToKeywords(cravingText: string): string[] {
  if (!cravingText?.trim()) {
    return ['restaurant'];
  }

  const craving = cravingText.toLowerCase().trim();

  // Exact match first
  if (CRAVING_MAPPINGS[craving]) {
    return CRAVING_MAPPINGS[craving];
  }

  // Partial match - check if any mapping key is contained in the craving
  for (const [key, keywords] of Object.entries(CRAVING_MAPPINGS)) {
    if (craving.includes(key) || key.includes(craving)) {
      return keywords;
    }
  }

  // Multi-word partial matching (e.g., "spicy thai" should match both)
  const words = craving.split(/\s+/);
  const matchedKeywords = new Set<string>();

  for (const word of words) {
    if (CRAVING_MAPPINGS[word]) {
      CRAVING_MAPPINGS[word].forEach(kw => matchedKeywords.add(kw));
    }
  }

  if (matchedKeywords.size > 0) {
    return Array.from(matchedKeywords);
  }

  // Fallback: just use the craving text as-is
  return [craving];
}

/**
 * Get the primary keyword for a craving (the first/best match)
 */
export function getPrimaryKeyword(cravingText: string): string {
  const keywords = mapCravingToKeywords(cravingText);
  return keywords[0] || 'restaurant';
}
