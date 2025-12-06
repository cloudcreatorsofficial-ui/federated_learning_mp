import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService, AuthGuard, LoginGuard } from './services/auth.service';
import { HospitalClientService } from './services/hospital-client.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    AuthService,
    AuthGuard,
    LoginGuard,
    HospitalClientService,
  ],
};
