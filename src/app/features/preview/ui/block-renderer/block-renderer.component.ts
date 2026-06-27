import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type {
  HeroBlockConfig,
  LeadFormBlockConfig,
  LeadSubmissionRequest,
  OfferListBlockConfig,
  PageBlockConfig,
  SiteFooterBlockConfig,
  SiteHeaderBlockConfig,
} from '../../../builder/domain/models';
import { HeroBlockComponent } from '../hero-block/hero-block.component';
import { LeadFormBlockComponent } from '../lead-form-block/lead-form-block.component';
import { OfferListBlockComponent } from '../offer-list-block/offer-list-block.component';
import { SiteFooterBlockComponent } from '../site-footer-block/site-footer-block.component';
import { SiteHeaderBlockComponent } from '../site-header-block/site-header-block.component';

@Component({
  selector: 'app-block-renderer',
  standalone: true,
  imports: [
    HeroBlockComponent,
    LeadFormBlockComponent,
    OfferListBlockComponent,
    SiteFooterBlockComponent,
    SiteHeaderBlockComponent,
  ],
  templateUrl: './block-renderer.component.html',
  styleUrl: './block-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockRendererComponent {
  readonly blocks = input.required<readonly PageBlockConfig[]>();
  readonly projectId = input<string | null>(null);
  readonly leadSubmit = output<LeadSubmissionRequest>();

  isSiteHeaderBlock(block: PageBlockConfig): block is SiteHeaderBlockConfig {
    return block.type === 'siteHeader';
  }

  isHeroBlock(block: PageBlockConfig): block is HeroBlockConfig {
    return block.type === 'hero';
  }

  isOfferListBlock(block: PageBlockConfig): block is OfferListBlockConfig {
    return block.type === 'offerList';
  }

  isSiteFooterBlock(block: PageBlockConfig): block is SiteFooterBlockConfig {
    return block.type === 'siteFooter';
  }

  isLeadFormBlock(block: PageBlockConfig): block is LeadFormBlockConfig {
    return block.type === 'leadForm';
  }

  handleLeadSubmit(blockId: string, fields: Readonly<Record<string, string>>): void {
    const projectId = this.projectId();

    if (projectId === null) {
      return;
    }

    this.leadSubmit.emit({
      projectId,
      blockId,
      fields,
    });
  }
}
