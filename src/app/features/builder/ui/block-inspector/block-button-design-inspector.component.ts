import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { resolveButtonAppearance } from '../../domain/models';
import type {
  ButtonAppearance,
  ButtonAppearanceUpdate,
  PageBlockConfig,
} from '../../domain/models';
import { ButtonAppearanceContextService } from '../../services/button-appearance-context.service';
import { BuilderBlockStore } from '../../stores/builder-block.store';
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
  private readonly blockStore = inject(BuilderBlockStore);
  private readonly appearanceContext = inject(ButtonAppearanceContextService);

  readonly block = input.required<PageBlockConfig>();
  readonly supportsButtons = computed(() => BUTTON_BLOCK_TYPES.has(this.block().type));

  primaryAppearance(appearance: ButtonAppearance | undefined): ButtonAppearance {
    const block = this.appearanceContext.currentBlock(this.block());
    return resolveButtonAppearance(appearance, this.appearanceContext.primaryFallback(block));
  }

  secondaryAppearance(appearance: ButtonAppearance | undefined): ButtonAppearance {
    const block = this.appearanceContext.currentBlock(this.block());
    return resolveButtonAppearance(appearance, this.appearanceContext.secondaryFallback(block));
  }

  updateHeroPrimary(appearance: ButtonAppearanceUpdate): void {
    const block = this.appearanceContext.currentBlock(this.block());
    if (block.type === 'hero') {
      this.blockStore.updateHeroBlock(block.id, {
        primaryButtonAppearance: this.appearanceContext.withFallback(
          block.primaryButtonAppearance,
          appearance,
          this.appearanceContext.primaryFallback(block),
        ),
      });
    }
  }

  updateHeroSecondary(appearance: ButtonAppearanceUpdate): void {
    const block = this.appearanceContext.currentBlock(this.block());
    if (block.type === 'hero') {
      this.blockStore.updateHeroBlock(block.id, {
        secondaryButton: {
          appearance: this.appearanceContext.withFallback(
            block.secondaryButton?.appearance,
            appearance,
            this.appearanceContext.secondaryFallback(block),
          ),
        },
      });
    }
  }

  updateHeaderCta(appearance: ButtonAppearanceUpdate): void {
    const block = this.appearanceContext.currentBlock(this.block());
    if (block.type === 'siteHeader') {
      this.blockStore.updateSiteHeaderBlock(block.id, {
        cta: {
          appearance: this.appearanceContext.withFallback(
            block.cta.appearance,
            appearance,
            this.appearanceContext.primaryFallback(block),
          ),
        },
      });
    }
  }

  updateHeaderBooking(appearance: ButtonAppearanceUpdate): void {
    const block = this.appearanceContext.currentBlock(this.block());
    if (block.type === 'siteHeader') {
      this.blockStore.updateSiteHeaderBlock(block.id, {
        booking: {
          action: {
            appearance: this.appearanceContext.withFallback(
              block.booking?.action.appearance,
              appearance,
              this.appearanceContext.primaryFallback(block),
            ),
          },
        },
      });
    }
  }

  updateContentMediaCta(appearance: ButtonAppearanceUpdate): void {
    const block = this.appearanceContext.currentBlock(this.block());
    if (block.type === 'contentMedia') {
      this.blockStore.updateContentMediaBlock(block.id, {
        cta: {
          appearance: this.appearanceContext.withFallback(
            block.cta?.appearance,
            appearance,
            this.appearanceContext.primaryFallback(block),
          ),
        },
      });
    }
  }

  updateOfferCta(itemId: string, appearance: ButtonAppearanceUpdate): void {
    const block = this.appearanceContext.currentBlock(this.block());
    if (block.type === 'offerList') {
      const item = block.items.find((currentItem) => currentItem.id === itemId);

      if (item !== undefined) {
        this.blockStore.updateOfferListItem(block.id, itemId, {
          cta: {
            appearance: this.appearanceContext.withFallback(
              item.cta?.appearance,
              appearance,
              this.appearanceContext.primaryFallback(block),
            ),
          },
        });
      }
    }
  }

  updateCallToActionPrimary(appearance: ButtonAppearanceUpdate): void {
    const block = this.appearanceContext.currentBlock(this.block());
    if (block.type === 'callToAction') {
      this.blockStore.updateCallToActionBlock(block.id, {
        primaryAction: {
          appearance: this.appearanceContext.withFallback(
            block.primaryAction.appearance,
            appearance,
            this.appearanceContext.primaryFallback(block),
          ),
        },
      });
    }
  }

  updateCallToActionSecondary(appearance: ButtonAppearanceUpdate): void {
    const block = this.appearanceContext.currentBlock(this.block());
    if (block.type === 'callToAction') {
      this.blockStore.updateCallToActionBlock(block.id, {
        secondaryAction: {
          appearance: this.appearanceContext.withFallback(
            block.secondaryAction?.appearance,
            appearance,
            this.appearanceContext.secondaryFallback(block),
          ),
        },
      });
    }
  }

  updateFooterCta(appearance: ButtonAppearanceUpdate): void {
    const block = this.appearanceContext.currentBlock(this.block());
    if (block.type === 'siteFooter') {
      this.blockStore.updateSiteFooterBlock(block.id, {
        cta: {
          appearance: this.appearanceContext.withFallback(
            block.cta.appearance,
            appearance,
            this.appearanceContext.primaryFallback(block),
          ),
        },
      });
    }
  }

  updateFormSubmit(appearance: ButtonAppearanceUpdate): void {
    const block = this.appearanceContext.currentBlock(this.block());
    if (block.type === 'leadForm') {
      this.blockStore.updateLeadFormBlock(block.id, {
        submitAppearance: this.appearanceContext.withFallback(
          block.submitAppearance,
          appearance,
          this.appearanceContext.primaryFallback(block),
        ),
      });
    }
  }
}
