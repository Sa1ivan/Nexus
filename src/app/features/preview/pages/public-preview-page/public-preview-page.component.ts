import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

import type {
  PageConfig,
  PageSeoConfig,
  PublishedRelease,
  SiteSeoConfig,
} from '../../../builder/domain/models';
import { PROJECT_REPOSITORY } from '../../../builder/domain/ports';
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
  private readonly projectRepository = inject(PROJECT_REPOSITORY);
  private readonly documentRef = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly releaseSignal = signal<PublishedRelease | null>(null);
  private readonly loadingSignal = signal(true);
  private loadRequestId = 0;

  readonly projectId = input.required<string>();
  readonly pageSlug = input<string>();
  readonly release = this.releaseSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly activePage = computed<PageConfig | null>(() => {
    const release = this.release();

    if (release === null) {
      return null;
    }

    const pageSlug = this.pageSlug();

    return pageSlug === undefined
      ? (release.siteConfig.pages[0] ?? null)
      : (release.siteConfig.pages.find((page) => page.slug === pageSlug) ?? null);
  });
  readonly pageMissing = computed(() => this.release() !== null && this.activePage() === null);

  constructor() {
    effect(() => {
      void this.loadRelease(this.projectId());
    });

    effect((onCleanup) => {
      const release = this.release();
      const pageSeo = this.activePage()?.seo;

      if (release !== null && pageSeo !== undefined) {
        onCleanup(this.applySeo(release.siteConfig.seo, pageSeo));
      }
    });
  }

  async submitLead(event: LeadSubmissionEvent): Promise<void> {
    try {
      await this.projectRepository.submitLead(event.request);
      event.complete(true);
    } catch {
      event.complete(false);
    }
  }

  private async loadRelease(projectId: string): Promise<void> {
    const requestId = ++this.loadRequestId;
    this.loadingSignal.set(true);
    this.releaseSignal.set(null);

    try {
      const release = await this.projectRepository.getPublishedRelease(projectId);

      if (requestId === this.loadRequestId) {
        this.releaseSignal.set(release);
      }
    } catch {
      if (requestId === this.loadRequestId) {
        this.releaseSignal.set(null);
      }
    } finally {
      if (requestId === this.loadRequestId) {
        this.loadingSignal.set(false);
      }
    }
  }

  private applySeo(siteSeo: SiteSeoConfig, pageSeo: PageSeoConfig): () => void {
    const root = this.documentRef.documentElement;
    const previousTitle = this.title.getTitle();
    const previousLanguage = root.lang;
    const previousDescription = this.meta.getTag("name='description'")?.content ?? null;
    const previousRobots = this.meta.getTag("name='robots'")?.content ?? null;
    const previousOgTitle = this.meta.getTag("property='og:title'")?.content ?? null;
    const previousOgDescription = this.meta.getTag("property='og:description'")?.content ?? null;
    const previousOgImage = this.meta.getTag("property='og:image'")?.content ?? null;
    let favicon = this.documentRef.querySelector<HTMLLinkElement>("link[rel~='icon']");
    const createdFavicon = favicon === null && siteSeo.favicon !== null;

    if (createdFavicon) {
      favicon = this.documentRef.createElement('link');
      favicon.rel = 'icon';
      this.documentRef.head.append(favicon);
    }

    const previousFavicon = favicon?.getAttribute('href') ?? null;

    this.title.setTitle(pageSeo.title);
    root.lang = siteSeo.language;
    this.meta.updateTag({ name: 'description', content: pageSeo.description });
    this.meta.updateTag({ property: 'og:title', content: pageSeo.title });
    this.meta.updateTag({ property: 'og:description', content: pageSeo.description });
    this.updateOptionalMeta('og:image', pageSeo.socialImage?.src ?? null);

    if (pageSeo.noIndex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' });
    } else {
      this.meta.removeTag("name='robots'");
    }

    if (favicon !== null && siteSeo.favicon !== null) {
      favicon.href = siteSeo.favicon.src;
    }

    return () => {
      this.title.setTitle(previousTitle);
      root.lang = previousLanguage;
      this.restoreMeta('description', previousDescription, 'name');
      this.restoreMeta('robots', previousRobots, 'name');
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
