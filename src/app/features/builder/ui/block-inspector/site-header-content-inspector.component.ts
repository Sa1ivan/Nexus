import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { SiteHeaderBlockConfig } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { MediaInputComponent } from '../media-input/media-input.component';
import { PageLinkEditorComponent } from '../page-link-editor/page-link-editor.component';
import { BlockItemActionsComponent } from './block-item-actions.component';
import { readInputChecked, readInputValue } from './block-inspector-input';

@Component({
  selector: 'app-site-header-content-inspector',
  standalone: true,
  imports: [
    BlockItemActionsComponent,
    MatButtonModule,
    MatIconModule,
    MediaInputComponent,
    PageLinkEditorComponent,
  ],
  templateUrl: './site-header-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<SiteHeaderBlockConfig>();

  updateHeaderBrand(event: Event): void {
    this.builderStore.updateSiteHeaderBlock(this.block().id, { brandName: readInputValue(event) });
  }

  updateHeaderInheritance(event: Event): void {
    this.builderStore.updateSiteHeaderBlock(this.block().id, {
      inheritBusiness: readInputChecked(event),
    });
  }

  updateHeaderLogo(field: 'src' | 'alt', value: string): void {
    this.builderStore.updateSiteHeaderBlock(this.block().id, {
      logo: value === '' && field === 'src' ? null : { [field]: value },
    });
  }

  updateHeaderCta(field: 'label' | 'target', event: Event): void {
    this.builderStore.updateSiteHeaderBlock(this.block().id, {
      cta: { [field]: readInputValue(event) },
    });
  }

  updateHeaderCtaTarget(target: string): void {
    this.builderStore.updateSiteHeaderBlock(this.block().id, { cta: { target } });
  }

  updateHeaderNavigationItem(linkId: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateHeaderNavigationItem(this.block().id, linkId, {
      [field]: readInputValue(event),
    });
  }

  updateHeaderNavigationTarget(linkId: string, target: string): void {
    this.builderStore.updateHeaderNavigationItem(this.block().id, linkId, { target });
  }

  toggleHeaderNavigationTarget(linkId: string, event: Event): void {
    this.builderStore.updateHeaderNavigationItem(this.block().id, linkId, {
      openInNewTab: readInputChecked(event),
    });
  }

  addHeaderNavigationItem(): void {
    this.builderStore.addHeaderNavigationItem(this.block().id);
  }
  duplicateHeaderNavigationItem(id: string): void {
    this.builderStore.duplicateHeaderNavigationItem(this.block().id, id);
  }
  moveHeaderNavigationItem(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveHeaderNavigationItem(this.block().id, id, direction);
  }
  removeHeaderNavigationItem(id: string): void {
    this.builderStore.removeHeaderNavigationItem(this.block().id, id);
  }
}
