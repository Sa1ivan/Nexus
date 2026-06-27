import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import {
  ProjectInsightsService,
  type ProjectPublicationStatus,
  type ProjectSummary,
  type WorkspaceMetrics,
} from '../../data-access/project-insights.service';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPageComponent {
  private readonly projectInsights = inject(ProjectInsightsService);

  readonly metrics: WorkspaceMetrics = this.projectInsights.getMetrics();
  readonly projects: readonly ProjectSummary[] = this.metrics.projects;

  getStatusLabel(status: ProjectPublicationStatus): string {
    return status === 'published' ? 'Опубликован' : 'Черновик';
  }
}
