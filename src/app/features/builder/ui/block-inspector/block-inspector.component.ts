import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import type { PageBlockConfig } from '../../domain/models';
import { BLOCK_DEFINITIONS } from '../../domain/registry/block-registry';
import { BuilderStore } from '../../stores/builder.store';
import { BlockBehaviorInspectorComponent } from './block-behavior-inspector.component';
import { BlockDesignInspectorComponent } from './block-design-inspector.component';
import { SiteHeaderContentInspectorComponent } from './site-header-content-inspector.component';
import { HeroContentInspectorComponent } from './hero-content-inspector.component';
import { ContentMediaContentInspectorComponent } from './content-media-content-inspector.component';
import { FeatureGridContentInspectorComponent } from './feature-grid-content-inspector.component';
import { OfferListContentInspectorComponent } from './offer-list-content-inspector.component';
import { GalleryContentInspectorComponent } from './gallery-content-inspector.component';
import { TestimonialsContentInspectorComponent } from './testimonials-content-inspector.component';
import { FaqContentInspectorComponent } from './faq-content-inspector.component';
import { CallToActionContentInspectorComponent } from './call-to-action-content-inspector.component';
import { SiteFooterContentInspectorComponent } from './site-footer-content-inspector.component';
import { LeadFormContentInspectorComponent } from './lead-form-content-inspector.component';
import type { InspectorTab } from './block-inspector.types';

@Component({
  selector: 'app-block-inspector',
  standalone: true,
  imports: [
    BlockBehaviorInspectorComponent,
    BlockDesignInspectorComponent,
    SiteHeaderContentInspectorComponent,
    HeroContentInspectorComponent,
    ContentMediaContentInspectorComponent,
    FeatureGridContentInspectorComponent,
    OfferListContentInspectorComponent,
    GalleryContentInspectorComponent,
    TestimonialsContentInspectorComponent,
    FaqContentInspectorComponent,
    CallToActionContentInspectorComponent,
    SiteFooterContentInspectorComponent,
    LeadFormContentInspectorComponent,
    MatIconModule,
  ],
  templateUrl: './block-inspector.component.html',
  styleUrl: './block-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class BlockInspectorComponent {
  private readonly builderStore = inject(BuilderStore);

  readonly block = input.required<PageBlockConfig>();
  readonly activeTab = signal<InspectorTab>('content');
  readonly activeBlocks = this.builderStore.activeBlocks;
  readonly blockDefinition = computed(() => BLOCK_DEFINITIONS[this.block().type]);

  setTab(tab: InspectorTab): void {
    this.activeTab.set(tab);
  }
}
