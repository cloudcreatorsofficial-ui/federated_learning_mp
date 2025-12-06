import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

import { LoginUnlockComponent } from './components/login-unlock/login-unlock.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SecureVisualizationComponent } from './components/secure-visualization/secure-visualization.component';
import { ModelDistributionDialogComponent } from './components/model-distribution-dialog/model-distribution-dialog.component';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    // standalone components are imported where used; keep login component imported for routing
    LoginUnlockComponent,
    ModelDistributionDialogComponent,
  ],
  providers: [],
})
export class AppModule {}

