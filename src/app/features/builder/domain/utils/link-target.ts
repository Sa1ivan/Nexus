const ENCODED_PATH_SEPARATOR = /%(?:2f|5c)/iu;

export function isSafeLinkTarget(value: string): boolean {
  const target = value.trim();
  const lowerTarget = target.toLowerCase();

  const hasControlCharacter = [...target].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

  if (target === '' || hasControlCharacter || target.includes('\\')) {
    return false;
  }

  if (target.startsWith('#')) {
    return !/\s/u.test(target);
  }

  if (target.startsWith('/')) {
    return !target.startsWith('//') && !ENCODED_PATH_SEPARATOR.test(target);
  }

  if (lowerTarget.startsWith('https://')) {
    try {
      const url = new URL(target);
      return url.protocol === 'https:' && url.hostname.length > 0;
    } catch {
      return false;
    }
  }

  if (lowerTarget.startsWith('mailto:')) {
    return /^mailto:[^\s@]+@[^\s@]+$/iu.test(target);
  }

  if (lowerTarget.startsWith('tel:')) {
    return /^tel:\+?[0-9()\-\s]{3,32}$/u.test(target);
  }

  return false;
}

export function normalizeLinkTarget(target: string): string {
  const trimmedTarget = target.trim();
  return isSafeLinkTarget(trimmedTarget) ? trimmedTarget : '#';
}
