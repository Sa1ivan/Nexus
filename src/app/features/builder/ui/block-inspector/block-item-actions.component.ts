import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-block-item-actions',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './block-item-actions.component.html',
  styleUrl: './block-item-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockItemActionsComponent {
  readonly canMoveUp = input(true);
  readonly canMoveDown = input(true);
  readonly canRemove = input(true);

  readonly moveUp = output<void>();
  readonly moveDown = output<void>();
  readonly duplicateItem = output<void>();
  readonly removeItem = output<void>();
}
