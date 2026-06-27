import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/builder/pages/builder-page/builder-page.component').then(
        (component) => component.BuilderPageComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./features/builder/pages/create-landing-page/create-landing-page.component').then(
        (component) => component.CreateLandingPageComponent,
      ),
  },
  {
    path: 'p/:projectId',
    loadComponent: () =>
      import('./features/preview/pages/public-preview-page/public-preview-page.component').then(
        (component) => component.PublicPreviewPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
