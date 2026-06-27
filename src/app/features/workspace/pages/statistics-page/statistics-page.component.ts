import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import {
  ProjectInsightsService,
  type BlockDistributionItem,
  type ProjectLeadStats,
  type WorkspaceMetrics,
} from '../../data-access/project-insights.service';

@Component({
  selector: 'app-statistics-page',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './statistics-page.component.html',
  styleUrl: './statistics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPageComponent {
  private readonly projectInsights = inject(ProjectInsightsService);

  readonly metrics: WorkspaceMetrics = this.projectInsights.getMetrics();
  readonly blockDistribution: readonly BlockDistributionItem[] =
    this.projectInsights.getBlockDistribution();
  readonly leadStats: readonly ProjectLeadStats[] = this.projectInsights.getProjectLeadStats();
}
