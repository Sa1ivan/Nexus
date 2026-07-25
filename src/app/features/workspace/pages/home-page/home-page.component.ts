import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import {
  EMPTY_WORKSPACE_METRICS,
  ProjectInsightsService,
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
export class HomePageComponent implements OnInit {
  private readonly projectInsights = inject(ProjectInsightsService);

  readonly metrics = signal(EMPTY_WORKSPACE_METRICS);
  readonly recentProjects = computed(() => this.metrics().projects.slice(0, 3));
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

  async ngOnInit(): Promise<void> {
    this.metrics.set(await this.projectInsights.getMetrics());
  }
}
