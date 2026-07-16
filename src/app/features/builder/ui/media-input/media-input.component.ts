import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1600;

@Component({
  selector: 'app-media-input',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './media-input.component.html',
  styleUrl: './media-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaInputComponent {
  readonly label = input('Изображение');
  readonly src = input('');
  readonly alt = input('');
  readonly showAlt = input(true);
  readonly required = input(false);

  readonly srcChange = output<string>();
  readonly altChange = output<string>();

  readonly error = signal<string | null>(null);
  readonly isProcessing = signal(false);

  updateUrl(event: Event): void {
    const value = this.readValue(event).trim();

    if (this.required() && value === '') {
      this.error.set('Для этого элемента нужно изображение. Удалите сам элемент или укажите URL.');
      return;
    }

    this.error.set(null);
    this.srcChange.emit(value);
  }

  updateAlt(event: Event): void {
    this.altChange.emit(this.readValue(event));
  }

  async uploadFile(event: Event): Promise<void> {
    const input = event.target;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const file = input.files?.[0];
    input.value = '';

    if (file === undefined) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      this.error.set('Поддерживаются JPEG, PNG и WebP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.error.set('Файл должен быть меньше 8 МБ.');
      return;
    }

    this.error.set(null);
    this.isProcessing.set(true);

    try {
      this.srcChange.emit(await this.resizeImage(file));
    } catch {
      this.error.set('Не удалось обработать изображение.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  clear(): void {
    if (this.required()) {
      this.error.set('Для этого элемента нужно изображение. Удалите сам элемент целиком.');
      return;
    }

    this.error.set(null);
    this.srcChange.emit('');
  }

  private resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        try {
          const scale = Math.min(
            1,
            MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight),
          );
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext('2d');

          if (context === null) {
            reject(new Error('Canvas is unavailable'));
            return;
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const webp = canvas.toDataURL('image/webp', 0.82);
          resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.86));
        } catch (error: unknown) {
          reject(error instanceof Error ? error : new Error('Image processing failed'));
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image decoding failed'));
      };
      image.src = objectUrl;
    });
  }

  private readValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.value : '';
  }
}
