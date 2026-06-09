import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { SiteFooterBlockConfig } from '../../domain/models';

@Component({
  selector: 'app-site-footer-block',
  standalone: true,
  templateUrl: './site-footer-block.component.html',
  styleUrl: './site-footer-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterBlockComponent {
  readonly block = input.required<SiteFooterBlockConfig>();
}
