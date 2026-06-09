import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type {
  HeroBlockConfig,
  OfferListBlockConfig,
  PageBlockConfig,
  SiteFooterBlockConfig,
  SiteHeaderBlockConfig,
} from '../../domain/models';
import { HeroBlockComponent } from '../hero-block/hero-block.component';
import { OfferListBlockComponent } from '../offer-list-block/offer-list-block.component';
import { SiteFooterBlockComponent } from '../site-footer-block/site-footer-block.component';
import { SiteHeaderBlockComponent } from '../site-header-block/site-header-block.component';

@Component({
  selector: 'app-block-renderer',
  standalone: true,
  imports: [
    HeroBlockComponent,
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
}
