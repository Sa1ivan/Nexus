import {
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  type ApplicationConfig,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { LocalProjectRepository } from './features/builder/data-access/local-project.repository';
import { PROJECT_REPOSITORY } from './features/builder/domain/ports';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    LocalProjectRepository,
    {
      provide: PROJECT_REPOSITORY,
      useExisting: LocalProjectRepository,
    },
  ],
};
