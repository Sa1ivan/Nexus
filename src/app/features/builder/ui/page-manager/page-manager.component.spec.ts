import { computed, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { MatMenuTrigger } from '@angular/material/menu';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SITE_CONFIG } from '../../data-access/default-site.config';
import type { PageConfig, PageSeoConfig } from '../../domain/models';
import { BuilderStore } from '../../stores/builder.store';
import { PageManagerComponent } from './page-manager.component';

describe('PageManagerComponent', () => {
  const defaultHomePage = DEFAULT_SITE_CONFIG.pages[0]!;
  const homePage: PageConfig = {
    ...defaultHomePage,
    seo: {
      ...defaultHomePage.seo,
      title: 'Главная',
    },
  };
  const aboutPage: PageConfig = {
    ...homePage,
    id: 'page-about',
    slug: 'about',
    title: 'О компании',
    seo: {
      ...homePage.seo,
      title: 'О компании',
    },
  };
  const pages = signal<readonly PageConfig[]>([homePage]);
  const activePageId = signal(homePage.id);
  const pageError = signal<string | null>(null);
  const store = {
    pages: pages.asReadonly(),
    activePageId: activePageId.asReadonly(),
    activePage: computed(
      () => pages().find((page) => page.id === activePageId()) ?? pages()[0] ?? null,
    ),
    pageError: pageError.asReadonly(),
    selectPage: vi.fn<(slug: string) => boolean>(),
    addPage: vi.fn<(title: string) => boolean>(),
    renamePage: vi.fn<(pageId: string, title: string) => boolean>(),
    updatePageSlug: vi.fn<(pageId: string, slug: string) => boolean>(),
    updatePageSeo: vi.fn<(pageId: string, update: Partial<PageSeoConfig>) => boolean>(),
    duplicatePage: vi.fn<(pageId: string) => boolean>(),
    movePage: vi.fn<(pageId: string, direction: 'up' | 'down') => boolean>(),
    removePage: vi.fn<(pageId: string) => boolean>(),
  };

  beforeEach(async () => {
    pages.set([homePage]);
    activePageId.set(homePage.id);
    pageError.set(null);
    vi.clearAllMocks();
    store.renamePage.mockReturnValue(true);
    store.updatePageSlug.mockReturnValue(true);
    store.updatePageSeo.mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [PageManagerComponent],
      providers: [{ provide: BuilderStore, useValue: store }],
    }).compileComponents();
  });

  it('renders page navigation, the active page editor and add action', () => {
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('nav[aria-label="Страницы сайта"]')).not.toBeNull();
    expect(
      Array.from(root.querySelectorAll('button')).some(
        (button) => button.getAttribute('aria-label') === 'Добавить страницу',
      ),
    ).toBe(true);
    expect(root.querySelector<HTMLInputElement>('#page-title')?.value).toBe('Главная');
    expect(root.querySelector<HTMLInputElement>('#page-slug')?.value).toBe('home');
    expect(root.querySelector<HTMLInputElement>('#page-seo-title')?.value).toBe('Главная');
  });

  it('adds a page with the default title', () => {
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const addButton = root.querySelector<HTMLButtonElement>(
      'button[aria-label="Добавить страницу"]',
    );

    addButton?.click();

    expect(store.addPage).toHaveBeenCalledOnce();
    expect(store.addPage).toHaveBeenCalledWith('Новая страница');
  });

  it('selects and delegates page actions with stable page ids', () => {
    pages.set([homePage, aboutPage]);
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectPage(aboutPage);
    fixture.componentInstance.movePage(aboutPage.id, 'up');
    fixture.componentInstance.duplicatePage(aboutPage.id);

    expect(store.selectPage).toHaveBeenCalledWith('about');
    expect(store.movePage).toHaveBeenCalledWith(aboutPage.id, 'up');
    expect(store.duplicatePage).toHaveBeenCalledWith(aboutPage.id);
  });

  it('updates page identity on input', () => {
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const titleInput = root.querySelector<HTMLInputElement>('#page-title')!;
    const slugInput = root.querySelector<HTMLInputElement>('#page-slug')!;

    titleInput.value = 'О студии';
    titleInput.dispatchEvent(new Event('input'));
    slugInput.value = 'about-us';
    slugInput.dispatchEvent(new Event('input'));

    expect(store.renamePage).toHaveBeenCalledWith(homePage.id, 'О студии');
    expect(store.updatePageSlug).toHaveBeenCalledWith(homePage.id, 'about-us');
  });

  it('restores accepted identity values when the store rejects a change', () => {
    store.renamePage.mockImplementationOnce(() => {
      pageError.set('Введите название страницы.');
      return false;
    });
    store.updatePageSlug.mockImplementationOnce(() => {
      pageError.set('Этот адрес страницы зарезервирован системой.');
      return false;
    });
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const titleInput = root.querySelector<HTMLInputElement>('#page-title')!;
    const slugInput = root.querySelector<HTMLInputElement>('#page-slug')!;

    titleInput.value = '';
    titleInput.dispatchEvent(new Event('input'));
    slugInput.value = 'builder';
    slugInput.dispatchEvent(new Event('input'));

    expect(titleInput.value).toBe('Главная');
    expect(slugInput.value).toBe('home');
  });

  it('preserves incomplete separators while typing a title and slug', () => {
    store.renamePage.mockReturnValueOnce(false).mockReturnValueOnce(true);
    store.updatePageSlug.mockReturnValueOnce(false).mockReturnValueOnce(true);
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const titleInput = root.querySelector<HTMLInputElement>('#page-title')!;
    const slugInput = root.querySelector<HTMLInputElement>('#page-slug')!;

    titleInput.value = 'Главная ';
    titleInput.dispatchEvent(new Event('input'));
    expect(titleInput.value).toBe('Главная ');

    titleInput.value += 'страница';
    titleInput.dispatchEvent(new Event('input'));
    expect(store.renamePage).toHaveBeenLastCalledWith(homePage.id, 'Главная страница');

    slugInput.value = 'home-';
    slugInput.dispatchEvent(new Event('input'));
    expect(slugInput.value).toBe('home-');

    slugInput.value += 'page';
    slugInput.dispatchEvent(new Event('input'));
    expect(store.updatePageSlug).toHaveBeenLastCalledWith(homePage.id, 'home-page');
  });

  it('restores canonical page identity values after leaving an input', () => {
    store.renamePage.mockReturnValueOnce(false);
    store.updatePageSlug.mockReturnValueOnce(false);
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const titleInput = root.querySelector<HTMLInputElement>('#page-title')!;
    const slugInput = root.querySelector<HTMLInputElement>('#page-slug')!;

    titleInput.value = 'Главная ';
    titleInput.dispatchEvent(new Event('input'));
    titleInput.dispatchEvent(new Event('blur'));
    slugInput.value = 'home-';
    slugInput.dispatchEvent(new Event('input'));
    slugInput.dispatchEvent(new Event('blur'));

    expect(titleInput.value).toBe('Главная');
    expect(slugInput.value).toBe('home');
  });

  it('updates page SEO fields on input and noindex on change', () => {
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const titleInput = root.querySelector<HTMLInputElement>('#page-seo-title')!;
    const descriptionInput = root.querySelector<HTMLTextAreaElement>('#page-seo-description')!;
    const noIndexInput = root.querySelector<HTMLInputElement>('#page-seo-noindex')!;

    titleInput.value = 'Главная — Nexus';
    titleInput.dispatchEvent(new Event('input'));
    descriptionInput.value = 'Описание главной страницы';
    descriptionInput.dispatchEvent(new Event('input'));
    noIndexInput.checked = true;
    noIndexInput.dispatchEvent(new Event('change'));

    expect(store.updatePageSeo).toHaveBeenNthCalledWith(1, homePage.id, {
      title: 'Главная — Nexus',
    });
    expect(store.updatePageSeo).toHaveBeenNthCalledWith(2, homePage.id, {
      description: 'Описание главной страницы',
    });
    expect(store.updatePageSeo).toHaveBeenNthCalledWith(3, homePage.id, {
      noIndex: true,
    });
  });

  it('rejects page SEO values that would make the draft invalid', () => {
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const titleInput = root.querySelector<HTMLInputElement>('#page-seo-title')!;
    const descriptionInput = root.querySelector<HTMLTextAreaElement>('#page-seo-description')!;

    titleInput.value = '   ';
    titleInput.dispatchEvent(new Event('input'));
    descriptionInput.value = 'A'.repeat(181);
    descriptionInput.dispatchEvent(new Event('input'));

    expect(store.updatePageSeo).not.toHaveBeenCalled();
    expect(titleInput.value).toBe('Главная');
    expect(descriptionInput.value).toBe(homePage.seo.description);
  });

  it('requires confirmation before deleting a page and supports cancellation', () => {
    pages.set([homePage, aboutPage]);
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();

    fixture.componentInstance.requestDelete(homePage.id);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Удалить страницу без возможности восстановления?');
    clickButton(root, 'Отмена');
    fixture.detectChanges();
    expect(root.textContent).not.toContain('Удалить страницу без возможности восстановления?');

    fixture.componentInstance.requestDelete(homePage.id);
    fixture.detectChanges();
    clickButton(root, 'Удалить');

    expect(store.removePage).toHaveBeenCalledOnce();
    expect(store.removePage).toHaveBeenCalledWith(homePage.id);
  });

  it('does not start deletion when only one page remains', () => {
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();

    fixture.componentInstance.requestDelete(homePage.id);
    fixture.detectChanges();

    expect(fixture.componentInstance.pendingDeletePageId()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Удалить страницу без возможности восстановления?',
    );
  });

  it('disables the delete action when only one page remains', async () => {
    const fixture = TestBed.createComponent(PageManagerComponent);
    fixture.detectChanges();
    const menuTrigger = fixture.debugElement
      .query(By.directive(MatMenuTrigger))
      .injector.get(MatMenuTrigger);

    menuTrigger.openMenu();
    fixture.detectChanges();
    await fixture.whenStable();
    const deleteButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.includes('Удалить страницу') === true);

    expect(deleteButton).toBeDefined();
    expect(deleteButton?.disabled).toBe(true);
  });
});

function clickButton(root: HTMLElement, label: string): void {
  const button = Array.from(root.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === label,
  );

  if (button === undefined) {
    throw new Error(`Button "${label}" is missing.`);
  }

  button.click();
}
