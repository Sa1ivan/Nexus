import { DOCUMENT } from '@angular/common';
import { Directive, inject, input } from '@angular/core';

import { resolveLandingHref } from '../../../builder/domain/utils/link-target';

@Directive({
  selector: 'a[appLandingLink]',
  standalone: true,
  host: {
    '[attr.href]': 'resolvedHref',
  },
})
export class LandingLinkDirective {
  private readonly documentRef = inject(DOCUMENT);

  readonly appLandingLink = input.required<string>();
  get resolvedHref(): string {
    const location = this.documentRef.location;
    const basePath = new URL(this.documentRef.baseURI).pathname;

    return resolveLandingHref(this.appLandingLink(), location.pathname, location.search, basePath);
  }
}
