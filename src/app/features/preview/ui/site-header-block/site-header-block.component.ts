import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';

import {
  DEFAULT_LANDING_DESIGN_SETTINGS,
  getLandingAccentValue,
  getLandingFontFamily,
  getLandingHeaderPaddingY,
  getLandingRadiusValue,
} from '../../../builder/domain/models';
import type { SiteHeaderBlockConfig } from '../../../builder/domain/models';

@Component({
  selector: 'app-site-header-block',
  standalone: true,
  templateUrl: './site-header-block.component.html',
  styleUrl: './site-header-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderBlockComponent {
  readonly block = input.required<SiteHeaderBlockConfig>();
  readonly menuOpen = signal(false);
  readonly burgerButton = viewChild<ElementRef<HTMLButtonElement>>('burgerButton');

  readonly design = computed(() => this.block().design ?? DEFAULT_LANDING_DESIGN_SETTINGS);
  readonly accentColor = computed<string>(() => getLandingAccentValue(this.design().accentColor));
  readonly fontFamily = computed<string>(() => getLandingFontFamily(this.design().fontPairing));
  readonly radiusValue = computed<string>(() => getLandingRadiusValue(this.design().templateStyle));
  readonly headerPaddingY = computed<string>(() => getLandingHeaderPaddingY(this.design().density));
  readonly menuId = computed(() => `${this.block().id}-navigation`);
  readonly menuButtonLabel = computed(() => (this.menuOpen() ? 'Закрыть меню' : 'Открыть меню'));

  toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      this.burgerButton()?.nativeElement.focus();
    }
  }
}
