import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { HeroBlockConfig } from '../../domain/models';

@Component({
  selector: 'app-hero-block',
  standalone: true,
  templateUrl: './hero-block.component.html',
  styleUrl: './hero-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroBlockComponent {
  readonly block = input.required<HeroBlockConfig>();
}
