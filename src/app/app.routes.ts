import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'builder',
    loadComponent: () =>
      import('./features/builder/pages/builder-page/builder-page.component').then(
        (component) => component.BuilderPageComponent,
      ),
  },
  {
    path: 'builder/:projectId',
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
    path: '',
    loadComponent: () =>
      import('./features/workspace/ui/app-shell/app-shell.component').then(
        (component) => component.AppShellComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/workspace/pages/home-page/home-page.component').then(
            (component) => component.HomePageComponent,
          ),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/workspace/pages/projects-page/projects-page.component').then(
            (component) => component.ProjectsPageComponent,
          ),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./features/workspace/pages/statistics-page/statistics-page.component').then(
            (component) => component.StatisticsPageComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/workspace/pages/profile-page/profile-page.component').then(
            (component) => component.ProfilePageComponent,
          ),
      },
      {
        path: 'contacts',
        loadComponent: () =>
          import('./features/workspace/pages/contacts-page/contacts-page.component').then(
            (component) => component.ContactsPageComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
