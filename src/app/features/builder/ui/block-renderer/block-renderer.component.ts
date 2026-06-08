import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { PageBlockConfig } from '../../domain/models';
import { HeroBlockComponent } from '../hero-block/hero-block.component';

@Component({
  selector: 'app-block-renderer',
  standalone: true,
  imports: [HeroBlockComponent],
  templateUrl: './block-renderer.component.html',
  styleUrl: './block-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockRendererComponent {
  readonly blocks = input.required<readonly PageBlockConfig[]>();
}
