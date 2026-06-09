import type { Routes } from '@angular/router';

import { BuilderPageComponent } from './features/builder/pages/builder-page/builder-page.component';

export const routes: Routes = [
  {
    path: '',
    component: BuilderPageComponent,
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./features/builder/pages/create-landing-page/create-landing-page.component').then(
        (component) => component.CreateLandingPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
