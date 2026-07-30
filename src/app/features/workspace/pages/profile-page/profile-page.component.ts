import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import {
  EMPTY_WORKSPACE_METRICS,
  ProjectInsightsService,
} from '../../data-access/project-insights.service';
import type { ProfileField, WorkspacePreference } from './profile-page.types';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  private readonly projectInsights = inject(ProjectInsightsService);

  readonly metrics = signal(EMPTY_WORKSPACE_METRICS);
  readonly profileFields: readonly ProfileField[] = [
    {
      label: 'Имя',
      value: 'Владелец workspace',
      icon: 'badge',
    },
    {
      label: 'Почта',
      value: 'owner@nexus.local',
      icon: 'mail',
    },
    {
      label: 'Роль',
      value: 'Администратор',
      icon: 'admin_panel_settings',
    },
    {
      label: 'Хранилище',
      value: 'Локальный браузер',
      icon: 'database',
    },
  ] as const;
  readonly preferences: readonly WorkspacePreference[] = [
    {
      title: 'Публикации',
      description: 'Публичные ссылки создаются после публикации проекта.',
      icon: 'publish',
    },
    {
      title: 'Черновики',
      description: 'Изменения сохраняются как версии текущего лендинга.',
      icon: 'history',
    },
    {
      title: 'Заявки',
      description: 'Формы опубликованных лендингов сохраняют отправки в workspace.',
      icon: 'dynamic_form',
    },
  ] as const;

  async ngOnInit(): Promise<void> {
    this.metrics.set(await this.projectInsights.getMetrics());
  }
}
