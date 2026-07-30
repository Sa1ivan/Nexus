import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import type { AppNavItem } from './app-shell.types';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly navItems: readonly AppNavItem[] = [
    {
      label: 'Главная',
      path: '/',
      icon: 'space_dashboard',
      exact: true,
    },
    {
      label: 'Мои проекты',
      path: '/projects',
      icon: 'folder_open',
      exact: false,
    },
    {
      label: 'Статистика',
      path: '/statistics',
      icon: 'monitoring',
      exact: false,
    },
    {
      label: 'Профиль',
      path: '/profile',
      icon: 'account_circle',
      exact: false,
    },
    {
      label: 'Контакты',
      path: '/contacts',
      icon: 'alternate_email',
      exact: false,
    },
  ] as const;
}
