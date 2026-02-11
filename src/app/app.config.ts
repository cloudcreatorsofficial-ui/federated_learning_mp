import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService, AuthGuard, LoginGuard } from './services/auth.service';
import { HospitalClientService } from './services/hospital-client.service';
import { HttpClientModule } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    AuthService,
    AuthGuard,
    LoginGuard,
    HospitalClientService,
  ],
};
