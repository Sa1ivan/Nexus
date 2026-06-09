import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { OfferListBlockConfig } from '../../domain/models';

@Component({
  selector: 'app-offer-list-block',
  standalone: true,
  templateUrl: './offer-list-block.component.html',
  styleUrl: './offer-list-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferListBlockComponent {
  readonly block = input.required<OfferListBlockConfig>();
}
