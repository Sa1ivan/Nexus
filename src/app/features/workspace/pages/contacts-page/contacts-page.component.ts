import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface ContactChannel {
  readonly title: string;
  readonly value: string;
  readonly description: string;
  readonly icon: string;
}

type ContactFormStatus = 'idle' | 'sent';

@Component({
  selector: 'app-contacts-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './contacts-page.component.html',
  styleUrl: './contacts-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsPageComponent {
  readonly formStatus = signal<ContactFormStatus>('idle');
  readonly channels: readonly ContactChannel[] = [
    {
      title: 'Email',
      value: 'hello@nexus.app',
      description: 'Вопросы по проектам, публикациям и заявкам.',
      icon: 'mail',
    },
    {
      title: 'Телефон',
      value: '+7 999 000-00-00',
      description: 'Рабочие дни, 10:00-19:00.',
      icon: 'call',
    },
    {
      title: 'Офис',
      value: 'Moscow, Digital Hub',
      description: 'Команда продукта и поддержки Nexus.',
      icon: 'location_on',
    },
  ] as const;

  submitContactForm(event: Event): void {
    event.preventDefault();
    this.formStatus.set('sent');
  }
}
