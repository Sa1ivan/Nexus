import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import {
  EMPTY_WORKSPACE_METRICS,
  ProjectInsightsService,
  type BlockDistributionItem,
  type ProjectLeadStats,
} from '../../data-access/project-insights.service';

@Component({
  selector: 'app-statistics-page',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './statistics-page.component.html',
  styleUrl: './statistics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPageComponent implements OnInit {
  private readonly projectInsights = inject(ProjectInsightsService);

  readonly metrics = signal(EMPTY_WORKSPACE_METRICS);
  readonly blockDistribution = signal<readonly BlockDistributionItem[]>([]);
  readonly leadStats = signal<readonly ProjectLeadStats[]>([]);

  async ngOnInit(): Promise<void> {
    const [metrics, blockDistribution, leadStats] = await Promise.all([
      this.projectInsights.getMetrics(),
      this.projectInsights.getBlockDistribution(),
      this.projectInsights.getProjectLeadStats(),
    ]);

    this.metrics.set(metrics);
    this.blockDistribution.set(blockDistribution);
    this.leadStats.set(leadStats);
  }
}
