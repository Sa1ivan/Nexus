import { Injectable, signal } from '@angular/core';

import type { BookingSelection } from './booking-selection.types';
export type { BookingSelection } from './booking-selection.types';

@Injectable()
export class BookingSelectionService {
  private readonly currentSelection = signal<BookingSelection | null>(null);

  readonly selection = this.currentSelection.asReadonly();

  set(selection: BookingSelection): void {
    this.currentSelection.set(selection);
  }

  clear(): void {
    this.currentSelection.set(null);
  }
}
