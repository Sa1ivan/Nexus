import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { FeatureGridBlockConfig, MediaAsset } from '../../../builder/domain/models';

@Component({
  selector: 'app-feature-grid-block',
  standalone: true,
  templateUrl: './feature-grid-block.component.html',
  styleUrl: './feature-grid-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureGridBlockComponent {
  readonly block = input.required<FeatureGridBlockConfig>();

  objectPosition(media: MediaAsset): string {
    return `${media.focalPoint?.x ?? 50}% ${media.focalPoint?.y ?? 50}%`;
  }
}
