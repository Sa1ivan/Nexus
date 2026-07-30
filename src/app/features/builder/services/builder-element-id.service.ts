import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BuilderElementIdService {
  private fallbackId = 0;

  create(prefix: string): string {
    if (globalThis.crypto?.randomUUID !== undefined) {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }

    this.fallbackId += 1;
    return `${prefix}-${Date.now().toString(36)}-${this.fallbackId.toString(36)}`;
  }
}
