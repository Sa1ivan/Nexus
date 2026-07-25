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
  type ProjectPublicationStatus,
} from '../../data-access/project-insights.service';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPageComponent implements OnInit {
  private readonly projectInsights = inject(ProjectInsightsService);

  readonly metrics = signal(EMPTY_WORKSPACE_METRICS);
  readonly projects = computed(() => this.metrics().projects);

  async ngOnInit(): Promise<void> {
    this.metrics.set(await this.projectInsights.getMetrics());
  }

  getStatusLabel(status: ProjectPublicationStatus): string {
    return status === 'published' ? 'Опубликован' : 'Черновик';
  }
}
