import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { CallToActionBlockConfig, MediaAsset } from '../../../builder/domain/models';

@Component({
  selector: 'app-call-to-action-block',
  standalone: true,
  templateUrl: './call-to-action-block.component.html',
  styleUrl: './call-to-action-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallToActionBlockComponent {
  readonly block = input.required<CallToActionBlockConfig>();
  objectPosition(media: MediaAsset): string {
    return `${media.focalPoint?.x ?? 50}% ${media.focalPoint?.y ?? 50}%`;
  }
}
