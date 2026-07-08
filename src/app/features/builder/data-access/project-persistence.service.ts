import { Injectable } from '@angular/core';

import {
  createLink,
  createLinkFromText,
  normalizeLinkTarget,
} from '../domain/registry/block-registry';
import { validateSiteConfig } from '../domain/utils/site-config-validation';
import type {
  DraftRevision,
  FooterMapConfig,
  HeaderBookingConfig,
  HeroContentAlignment,
  LandingAccentColor,
  LandingDensity,
  LandingDesignSettings,
  LandingFontPairing,
  LandingFooterVariant,
  LandingHeaderVariant,
  LandingOfferListVariant,
  LandingTemplateStyle,
  LeadFormFieldConfig,
  LeadSubmission,
  LeadSubmissionRequest,
  LinkConfig,
  MediaAsset,
  OfferListItem,
  PageBlockConfig,
  PageConfig,
  Project,
  PublishedRelease,
  SiteConfig,
} from '../domain/models';

interface ProjectStorageState {
  readonly projects: readonly Project[];
  readonly leads: readonly LeadSubmission[];
  readonly activeProjectId: string | null;
}

const STORAGE_KEY = 'nexus.builder.projects.v1';

@Injectable({
  providedIn: 'root',
})
export class ProjectPersistenceService {
  listProjects(): readonly Project[] {
    return this.readState().projects;
  }

  getProject(projectId: string): Project | null {
    return this.readState().projects.find((project) => project.id === projectId) ?? null;
  }

  getActiveProject(): Project | null {
    const state = this.readState();

    if (state.activeProjectId === null) {
      return state.projects[0] ?? null;
    }

    return state.projects.find((project) => project.id === state.activeProjectId) ?? null;
  }

  setActiveProject(projectId: string): void {
    const state = this.readState();

    this.writeState({
      ...state,
      activeProjectId: projectId,
    });
  }

  saveDraft(project: Project, siteConfig: SiteConfig): Project {
    const validation = validateSiteConfig(siteConfig);

    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    const now = new Date().toISOString();
    const version = project.draftVersion + 1;
    const revision: DraftRevision = {
      id: this.createId('revision'),
      version,
      siteConfig: this.clone(siteConfig),
      createdAt: now,
    };
    const nextProject: Project = {
      ...project,
      name: siteConfig.name,
      draft: this.clone(siteConfig),
      draftVersion: version,
      revisions: [...project.revisions, revision],
      updatedAt: now,
    };

    return this.upsertProject(nextProject);
  }

  createProject(siteConfig: SiteConfig): Project {
    const validation = validateSiteConfig(siteConfig);

    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: this.createId('project'),
      name: siteConfig.name,
      draft: this.clone(siteConfig),
      draftVersion: 1,
      publishedReleaseId: null,
      releases: [],
      revisions: [
        {
          id: this.createId('revision'),
          version: 1,
          siteConfig: this.clone(siteConfig),
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    return this.upsertProject(project);
  }

  publishProject(project: Project, siteConfig: SiteConfig): Project {
    const validation = validateSiteConfig(siteConfig);

    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    const now = new Date().toISOString();
    const nextVersion = project.releases.length + 1;
    const release: PublishedRelease = {
      id: this.createId('release'),
      version: nextVersion,
      siteConfig: this.clone(siteConfig),
      publishedAt: now,
    };
    const nextProject: Project = {
      ...project,
      name: siteConfig.name,
      draft: this.clone(siteConfig),
      draftVersion: project.draftVersion + 1,
      publishedReleaseId: release.id,
      releases: [...project.releases, release],
      revisions: [
        ...project.revisions,
        {
          id: this.createId('revision'),
          version: project.draftVersion + 1,
          siteConfig: this.clone(siteConfig),
          createdAt: now,
        },
      ],
      updatedAt: now,
    };

    return this.upsertProject(nextProject);
  }

  getPublishedRelease(projectId: string): PublishedRelease | null {
    const project = this.getProject(projectId);

    if (project?.publishedReleaseId === undefined || project.publishedReleaseId === null) {
      return null;
    }

    return project.releases.find((release) => release.id === project.publishedReleaseId) ?? null;
  }

  submitLead(request: LeadSubmissionRequest): LeadSubmission {
    const state = this.readState();
    const lead: LeadSubmission = {
      id: this.createId('lead'),
      projectId: request.projectId,
      blockId: request.blockId,
      fields: { ...request.fields },
      status: 'stored',
      createdAt: new Date().toISOString(),
    };

    this.writeState({
      ...state,
      leads: [...state.leads, lead],
    });

    return lead;
  }

  listLeads(projectId: string): readonly LeadSubmission[] {
    return this.readState().leads.filter((lead) => lead.projectId === projectId);
  }

  private upsertProject(project: Project): Project {
    const state = this.readState();
    const projects = state.projects.some((storedProject) => storedProject.id === project.id)
      ? state.projects.map((storedProject) =>
          storedProject.id === project.id ? project : storedProject,
        )
      : [...state.projects, project];

    this.writeState({
      projects,
      leads: state.leads,
      activeProjectId: project.id,
    });

    return project;
  }

  private readState(): ProjectStorageState {
    if (!this.hasLocalStorage()) {
      return this.createEmptyState();
    }

    const rawState = globalThis.localStorage.getItem(STORAGE_KEY);

    if (rawState === null) {
      return this.createEmptyState();
    }

    try {
      return this.normalizeStorageState(JSON.parse(rawState) as unknown);
    } catch {
      return this.createEmptyState();
    }
  }

  private writeState(state: ProjectStorageState): void {
    if (!this.hasLocalStorage()) {
      return;
    }

    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private createEmptyState(): ProjectStorageState {
    return {
      projects: [],
      leads: [],
      activeProjectId: null,
    };
  }

  private clone<TValue>(value: TValue): TValue {
    return JSON.parse(JSON.stringify(value)) as TValue;
  }

  private normalizeStorageState(value: unknown): ProjectStorageState {
    const record = this.asRecord(value);

    if (record === null) {
      return this.createEmptyState();
    }

    const projects = this.asArray(record['projects'])
      .map((project) => this.normalizeProject(project))
      .filter((project): project is Project => project !== null);
    const leads = this.asArray(record['leads'])
      .map((lead) => this.normalizeLead(lead))
      .filter((lead): lead is LeadSubmission => lead !== null);
    const activeProjectId =
      typeof record['activeProjectId'] === 'string' ? record['activeProjectId'] : null;

    return {
      projects,
      leads,
      activeProjectId,
    };
  }

  private normalizeProject(value: unknown): Project | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    const draft = this.normalizeSiteConfig(record['draft']);

    if (draft === null) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('project')),
      name: this.readString(record['name'], draft.name),
      draft,
      draftVersion: this.readNumber(record['draftVersion'], 1),
      publishedReleaseId:
        typeof record['publishedReleaseId'] === 'string' ? record['publishedReleaseId'] : null,
      releases: this.asArray(record['releases'])
        .map((release) => this.normalizeRelease(release))
        .filter((release): release is PublishedRelease => release !== null),
      revisions: this.asArray(record['revisions'])
        .map((revision) => this.normalizeRevision(revision))
        .filter((revision): revision is DraftRevision => revision !== null),
      createdAt: this.readString(record['createdAt'], new Date().toISOString()),
      updatedAt: this.readString(record['updatedAt'], new Date().toISOString()),
    };
  }

  private normalizeRelease(value: unknown): PublishedRelease | null {
    const record = this.asRecord(value);
    const siteConfig = this.normalizeSiteConfig(record?.['siteConfig']);

    if (record === null || siteConfig === null) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('release')),
      version: this.readNumber(record['version'], 1),
      siteConfig,
      publishedAt: this.readString(record['publishedAt'], new Date().toISOString()),
    };
  }

  private normalizeRevision(value: unknown): DraftRevision | null {
    const record = this.asRecord(value);
    const siteConfig = this.normalizeSiteConfig(record?.['siteConfig']);

    if (record === null || siteConfig === null) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('revision')),
      version: this.readNumber(record['version'], 1),
      siteConfig,
      createdAt: this.readString(record['createdAt'], new Date().toISOString()),
    };
  }

  private normalizeLead(value: unknown): LeadSubmission | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('lead')),
      projectId: this.readString(record['projectId'], ''),
      blockId: this.readString(record['blockId'], ''),
      fields: this.readStringRecord(record['fields']),
      status: record['status'] === 'failed' ? 'failed' : 'stored',
      createdAt: this.readString(record['createdAt'], new Date().toISOString()),
    };
  }

  private normalizeSiteConfig(value: unknown): SiteConfig | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    const pages = this.asArray(record['pages'])
      .map((page) => this.normalizePage(page))
      .filter((page): page is PageConfig => page !== null);

    if (pages.length === 0) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('site')),
      schemaVersion: this.readNumber(record['schemaVersion'], 1),
      name: this.readString(record['name'], 'Nexus demo'),
      pages,
    };
  }

  private normalizePage(value: unknown): PageConfig | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    return {
      id: this.readString(record['id'], this.createId('page')),
      slug: this.readString(record['slug'], 'home'),
      title: this.readString(record['title'], 'Главная'),
      blocks: this.asArray(record['blocks'])
        .map((block) => this.normalizeBlock(block))
        .filter((block): block is PageBlockConfig => block !== null),
    };
  }

  private normalizeBlock(value: unknown): PageBlockConfig | null {
    const record = this.asRecord(value);

    if (record === null) {
      return null;
    }

    const id = this.readString(record['id'], this.createId('block'));
    const anchor = this.readString(record['anchor'], id);
    const design = this.readDesign(record['design']);
    const styles = this.asRecord(record['styles']);

    switch (record['type']) {
      case 'siteHeader':
        return {
          id,
          anchor,
          type: 'siteHeader',
          design,
          variant: this.readHeaderVariant(record['variant']),
          brandName: this.readString(record['brandName'], 'Nexus Studio'),
          navigationItems: this.readLinks(record['navigationItems']),
          cta: this.readLink(record['cta'], this.readString(record['ctaText'], 'Связаться')),
          booking: this.readBooking(record['booking']),
        };
      case 'hero':
        return {
          id,
          anchor,
          type: 'hero',
          design,
          title: this.readString(record['title'], 'Заголовок'),
          subtitle: this.readString(record['subtitle'], ''),
          buttonText: this.readString(record['buttonText'], 'Оставить заявку'),
          buttonHref: normalizeLinkTarget(this.readString(record['buttonHref'], '#lead-form')),
          media: this.readMedia(record['media']),
          secondaryButton: this.readOptionalLink(record['secondaryButton']),
          styles: {
            backgroundColor: this.readString(styles?.['backgroundColor'], '#f5f7fb'),
            textColor: this.readString(styles?.['textColor'], '#111827'),
            buttonBackgroundColor: this.readString(styles?.['buttonBackgroundColor'], '#111827'),
            buttonTextColor: this.readString(styles?.['buttonTextColor'], '#ffffff'),
            minHeight: this.readString(styles?.['minHeight'], '520px'),
            alignment: this.readHeroAlignment(styles?.['alignment']),
          },
        };
      case 'offerList':
        return {
          id,
          anchor,
          type: 'offerList',
          design,
          variant: this.readOfferVariant(record['variant']),
          eyebrow: this.readString(record['eyebrow'], 'Предложения'),
          title: this.readString(record['title'], 'Что мы предлагаем'),
          items: this.asArray(record['items']).map((item, index) =>
            this.readOfferItem(item, index),
          ),
        };
      case 'siteFooter':
        return {
          id,
          anchor,
          type: 'siteFooter',
          design,
          variant: this.readFooterVariant(record['variant']),
          brandName: this.readString(record['brandName'], 'Nexus Studio'),
          cta: this.readLink(record['cta'], this.readString(record['ctaText'], 'Оставить заявку')),
          contactLines: this.readStringArray(record['contactLines']),
          links: this.readLinks(record['links']),
          socialLinks: this.readLinks(record['socialLinks']),
          map: this.readMap(record['map']),
        };
      case 'leadForm':
        return {
          id,
          anchor,
          type: 'leadForm',
          design,
          title: this.readString(record['title'], 'Оставьте заявку'),
          description: this.readString(record['description'], ''),
          submitText: this.readString(record['submitText'], 'Отправить'),
          successMessage: this.readString(record['successMessage'], 'Заявка сохранена.'),
          fields: this.asArray(record['fields']).map((field, index) =>
            this.readLeadField(field, index),
          ),
        };
      default:
        return null;
    }
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private asArray(value: unknown): readonly unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private readString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
  }

  private readNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private readStringArray(value: unknown): readonly string[] {
    return this.asArray(value)
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private readStringRecord(value: unknown): Readonly<Record<string, string>> {
    const record = this.asRecord(value);

    if (record === null) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(record)
        .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
        .map(([key, fieldValue]) => [key, fieldValue.trim()]),
    );
  }

  private readLinks(value: unknown): readonly LinkConfig[] {
    return this.asArray(value)
      .map((item, index) => {
        if (typeof item === 'string') {
          return createLinkFromText(item, index);
        }

        return this.readOptionalLink(item);
      })
      .filter((link): link is LinkConfig => link !== undefined);
  }

  private readLink(value: unknown, fallbackLabel: string): LinkConfig {
    const fallback = createLink(fallbackLabel, '#lead-form');
    const record = this.asRecord(value);

    if (record === null) {
      return fallback;
    }

    const target = normalizeLinkTarget(this.readString(record['target'], fallback.target));

    return {
      label: this.readString(record['label'], fallback.label),
      target,
      kind:
        record['kind'] === 'anchor' ||
        record['kind'] === 'internal' ||
        record['kind'] === 'external' ||
        record['kind'] === 'email' ||
        record['kind'] === 'phone'
          ? record['kind']
          : target.startsWith('#')
            ? 'anchor'
            : target.startsWith('mailto:')
              ? 'email'
              : target.startsWith('tel:')
                ? 'phone'
                : target.startsWith('https://')
                  ? 'external'
                  : 'internal',
    };
  }

  private readOptionalLink(value: unknown): LinkConfig | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    return this.readLink(record, 'Подробнее');
  }

  private readMedia(value: unknown): MediaAsset | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    const src = this.readString(record['src'], '');

    if (!src) {
      return undefined;
    }

    return {
      src,
      alt: this.readString(record['alt'], 'Изображение блока'),
    };
  }

  private readBooking(value: unknown): HeaderBookingConfig | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    return {
      dateLabel: this.readString(record['dateLabel'], 'Сегодня'),
      partySizeLabel: this.readString(record['partySizeLabel'], '2 гостя'),
      action: this.readLink(record['action'], 'Проверить'),
    };
  }

  private readMap(value: unknown): FooterMapConfig | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    return {
      label: this.readString(record['label'], 'Карта'),
      address: this.readString(record['address'], ''),
      embedUrl: normalizeLinkTarget(this.readString(record['embedUrl'], '#contact')),
    };
  }

  private readOfferItem(value: unknown, index: number): OfferListItem {
    const record = this.asRecord(value);

    if (record === null) {
      return {
        title: `Пункт ${index + 1}`,
        description: 'Описание предложения.',
        meta: 'Новое',
      };
    }

    return {
      title: this.readString(record['title'], `Пункт ${index + 1}`),
      description: this.readString(record['description'], 'Описание предложения.'),
      meta: this.readString(record['meta'], 'Новое'),
      price: typeof record['price'] === 'string' ? record['price'] : undefined,
      badge: typeof record['badge'] === 'string' ? record['badge'] : undefined,
      image: this.readMedia(record['image']),
      cta: this.readOptionalLink(record['cta']),
    };
  }

  private readLeadField(value: unknown, index: number): LeadFormFieldConfig {
    const record = this.asRecord(value);

    if (record === null) {
      return {
        id: `field-${index + 1}`,
        label: `Поле ${index + 1}`,
        type: 'text',
        placeholder: '',
        required: false,
        order: index + 1,
      };
    }

    return {
      id: this.readString(record['id'], `field-${index + 1}`),
      label: this.readString(record['label'], `Поле ${index + 1}`),
      type: this.readLeadFieldType(record['type']),
      placeholder: this.readString(record['placeholder'], ''),
      required: record['required'] === true,
      helpText: typeof record['helpText'] === 'string' ? record['helpText'] : undefined,
      order: this.readNumber(record['order'], index + 1),
    };
  }

  private readDesign(value: unknown): LandingDesignSettings | undefined {
    const record = this.asRecord(value);

    if (record === null) {
      return undefined;
    }

    return {
      accentColor: this.readAccentColor(record['accentColor']),
      fontPairing: this.readFontPairing(record['fontPairing']),
      density: this.readDensity(record['density']),
      templateStyle: this.readTemplateStyle(record['templateStyle']),
    };
  }

  private readHeaderVariant(value: unknown): LandingHeaderVariant {
    switch (value) {
      case 'centeredHero':
      case 'splitMedia':
      case 'reservationBar':
      case 'editorial':
      case 'burgerMenu':
      case 'stretchedNav':
        return value;
      default:
        return 'centeredHero';
    }
  }

  private readOfferVariant(value: unknown): LandingOfferListVariant {
    switch (value) {
      case 'menuGrid':
      case 'roomCards':
      case 'pricingTable':
      case 'catalogGrid':
        return value;
      default:
        return 'catalogGrid';
    }
  }

  private readFooterVariant(value: unknown): LandingFooterVariant {
    switch (value) {
      case 'contactMap':
      case 'compactLegal':
      case 'socialLead':
      case 'bookingFooter':
        return value;
      default:
        return 'bookingFooter';
    }
  }

  private readHeroAlignment(value: unknown): HeroContentAlignment {
    return value === 'left' || value === 'right' ? value : 'center';
  }

  private readLeadFieldType(value: unknown): LeadFormFieldConfig['type'] {
    return value === 'email' || value === 'tel' || value === 'textarea' ? value : 'text';
  }

  private readAccentColor(value: unknown): LandingAccentColor {
    return value === 'blue' ||
      value === 'rose' ||
      value === 'violet' ||
      value === 'amber' ||
      value === 'teal'
      ? value
      : 'teal';
  }

  private readFontPairing(value: unknown): LandingFontPairing {
    return value === 'serif' || value === 'rounded' || value === 'grotesk' ? value : 'grotesk';
  }

  private readDensity(value: unknown): LandingDensity {
    return value === 'compact' || value === 'spacious' || value === 'balanced' ? value : 'balanced';
  }

  private readTemplateStyle(value: unknown): LandingTemplateStyle {
    return value === 'editorial' || value === 'conversion' || value === 'classic'
      ? value
      : 'classic';
  }

  private hasLocalStorage(): boolean {
    return typeof globalThis.localStorage !== 'undefined';
  }

  private createId(prefix: string): string {
    if (globalThis.crypto?.randomUUID !== undefined) {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now().toString(36)}`;
  }
}
