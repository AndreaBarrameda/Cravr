type NormalizedMenuItem = {
  name: string;
  description: string;
  price: number;
  photo_url: string | null;
  source_url: string | null;
  source_type: 'json_ld' | 'linked_menu_page';
};

type CachedRealMenu = {
  items: NormalizedMenuItem[];
  timestamp: number;
};

const menuCache = new Map<string, CachedRealMenu>();
const MENU_CACHE_TTL = 60 * 60 * 1000;

const MENU_LINK_PATTERNS = [
  '/menu',
  '/food-menu',
  '/menus',
  '/our-menu',
  '/dining/menu',
  '/order',
  '/shop'
];

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function normalizeWhitespace(value: string): string {
  return decodeBasicEntities(value).replace(/\s+/g, ' ').trim();
}

function isLikelyDishName(value: string): boolean {
  const cleaned = normalizeWhitespace(value);
  if (cleaned.length < 3 || cleaned.length > 80) return false;
  if (/menu|order|cart|checkout|restaurant|location|hours|contact|delivery/i.test(cleaned)) {
    return false;
  }
  const words = cleaned.split(/\s+/);
  if (words.length > 8) return false;
  return /[a-z]/i.test(cleaned);
}

function parsePrice(value: unknown, fallbackPriceLevel = 2): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === 'string') {
    const match = value.match(/(\d[\d,.]*)/);
    if (match) {
      const parsed = Number(match[1].replace(/,/g, ''));
      if (Number.isFinite(parsed)) {
        return Math.round(parsed);
      }
    }
  }

  if (fallbackPriceLevel <= 1) return 250;
  if (fallbackPriceLevel === 2) return 450;
  if (fallbackPriceLevel === 3) return 750;
  return 1200;
}

function absoluteUrl(baseUrl: string, maybeRelative: string | null | undefined): string | null {
  if (!maybeRelative) return null;
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = [];
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const raw = match[1]?.trim();
    if (raw) {
      blocks.push(raw);
    }
  }
  return blocks;
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getImageUrl(image: unknown, baseUrl: string): string | null {
  if (typeof image === 'string') {
    return absoluteUrl(baseUrl, image);
  }

  if (Array.isArray(image)) {
    for (const item of image) {
      const url = getImageUrl(item, baseUrl);
      if (url) return url;
    }
  }

  if (image && typeof image === 'object') {
    const maybeUrl =
      (image as Record<string, unknown>).url ??
      (image as Record<string, unknown>).contentUrl ??
      (image as Record<string, unknown>).thumbnailUrl;
    if (typeof maybeUrl === 'string') {
      return absoluteUrl(baseUrl, maybeUrl);
    }
  }

  return null;
}

function extractOfferPrice(offers: unknown, fallbackPriceLevel: number): number {
  const offerList = asArray(offers);
  for (const offer of offerList) {
    if (offer && typeof offer === 'object') {
      const price = (offer as Record<string, unknown>).price ?? (offer as Record<string, unknown>).priceSpecification;
      const parsed = parsePrice(price, fallbackPriceLevel);
      if (parsed > 0) {
        return parsed;
      }
    }
  }
  return parsePrice(undefined, fallbackPriceLevel);
}

function pickMenuItemName(node: Record<string, unknown>): string {
  const candidates = [
    node.name,
    node.headline,
    node.alternateName
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length >= 3) {
      return normalizeWhitespace(candidate);
    }
  }
  return '';
}

function pickMenuItemDescription(node: Record<string, unknown>): string {
  const description = node.description;
  return typeof description === 'string' ? normalizeWhitespace(description) : '';
}

function normalizeMenuItem(
  node: Record<string, unknown>,
  baseUrl: string,
  fallbackPriceLevel: number,
  source_type: 'json_ld' | 'linked_menu_page'
): NormalizedMenuItem | null {
  const name = pickMenuItemName(node);
  if (!name) return null;

  const photo_url = getImageUrl(node.image, baseUrl);
  return {
    name,
    description: pickMenuItemDescription(node),
    price: extractOfferPrice(node.offers, fallbackPriceLevel),
    photo_url,
    source_url: baseUrl,
    source_type
  };
}

function collectMenuItemsFromJsonLdNode(
  node: unknown,
  baseUrl: string,
  fallbackPriceLevel: number,
  source_type: 'json_ld' | 'linked_menu_page',
  items: NormalizedMenuItem[]
): void {
  if (!node) return;

  if (Array.isArray(node)) {
    node.forEach((entry) =>
      collectMenuItemsFromJsonLdNode(entry, baseUrl, fallbackPriceLevel, source_type, items)
    );
    return;
  }

  if (typeof node !== 'object') return;
  const record = node as Record<string, unknown>;
  const rawType = record['@type'];
  const types = asArray(rawType).filter((value): value is string => typeof value === 'string');
  const normalizedTypes = types.map((value) => value.toLowerCase());

  if (normalizedTypes.includes('menuitem')) {
    const item = normalizeMenuItem(record, baseUrl, fallbackPriceLevel, source_type);
    if (item) {
      items.push(item);
    }
  }

  const childKeys = ['hasMenuItem', 'hasPart', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'menu', 'subjectOf'];
  for (const key of childKeys) {
    if (record[key]) {
      collectMenuItemsFromJsonLdNode(record[key], baseUrl, fallbackPriceLevel, source_type, items);
    }
  }
}

function dedupeMenuItems(items: NormalizedMenuItem[]): NormalizedMenuItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreMenuItem(item: NormalizedMenuItem): number {
  let score = 0;
  if (item.photo_url) score += 3;
  if (item.description) score += 1;
  if (item.price > 0) score += 1;
  return score;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CRAVRMenuBot/1.0)'
      }
    });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

function extractLinkedMenuPages(html: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  const hrefPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefPattern.exec(html))) {
    const href = match[1];
    const text = stripHtml(match[2] || '').toLowerCase();
    const absolute = absoluteUrl(baseUrl, href);
    if (!absolute) continue;

    const looksLikeMenuLink =
      MENU_LINK_PATTERNS.some((pattern) => absolute.toLowerCase().includes(pattern)) ||
      /menu|food|dining|order/.test(text);

    if (looksLikeMenuLink) {
      urls.add(absolute);
    }
  }
  return Array.from(urls).slice(0, 3);
}

function extractMenuItemsFromHtml(
  html: string,
  baseUrl: string,
  fallbackPriceLevel: number,
  source_type: 'json_ld' | 'linked_menu_page'
): NormalizedMenuItem[] {
  const items: NormalizedMenuItem[] = [];
  const jsonLdBlocks = extractJsonLdBlocks(html);

  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block);
      collectMenuItemsFromJsonLdNode(parsed, baseUrl, fallbackPriceLevel, source_type, items);
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return dedupeMenuItems(items)
    .sort((a, b) => scoreMenuItem(b) - scoreMenuItem(a));
}

function extractFirstMatch(input: string, pattern: RegExp): string | null {
  const match = input.match(pattern);
  return match?.[1] ? normalizeWhitespace(stripHtml(match[1])) : null;
}

function extractImageFromBlock(block: string, baseUrl: string): string | null {
  const imgPatterns = [
    /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
    /data-src=["']([^"']+)["']/i,
    /data-lazy-src=["']([^"']+)["']/i
  ];

  for (const pattern of imgPatterns) {
    const match = block.match(pattern);
    if (match?.[1]) {
      const url = absoluteUrl(baseUrl, match[1]);
      if (url) return url;
    }
  }

  return null;
}

function extractHeuristicMenuItemsFromHtml(
  html: string,
  baseUrl: string,
  fallbackPriceLevel: number
): NormalizedMenuItem[] {
  const items: NormalizedMenuItem[] = [];
  const blockPattern = /<(article|li|section|div)[^>]*>([\s\S]{80,5000}?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(html))) {
    const block = match[0];
    if (!/<img/i.test(block)) continue;
    if (!/(₱|\$|PHP|USD)\s?\d/i.test(block)) continue;

    const nameCandidates = [
      extractFirstMatch(block, /<h[1-4][^>]*>([\s\S]{1,200}?)<\/h[1-4]>/i),
      extractFirstMatch(block, /<strong[^>]*>([\s\S]{1,200}?)<\/strong>/i),
      extractFirstMatch(block, /<b[^>]*>([\s\S]{1,200}?)<\/b>/i),
      extractFirstMatch(block, /data-name=["']([^"']{1,120})["']/i)
    ].filter((value): value is string => Boolean(value));

    const name = nameCandidates.find(isLikelyDishName);
    if (!name) continue;

    const description =
      extractFirstMatch(block, /<p[^>]*>([\s\S]{1,300}?)<\/p>/i) ||
      extractFirstMatch(block, /<span[^>]*class=["'][^"']*(?:description|desc|details)[^"']*["'][^>]*>([\s\S]{1,300}?)<\/span>/i) ||
      '';

    const priceMatch = block.match(/(?:₱|\$|PHP|USD)\s?(\d[\d,.]*)/i);
    const photo_url = extractImageFromBlock(block, baseUrl);

    items.push({
      name,
      description,
      price: parsePrice(priceMatch?.[1], fallbackPriceLevel),
      photo_url,
      source_url: baseUrl,
      source_type: 'linked_menu_page'
    });
  }

  return dedupeMenuItems(items)
    .filter((item) => Boolean(item.photo_url))
    .sort((a, b) => scoreMenuItem(b) - scoreMenuItem(a));
}

export async function getRealMenuItems(params: {
  placeId: string;
  website?: string | null;
  priceLevel?: number;
}): Promise<NormalizedMenuItem[]> {
  const { placeId, website, priceLevel = 2 } = params;
  if (!website) return [];

  const cached = menuCache.get(placeId);
  if (cached && Date.now() - cached.timestamp < MENU_CACHE_TTL) {
    return cached.items;
  }

  const homepageHtml = await fetchHtml(website);
  if (!homepageHtml) {
    return [];
  }

  const collected = extractMenuItemsFromHtml(homepageHtml, website, priceLevel, 'json_ld');
  if (collected.length > 0) {
    menuCache.set(placeId, { items: collected, timestamp: Date.now() });
    return collected;
  }

  const linkedMenuPages = extractLinkedMenuPages(homepageHtml, website);
  let linkedItems: NormalizedMenuItem[] = [];
  for (const menuPageUrl of linkedMenuPages) {
    const menuHtml = await fetchHtml(menuPageUrl);
    if (!menuHtml) continue;
    linkedItems = linkedItems.concat(
      extractMenuItemsFromHtml(menuHtml, menuPageUrl, priceLevel, 'linked_menu_page')
    );
    linkedItems = linkedItems.concat(
      extractHeuristicMenuItemsFromHtml(menuHtml, menuPageUrl, priceLevel)
    );
  }

  const normalized = dedupeMenuItems(linkedItems)
    .sort((a, b) => scoreMenuItem(b) - scoreMenuItem(a));

  menuCache.set(placeId, { items: normalized, timestamp: Date.now() });
  return normalized;
}
