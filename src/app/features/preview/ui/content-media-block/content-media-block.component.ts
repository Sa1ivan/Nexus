import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { ContentMediaBlockConfig, MediaAsset } from '../../../builder/domain/models';

@Component({
  selector: 'app-content-media-block',
  standalone: true,
  templateUrl: './content-media-block.component.html',
  styleUrl: './content-media-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentMediaBlockComponent {
  readonly block = input.required<ContentMediaBlockConfig>();

  objectPosition(media: MediaAsset): string {
    return `${media.focalPoint?.x ?? 50}% ${media.focalPoint?.y ?? 50}%`;
  }
}
