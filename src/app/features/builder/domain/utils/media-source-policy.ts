export const MAX_ENCODED_IMAGE_CHARACTERS = 500_000;

export function isOversizedEncodedImage(source: string): boolean {
  return (
    source.slice(0, 'data:image/'.length).toLowerCase() === 'data:image/' &&
    source.length > MAX_ENCODED_IMAGE_CHARACTERS
  );
}
