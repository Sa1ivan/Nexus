const CYRILLIC_TRANSLITERATION: Readonly<Record<string, string>> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

const RESERVED_PAGE_SLUGS = new Set([
  'builder',
  'create',
  'projects',
  'statistics',
  'profile',
  'contacts',
  'p',
]);

export function normalizePageSlug(value: string): string {
  const transliterated = [...value.toLowerCase()]
    .map((character) => CYRILLIC_TRANSLITERATION[character] ?? character)
    .join('');

  return transliterated.replace(/[^a-z0-9]+/gu, '-').replace(/^-+|-+$/gu, '');
}

export function isReservedPageSlug(slug: string): boolean {
  return RESERVED_PAGE_SLUGS.has(slug);
}
