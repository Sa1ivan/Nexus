import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
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
import { BookingSelectionService } from '../../data-access/booking-selection.service';
import { ButtonAppearanceDirective } from '../button-appearance/button-appearance.directive';
import { LandingLinkDirective } from '../landing-link/landing-link.directive';

@Component({
  selector: 'app-site-header-block',
  standalone: true,
  imports: [ButtonAppearanceDirective, LandingLinkDirective],
  templateUrl: './site-header-block.component.html',
  styleUrl: './site-header-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderBlockComponent {
  private readonly bookingSelection = inject(BookingSelectionService);

  readonly block = input.required<SiteHeaderBlockConfig>();
  readonly menuOpen = signal(false);
  readonly bookingDate = signal('');
  readonly bookingPartySize = signal('2');
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

  updateBookingDate(event: Event): void {
    this.bookingDate.set(this.controlValue(event));
  }

  updateBookingPartySize(event: Event): void {
    this.bookingPartySize.set(this.controlValue(event));
  }

  captureBooking(event: MouseEvent): void {
    if (!this.bookingDate()) {
      event.preventDefault();
      return;
    }

    this.bookingSelection.set({
      date: this.bookingDate(),
      partySize: this.bookingPartySize(),
    });
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      this.burgerButton()?.nativeElement.focus();
    }
  }

  private controlValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement || target instanceof HTMLSelectElement
      ? target.value
      : '';
  }
}
