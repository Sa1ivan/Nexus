import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { SiteFooterBlockConfig } from '../../domain/models';
import { BuilderBlockStore } from '../../stores/builder-block.store';
import { PageLinkEditorComponent } from '../page-link-editor/page-link-editor.component';
import { BlockItemActionsComponent } from './block-item-actions.component';
import { readInputChecked, readInputValue } from './block-inspector-input';

@Component({
  selector: 'app-site-footer-content-inspector',
  standalone: true,
  imports: [BlockItemActionsComponent, MatButtonModule, MatIconModule, PageLinkEditorComponent],
  templateUrl: './site-footer-content-inspector.component.html',
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterContentInspectorComponent {
  private readonly builderStore = inject(BuilderBlockStore);

  readonly block = input.required<SiteFooterBlockConfig>();

  updateFooterBrand(event: Event): void {
    this.builderStore.updateSiteFooterBlock(this.block().id, { brandName: readInputValue(event) });
  }
  updateFooterInheritance(event: Event): void {
    this.builderStore.updateSiteFooterBlock(this.block().id, {
      inheritBusiness: readInputChecked(event),
    });
  }
  updateFooterCta(field: 'label' | 'target', event: Event): void {
    this.builderStore.updateSiteFooterBlock(this.block().id, {
      cta: { [field]: readInputValue(event) },
    });
  }
  updateFooterCtaTarget(target: string): void {
    this.builderStore.updateSiteFooterBlock(this.block().id, { cta: { target } });
  }
  updateFooterContacts(event: Event): void {
    this.builderStore.updateSiteFooterBlock(this.block().id, {
      contactLines: readInputValue(event)
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    });
  }
  updateFooterLink(id: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateFooterLink(this.block().id, id, { [field]: readInputValue(event) });
  }
  updateFooterLinkTarget(id: string, target: string): void {
    this.builderStore.updateFooterLink(this.block().id, id, { target });
  }
  addFooterLink(): void {
    this.builderStore.addFooterLink(this.block().id);
  }
  duplicateFooterLink(id: string): void {
    this.builderStore.duplicateFooterLink(this.block().id, id);
  }
  moveFooterLink(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveFooterLink(this.block().id, id, direction);
  }
  removeFooterLink(id: string): void {
    this.builderStore.removeFooterLink(this.block().id, id);
  }
  updateFooterSocial(id: string, field: 'label' | 'target', event: Event): void {
    this.builderStore.updateFooterSocialLink(this.block().id, id, {
      [field]: readInputValue(event),
    });
  }
  addFooterSocial(): void {
    this.builderStore.addFooterSocialLink(this.block().id);
  }
  duplicateFooterSocial(id: string): void {
    this.builderStore.duplicateFooterSocialLink(this.block().id, id);
  }
  moveFooterSocial(id: string, direction: 'up' | 'down'): void {
    this.builderStore.moveFooterSocialLink(this.block().id, id, direction);
  }
  removeFooterSocial(id: string): void {
    this.builderStore.removeFooterSocialLink(this.block().id, id);
  }
}
