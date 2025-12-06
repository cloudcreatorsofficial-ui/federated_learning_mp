import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-model-distribution-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './model-distribution-dialog.component.html',
  styleUrls: ['./model-distribution-dialog.component.css'],
})
export class ModelDistributionDialogComponent {
  // data may contain modelName and clients array
  constructor(
    public dialogRef: MatDialogRef<ModelDistributionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { modelName: string; clients?: any[] }
  ) {}

  close() {
    this.dialogRef.close(true);
  }

  // number of active clients
  activeCount(): number {
    const arr = this.data && this.data.clients ? this.data.clients : [];
    return arr.filter((c: any) => (c && c.status) === 'Active').length;
  }

  totalCount(): number {
    const arr = this.data && this.data.clients ? this.data.clients : [];
    return arr.length;
  }

  // percentage completed (round to nearest integer)
  distributionPercent(): number {
    const total = this.totalCount();
    if (!total) return 0;
    return Math.round((this.activeCount() / total) * 100);
  }

  // whether a distribution is currently ongoing
  isDistributing(): boolean {
    const total = this.totalCount();
    if (!total) return false;
    // distribute while at least one client is not Active
    return !this.allActive();
  }

  // helper used from template to map status to icon
  iconFor(status?: string) {
    const s = (status || '').toLowerCase();
    if (s.indexOf('active') !== -1) return 'check_circle';
    if (s.indexOf('deploy') !== -1) return 'autorenew';
    if (s.indexOf('await') !== -1) return 'hourglass_empty';
    return 'info';
  }

  clsFor(status?: string) {
    const s = (status || '').toLowerCase();
    if (s.indexOf('active') !== -1) return 'ok';
    if (s.indexOf('deploy') !== -1) return 'deploying';
    if (s.indexOf('await') !== -1) return 'waiting';
    return '';
  }

  allActive(): boolean {
    const arr = this.data && this.data.clients ? this.data.clients : [];
    return arr.length > 0 && arr.every((c: any) => (c && c.status) === 'Active');
  }

  getNodes(): any[] {
    const clientCount = this.totalCount();
    const nodes = [];
    for (let i = 0; i < clientCount; i++) {
      const angle = (i / clientCount) * 2 * Math.PI - Math.PI / 2; // start from top
      const radius = 120; // distance from center
      const x = 50 + (radius / 160) * 50 * Math.cos(angle); // percentage
      const y = 50 + (radius / 160) * 50 * Math.sin(angle);
      nodes.push({ left: `${x}%`, top: `${y}%` });
    }
    return nodes;
  }

  private _watcher: any;
  // visual progress percentage for distributing UI (1..100)
  progress = 0;
  private _progressTimer: any;

  ngOnInit(): void {
    // watch for progress to reach 100% and close dialog
    this._watcher = setInterval(() => {
      try {
        if (this.progress >= 100) {
          // Close the distribution dialog when progress reaches 100%
          this.dialogRef.close(true);
        } else {
          // start progress animation if not already running
          if (!this._progressTimer) {
            // initialize at 1 when distribution begins
            this.progress = 1;
            this._progressTimer = setInterval(() => {
              // increment by 5% gradually until 100%
              if (this.progress < 100) {
                this.progress += 5;
                if (this.progress > 100) this.progress = 100;
              }
            }, 80);
          }
          // Make dialog transparent during distribution
          this.dialogRef.addPanelClass('dist-distributing-panel');
        }
      } catch (e) {
        // ignore if dialogRef not available
      }
    }, 180);
  }

  ngOnDestroy(): void {
    if (this._watcher) {
      clearInterval(this._watcher);
      this._watcher = null;
    }
    if (this._progressTimer) {
      clearInterval(this._progressTimer);
      this._progressTimer = null;
    }
    try {
      this.dialogRef.removePanelClass('dist-success-panel');
      this.dialogRef.removePanelClass('dist-distributing-panel');
    } catch (e) {}
  }
}
