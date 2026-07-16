import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { TestimonialsBlockConfig } from '../../../builder/domain/models';

@Component({
  selector: 'app-testimonials-block',
  standalone: true,
  templateUrl: './testimonials-block.component.html',
  styleUrl: './testimonials-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsBlockComponent {
  readonly block = input.required<TestimonialsBlockConfig>();
}
