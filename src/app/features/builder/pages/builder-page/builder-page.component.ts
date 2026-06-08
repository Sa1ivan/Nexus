import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BuilderStore } from '../../stores/builder.store';
import { BlockRendererComponent } from '../../ui/block-renderer/block-renderer.component';

@Component({
  selector: 'app-builder-page',
  standalone: true,
  imports: [BlockRendererComponent, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './builder-page.component.html',
  styleUrl: './builder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderPageComponent {
  private readonly builderStore = inject(BuilderStore);

  readonly siteConfig = this.builderStore.siteConfig;
  readonly pages = this.builderStore.pages;
  readonly activePageSlug = this.builderStore.activePageSlug;
  readonly activePage = this.builderStore.activePage;
  readonly activeBlocks = this.builderStore.activeBlocks;

  selectPage(slug: string): void {
    this.builderStore.selectPage(slug);
  }
}
