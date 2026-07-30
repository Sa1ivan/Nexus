import { inject, Injectable } from '@angular/core';

import {
  DEFAULT_PRIMARY_BUTTON_APPEARANCE,
  DEFAULT_SECONDARY_BUTTON_APPEARANCE,
  getReadableTextColor,
} from '../domain/models';
import type { ButtonAppearance, ButtonAppearanceUpdate, PageBlockConfig } from '../domain/models';
import { BuilderStore } from '../stores/builder.store';

@Injectable({ providedIn: 'root' })
export class ButtonAppearanceContextService {
  private readonly builderStore = inject(BuilderStore);

  currentBlock(block: PageBlockConfig): PageBlockConfig {
    return this.builderStore.activeBlocks().find((current) => current.id === block.id) ?? block;
  }

  withFallback(
    current: ButtonAppearance | undefined,
    update: ButtonAppearanceUpdate,
    fallback: ButtonAppearance,
  ): ButtonAppearanceUpdate {
    return current === undefined ? { ...fallback, ...update } : update;
  }

  primaryFallback(block: PageBlockConfig): ButtonAppearance {
    const theme = this.builderStore.siteConfig().theme;
    const backgroundColor = block.appearance?.accentColor ?? theme.accentColor;

    return {
      ...DEFAULT_PRIMARY_BUTTON_APPEARANCE,
      backgroundColor,
      textColor: getReadableTextColor(backgroundColor),
      borderColor: backgroundColor,
    };
  }

  secondaryFallback(block: PageBlockConfig): ButtonAppearance {
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
