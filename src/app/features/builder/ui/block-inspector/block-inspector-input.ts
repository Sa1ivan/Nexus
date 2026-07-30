export function readInputValue(event: Event): string {
  const target = event.target;

  return target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
    ? target.value
    : '';
}

export function readInputChecked(event: Event): boolean {
  return event.target instanceof HTMLInputElement ? event.target.checked : false;
}

export function readInputNumber(event: Event): number {
  const value = Number(readInputValue(event));

  return Number.isFinite(value) ? value : 0;
}
