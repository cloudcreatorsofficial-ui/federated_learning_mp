import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginUnlockComponent } from './components/login-unlock/login-unlock.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const routes: Routes = [
  { path: '', component: LoginUnlockComponent },
  { path: 'dashboard', component: DashboardComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
