import { Injectable, signal } from '@angular/core';

export interface BookingSelection {
  readonly date: string;
  readonly partySize: string;
}

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
