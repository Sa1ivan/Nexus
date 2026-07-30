import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import {
  DEFAULT_PRIMARY_BUTTON_APPEARANCE,
  DEFAULT_SECONDARY_BUTTON_APPEARANCE,
  getReadableTextColor,
  resolveButtonAppearance,
} from '../../domain/models';
import type { ButtonAppearance, PageBlockConfig } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { BuilderStore } from '../../stores/builder.store';
import { ButtonAppearanceEditorComponent } from '../button-appearance-editor/button-appearance-editor.component';

const BUTTON_BLOCK_TYPES: ReadonlySet<PageBlockConfig['type']> = new Set([
  'siteHeader',
  'hero',
  'contentMedia',
  'offerList',
  'callToAction',
  'siteFooter',
  'leadForm',
]);

@Component({
  selector: 'app-block-button-design-inspector',
  standalone: true,
  imports: [ButtonAppearanceEditorComponent],
  templateUrl: './block-button-design-inspector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockButtonDesignInspectorComponent {
  private readonly builderStore = inject(BuilderStore);
  private readonly blockStore = inject(BuilderBlockStore);

  readonly block = input.required<PageBlockConfig>();
  readonly supportsButtons = computed(() => BUTTON_BLOCK_TYPES.has(this.block().type));

  primaryAppearance(appearance: ButtonAppearance | undefined): ButtonAppearance {
    return resolveButtonAppearance(appearance, this.primaryFallback());
  }

  secondaryAppearance(appearance: ButtonAppearance | undefined): ButtonAppearance {
    return resolveButtonAppearance(appearance, this.secondaryFallback());
  }

  updateHeroPrimary(appearance: ButtonAppearance): void {
    const block = this.block();
    if (block.type === 'hero') {
      this.blockStore.updateHeroBlock(block.id, { primaryButtonAppearance: appearance });
    }
  }

  updateHeroSecondary(appearance: ButtonAppearance): void {
    const block = this.block();
    if (block.type === 'hero') {
      this.blockStore.updateHeroBlock(block.id, { secondaryButton: { appearance } });
    }
  }

  updateHeaderCta(appearance: ButtonAppearance): void {
    const block = this.block();
    if (block.type === 'siteHeader') {
      this.blockStore.updateSiteHeaderBlock(block.id, { cta: { appearance } });
    }
  }

  updateHeaderBooking(appearance: ButtonAppearance): void {
    const block = this.block();
    if (block.type === 'siteHeader') {
      this.blockStore.updateSiteHeaderBlock(block.id, {
        booking: { action: { appearance } },
      });
    }
  }

  updateContentMediaCta(appearance: ButtonAppearance): void {
    const block = this.block();
    if (block.type === 'contentMedia') {
      this.blockStore.updateContentMediaBlock(block.id, { cta: { appearance } });
    }
  }

  updateOfferCta(itemId: string, appearance: ButtonAppearance): void {
    const block = this.block();
    if (block.type === 'offerList') {
      this.blockStore.updateOfferListItem(block.id, itemId, { cta: { appearance } });
    }
  }

  updateCallToActionPrimary(appearance: ButtonAppearance): void {
    const block = this.block();
    if (block.type === 'callToAction') {
      this.blockStore.updateCallToActionBlock(block.id, {
        primaryAction: { appearance },
      });
    }
  }

  updateCallToActionSecondary(appearance: ButtonAppearance): void {
    const block = this.block();
    if (block.type === 'callToAction') {
      this.blockStore.updateCallToActionBlock(block.id, {
        secondaryAction: { appearance },
      });
    }
  }

  updateFooterCta(appearance: ButtonAppearance): void {
    const block = this.block();
    if (block.type === 'siteFooter') {
      this.blockStore.updateSiteFooterBlock(block.id, { cta: { appearance } });
    }
  }

  updateFormSubmit(appearance: ButtonAppearance): void {
    const block = this.block();
    if (block.type === 'leadForm') {
      this.blockStore.updateLeadFormBlock(block.id, { submitAppearance: appearance });
    }
  }

  private primaryFallback(): ButtonAppearance {
    const block = this.block();
    const theme = this.builderStore.siteConfig().theme;
    const backgroundColor = block.appearance?.accentColor ?? theme.accentColor;

    return {
      ...DEFAULT_PRIMARY_BUTTON_APPEARANCE,
      backgroundColor,
      textColor: getReadableTextColor(backgroundColor),
      borderColor: backgroundColor,
    };
  }

  private secondaryFallback(): ButtonAppearance {
    const block = this.block();
    const theme = this.builderStore.siteConfig().theme;
    const accentColor = block.appearance?.accentColor ?? theme.accentColor;

    return {
      ...DEFAULT_SECONDARY_BUTTON_APPEARANCE,
      backgroundColor: accentColor,
      textColor: block.appearance?.textColor ?? theme.textColor,
      borderColor: accentColor,
    };
  }
}
