import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

import { ProjectPersistenceService } from '../../../builder/data-access/project-persistence.service';
import type { PublishedRelease, SiteSeoConfig } from '../../../builder/domain/models';
import {
  BlockRendererComponent,
  type LeadSubmissionEvent,
} from '../../ui/block-renderer/block-renderer.component';

@Component({
  selector: 'app-public-preview-page',
  standalone: true,
  imports: [BlockRendererComponent, RouterLink],
  templateUrl: './public-preview-page.component.html',
  styleUrl: './public-preview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPreviewPageComponent {
  private readonly projectPersistence = inject(ProjectPersistenceService);
  private readonly documentRef = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  readonly projectId = input.required<string>();
  readonly release = computed<PublishedRelease | null>(() =>
    this.projectPersistence.getPublishedRelease(this.projectId()),
  );

  constructor() {
    effect((onCleanup) => {
      const release = this.release();

      if (release !== null) {
        onCleanup(this.applySeo(release.siteConfig.seo));
      }
    });
  }

  submitLead(event: LeadSubmissionEvent): void {
    try {
      this.projectPersistence.submitLead(event.request);
      event.complete(true);
    } catch {
      event.complete(false);
    }
  }

  private applySeo(seo: SiteSeoConfig): () => void {
    const root = this.documentRef.documentElement;
    const previousTitle = this.title.getTitle();
    const previousLanguage = root.lang;
    const previousDescription = this.meta.getTag("name='description'")?.content ?? null;
    const previousOgTitle = this.meta.getTag("property='og:title'")?.content ?? null;
    const previousOgDescription = this.meta.getTag("property='og:description'")?.content ?? null;
    const previousOgImage = this.meta.getTag("property='og:image'")?.content ?? null;
    let favicon = this.documentRef.querySelector<HTMLLinkElement>("link[rel~='icon']");
    const createdFavicon = favicon === null && seo.favicon !== null;

    if (createdFavicon) {
      favicon = this.documentRef.createElement('link');
      favicon.rel = 'icon';
      this.documentRef.head.append(favicon);
    }

    const previousFavicon = favicon?.getAttribute('href') ?? null;

    this.title.setTitle(seo.title);
    root.lang = seo.language;
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.updateOptionalMeta('og:image', seo.socialImage?.src ?? null);

    if (favicon !== null && seo.favicon !== null) {
      favicon.href = seo.favicon.src;
    }

    return () => {
      this.title.setTitle(previousTitle);
      root.lang = previousLanguage;
      this.restoreMeta('description', previousDescription, 'name');
      this.restoreMeta('og:title', previousOgTitle, 'property');
      this.restoreMeta('og:description', previousOgDescription, 'property');
      this.restoreMeta('og:image', previousOgImage, 'property');

      if (createdFavicon) {
        favicon?.remove();
      } else if (favicon !== null && previousFavicon !== null) {
        favicon.href = previousFavicon;
      }
    };
  }

  private updateOptionalMeta(property: string, content: string | null): void {
    if (content === null || content === '') {
      this.meta.removeTag(`property='${property}'`);
      return;
    }

    this.meta.updateTag({ property, content });
  }

  private restoreMeta(value: string, content: string | null, attribute: 'name' | 'property'): void {
    if (content === null) {
      this.meta.removeTag(`${attribute}='${value}'`);
      return;
    }

    this.meta.updateTag({ [attribute]: value, content });
  }
}
