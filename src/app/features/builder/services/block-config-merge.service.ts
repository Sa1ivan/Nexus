import { Injectable } from '@angular/core';

import type {
  ButtonAppearance,
  ButtonAppearanceUpdate,
  HeaderBookingConfig,
  HeroBlockStyles,
  LandingDesignSettings,
  LeadFormFieldConfig,
  LinkConfig,
  LinkConfigUpdate,
  MediaAsset,
  MediaAssetUpdate,
  SiteHeaderBlockUpdate,
} from '../domain/models';
import { DEFAULT_PRIMARY_BUTTON_APPEARANCE } from '../domain/models';
import { createLink, normalizeLinkTarget } from '../domain/registry/block-registry';

@Injectable({
  providedIn: 'root',
})
export class BlockConfigMergeService {
  mergeRecord<TRecord extends object>(current: TRecord, update: Partial<TRecord>): TRecord {
    const definedUpdate = Object.fromEntries(
      Object.entries(update).filter((entry) => entry[1] !== undefined),
    ) as Partial<TRecord>;
    const didChange = (Object.keys(definedUpdate) as (keyof TRecord)[]).some(
      (key) => !Object.is(current[key], definedUpdate[key]),
    );

    return didChange ? { ...current, ...definedUpdate } : current;
  }

  hasDefinedUpdate(update: object): boolean {
    return Object.values(update).some((value) => value !== undefined);
  }

  mergeLink(current: LinkConfig, update?: LinkConfigUpdate): LinkConfig {
    if (update === undefined) {
      return current;
    }

    const target = normalizeLinkTarget(update.target ?? current.target);

    const merged = this.mergeRecord(current, {
      label: update.label ?? current.label,
      target,
      kind:
        update.kind ??
        (target.startsWith('#')
          ? 'anchor'
          : target.startsWith('mailto:')
            ? 'email'
            : target.startsWith('tel:')
              ? 'phone'
              : target.startsWith('https://')
                ? 'external'
                : 'internal'),
      openInNewTab: update.openInNewTab ?? current.openInNewTab,
      appearance: this.mergeButtonAppearance(current.appearance, update.appearance),
    });

    if (update.appearance !== null || current.appearance === undefined) {
      return merged;
    }

    return {
      id: merged.id,
      label: merged.label,
      target: merged.target,
      kind: merged.kind,
      openInNewTab: merged.openInNewTab,
    };
  }

  mergeButtonAppearance(
    current: ButtonAppearance | undefined,
    update: ButtonAppearanceUpdate | null | undefined,
  ): ButtonAppearance | undefined {
    if (update === undefined) {
      return current;
    }

    if (update === null) {
      return undefined;
    }

    const fallback = current ?? DEFAULT_PRIMARY_BUTTON_APPEARANCE;

    return {
      variant: update.variant ?? fallback.variant,
      backgroundColor: update.backgroundColor ?? fallback.backgroundColor,
      textColor: update.textColor ?? fallback.textColor,
      borderColor: update.borderColor ?? fallback.borderColor,
    };
  }

  mergeOptionalLink(
    current: LinkConfig | undefined,
    update: LinkConfigUpdate | null | undefined,
  ): LinkConfig | undefined {
    if (update === undefined) {
      return current;
    }

    return update === null
      ? undefined
      : this.mergeLink(current ?? createLink('Подробнее', '#lead-form'), update);
  }

  mergeOptionalMedia(
    current: MediaAsset | undefined,
    update: MediaAssetUpdate | null | undefined,
  ): MediaAsset | undefined {
    if (update === undefined) {
      return current;
    }

    return update === null
      ? undefined
      : {
          src: update.src ?? current?.src ?? '',
          alt: update.alt ?? current?.alt ?? '',
          focalPoint: update.focalPoint ?? current?.focalPoint,
        };
  }

  mergeBooking(
    current: HeaderBookingConfig,
    update: NonNullable<SiteHeaderBlockUpdate['booking']>,
  ): HeaderBookingConfig {
    return {
      dateLabel: update.dateLabel ?? current.dateLabel,
      partySizeLabel: update.partySizeLabel ?? current.partySizeLabel,
      action: this.mergeLink(current.action, update.action),
    };
  }

  mergeDesign(
    current: LandingDesignSettings,
    update: Partial<LandingDesignSettings>,
  ): LandingDesignSettings {
    return {
      accentColor: update.accentColor ?? current.accentColor,
      fontPairing: update.fontPairing ?? current.fontPairing,
      density: update.density ?? current.density,
      templateStyle: update.templateStyle ?? current.templateStyle,
    };
  }

  mergeHeroStyles(current: HeroBlockStyles, update?: Partial<HeroBlockStyles>): HeroBlockStyles {
    if (update === undefined) {
      return current;
    }

    return {
      backgroundColor: update.backgroundColor ?? current.backgroundColor,
      textColor: update.textColor ?? current.textColor,
      minHeight: update.minHeight ?? current.minHeight,
      alignment: update.alignment ?? current.alignment,
    };
  }

  cloneOptionalMedia(media: MediaAsset | undefined): MediaAsset | undefined {
    return media === undefined ? undefined : this.cloneRequiredMedia(media);
  }

  cloneRequiredMedia(media: MediaAsset): MediaAsset {
    return {
      ...media,
      focalPoint: media.focalPoint === undefined ? undefined : { ...media.focalPoint },
    };
  }

  duplicateLink(link: LinkConfig, id: string): LinkConfig {
    return {
      ...link,
      id,
      appearance: link.appearance === undefined ? undefined : { ...link.appearance },
    };
  }

  reindexLeadFields(fields: readonly LeadFormFieldConfig[]): readonly LeadFormFieldConfig[] {
    return fields.map((field, index) => ({
      ...field,
      order: index + 1,
    }));
  }
}
