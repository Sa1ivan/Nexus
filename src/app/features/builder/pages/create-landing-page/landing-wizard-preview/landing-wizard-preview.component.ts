import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { LandingTone } from '../../../domain/models';

@Component({
  selector: 'app-landing-wizard-preview',
  standalone: true,
  templateUrl: './landing-wizard-preview.component.html',
  styleUrl: './landing-wizard-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingWizardPreviewComponent {
  readonly brandName = input.required<string>();
  readonly offerName = input.required<string>();
  readonly title = input.required<string>();
  readonly tone = input<LandingTone | null>(null);
}
