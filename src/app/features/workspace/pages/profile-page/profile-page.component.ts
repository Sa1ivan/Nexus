import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import {
  ProjectInsightsService,
  type WorkspaceMetrics,
} from '../../data-access/project-insights.service';

interface ProfileField {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
}

interface WorkspacePreference {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  private readonly projectInsights = inject(ProjectInsightsService);

  readonly metrics: WorkspaceMetrics = this.projectInsights.getMetrics();
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
}
