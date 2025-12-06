import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="success-dialog">
      <div class="success-card">
        <div class="check"> <mat-icon>check_circle</mat-icon> </div>
        <h3>Model successfully distributed</h3>
        <p>{{ data?.modelName }} has been deployed to all clients.</p>
        <p class="muted small">Clients will use the model for a month before sending updates.</p>
        <div class="actions">
          <button mat-button (click)="close()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .success-dialog { padding: 1.25rem; }
    .success-card {
      text-align: center;
      color: #000000;
      background: #ffffff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .success-card .check { font-size: 52px; color: #39d67a; margin-bottom: 8px; }
    .success-card h3 { margin: 6px 0 6px; font-weight:600; }
    .success-card p { margin: 6px 0; }
    .success-card .small { font-size: 0.85rem; color: rgba(0,0,0,0.6); }
    .actions { text-align: center; margin-top: 1rem; }
  `]
})
export class SuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { modelName: string }
  ) {}

  close() {
    this.dialogRef.close();
  }
}
