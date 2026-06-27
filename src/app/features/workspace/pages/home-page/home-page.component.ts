import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import {
  ProjectInsightsService,
  type ProjectSummary,
  type WorkspaceMetrics,
} from '../../data-access/project-insights.service';

interface HomeCapability {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly projectInsights = inject(ProjectInsightsService);

  readonly metrics: WorkspaceMetrics = this.projectInsights.getMetrics();
  readonly recentProjects: readonly ProjectSummary[] = this.metrics.projects.slice(0, 3);
  readonly capabilities: readonly HomeCapability[] = [
    {
      title: 'Сборка лендингов',
      description: 'Редактор блоков, мастер структуры и публикация одной ссылкой.',
      icon: 'edit_square',
    },
    {
      title: 'Контроль проектов',
      description: 'Черновики, версии, релизы и заявки собраны в одном workspace.',
      icon: 'folder_open',
    },
    {
      title: 'Оценка результата',
      description: 'Статистика по блокам, публикациям и заявкам помогает видеть картину.',
      icon: 'monitoring',
    },
  ] as const;
}
