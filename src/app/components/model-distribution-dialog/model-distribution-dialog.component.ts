import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
export class ModelDistributionDialogComponent implements OnInit, OnDestroy {
  // data may contain modelName and clients array
  constructor(
    public dialogRef: MatDialogRef<ModelDistributionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { modelName: string; clients?: any[] },
    public cdr: ChangeDetectorRef
  ) {}

  close() {
    this.dialogRef.close(true);
  }

  // number of clients that are deployed (or in deploying state)
  deployedCount(): number {
    const arr = this.data && this.data.clients ? this.data.clients : [];
    const targetArr = arr.filter((c: any) => c && c._target === true);
    const used = targetArr.length > 0 ? targetArr : arr;
    return used.filter((c: any) => {
      const s = (c && c.status || '').toLowerCase();
      return s.indexOf('deploy') !== -1 || s.indexOf('deployed') !== -1 || s.indexOf('active') !== -1;
    }).length;
  }

  totalCount(): number {
    const arr = this.data && this.data.clients ? this.data.clients : [];
    const targetArr = arr.filter((c: any) => c && c._target === true);
    const used = targetArr.length > 0 ? targetArr : arr;
    return used.length;
  }

  // percentage completed (round to nearest integer) based on deployed clients
  distributionPercent(): number {
    const total = this.totalCount();
    if (!total) return 0;
    return Math.round((this.deployedCount() / total) * 100);
  }

  // whether a distribution is currently ongoing
  isDistributing(): boolean {
    const total = this.totalCount();
    if (!total) return false;
    // distributing while at least one client is not yet deployed
    return this.deployedCount() < total;
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
    const clientCount = this.clientCount > 0 ? this.clientCount : this.totalCount();
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
  sseComplete = false;
  clientCount = 0;

  ngOnInit(): void {
    // Set the number of targeted clients
    this.clientCount = this.totalCount();
    
    // update visual progress based on SSE stream only
    this._watcher = setInterval(() => {
      try {
        // Only rely on SSE progress (current), not on computed status percentage
        const current = this.progress;

        // Only close when SSE stream signals completion (current === 100)
        if (current >= 100 && this.sseComplete) {
          this.progress = 100;
          // give a short success animation then close
          try {
            this.dialogRef.removePanelClass('dist-distributing-panel');
            this.dialogRef.addPanelClass('dist-success-panel');
          } catch (e) {}
          setTimeout(() => {
            try {
              this.dialogRef.close(true);
            } catch (e) {}
          }, 500);
          if (this._watcher) {
            clearInterval(this._watcher);
            this._watcher = null;
          }
        }
      } catch (e) {
        // ignore errors
      }
    }, 400);
  }

  ngOnDestroy(): void {
    if (this._watcher) {
      clearInterval(this._watcher);
      this._watcher = null;
    }
    try {
      this.dialogRef.removePanelClass('dist-success-panel');
      this.dialogRef.removePanelClass('dist-distributing-panel');
    } catch (e) {}
  }
}
