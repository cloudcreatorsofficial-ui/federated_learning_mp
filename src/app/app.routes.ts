import { Routes } from '@angular/router';
import { LoginUnlockComponent } from './components/login-unlock/login-unlock.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard, LoginGuard } from './services/auth.service';

export const routes: Routes = [
	{ path: '', component: LoginUnlockComponent, canActivate: [LoginGuard] },
	{ path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
];
