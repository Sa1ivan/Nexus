import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProjectPersistenceService } from '../../../builder/data-access/project-persistence.service';
import type { LeadSubmissionRequest, PublishedRelease } from '../../../builder/domain/models';
import { BlockRendererComponent } from '../../ui/block-renderer/block-renderer.component';

@Component({
  selector: 'app-public-preview-page',
  standalone: true,
  imports: [BlockRendererComponent, RouterLink],
  templateUrl: './public-preview-page.component.html',
  styleUrl: './public-preview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPreviewPageComponent {
  private readonly projectPersistence = inject(ProjectPersistenceService);

  readonly projectId = input.required<string>();
  readonly release = computed<PublishedRelease | null>(() =>
    this.projectPersistence.getPublishedRelease(this.projectId()),
  );

  submitLead(request: LeadSubmissionRequest): void {
    this.projectPersistence.submitLead(request);
  }
}
