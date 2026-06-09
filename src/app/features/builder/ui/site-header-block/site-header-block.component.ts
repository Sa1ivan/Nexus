import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { SiteHeaderBlockConfig } from '../../domain/models';

@Component({
  selector: 'app-site-header-block',
  standalone: true,
  templateUrl: './site-header-block.component.html',
  styleUrl: './site-header-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderBlockComponent {
  readonly block = input.required<SiteHeaderBlockConfig>();
}
