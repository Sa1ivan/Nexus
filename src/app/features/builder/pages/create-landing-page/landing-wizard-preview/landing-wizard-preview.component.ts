import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { buildLandingDraft } from '../../../data-access/landing-draft.factory';
import type { CompleteLandingWizardSelection, SiteConfig } from '../../../domain/models';
import { composeSitePageBlocks } from '../../../domain/utils/site-page-blocks';
import { BlockRendererComponent } from '../../../../preview/ui/block-renderer/block-renderer.component';

@Component({
  selector: 'app-landing-wizard-preview',
  standalone: true,
  imports: [BlockRendererComponent],
  templateUrl: './landing-wizard-preview.component.html',
  styleUrl: './landing-wizard-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingWizardPreviewComponent {
  readonly selection = input.required<CompleteLandingWizardSelection>();
  readonly stepLabel = input.required<string>();

  readonly siteConfig = computed<SiteConfig>(() => buildLandingDraft(this.selection()));
  readonly blocks = computed(() => {
    const siteConfig = this.siteConfig();

    return composeSitePageBlocks(siteConfig.chrome, siteConfig.pages[0]);
  });
}
