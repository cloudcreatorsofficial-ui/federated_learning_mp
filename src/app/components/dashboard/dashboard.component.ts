import { Component, OnInit, HostListener, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { HospitalClientService } from '../../services/hospital-client.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ModelDistributionDialogComponent } from '../model-distribution-dialog/model-distribution-dialog.component';
import { SuccessDialogComponent } from '../success-dialog/success-dialog.component';
import { SecureVisualizationComponent } from '../secure-visualization/secure-visualization.component';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  displayedColumns: string[] = ['name', 'location', 'status'];
  clients: any[] = [];
  showProfileMenu = false;
  showClientProgress = false;
  activeTab: 'basic' | 'interactive' | 'diagnostic' = 'basic';
  interfaceRoundEntry: any; // placeholder to keep file valid if tooling inspects
  rounds: { roundNumber: number; entries: { clientId: string; trainingTime: string; modelSizeMB: number; localDiffNorm: number; status: string; }[]; global: { loss: string; accuracy: string; completionRate: number; timeElapsed: string; } }[] = [];

  constructor(private clientService: HospitalClientService, private authService: AuthService, private router: Router, private dialog: MatDialog, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.clients = this.clientService.getClients();
    if (!this.clients || this.clients.length === 0) {
      // fallback demo data
      this.clients = [
        { clientId: '001A', name: 'General Hospital', accuracy: '-', dataSize: '1.2 TB', status: 'Awaiting Model' },
        { clientId: '002B', name: "St. Mary's Clinic", accuracy: '-', dataSize: '1.8 TB', status: 'Awaiting Model' },
        { clientId: '003C', name: 'Community Health Center', accuracy: '-', dataSize: '1.8 TB', status: 'Awaiting Model' },
        { clientId: '004D', name: 'Regional Medical', accuracy: '-', dataSize: '2.0 TB', status: 'Awaiting Model' },
        { clientId: '005E', name: 'City Hospital', accuracy: '-', dataSize: '2.5 TB', status: 'Awaiting Model' },
        { clientId: '006F', name: 'Metro Health', accuracy: '-', dataSize: '1.9 TB', status: 'Awaiting Model' },
        { clientId: '007G', name: 'Valley Clinic', accuracy: '-', dataSize: '3.1 TB', status: 'Awaiting Model' },
        { clientId: '008H', name: 'Northside Medical', accuracy: '-', dataSize: '2.7 TB', status: 'Awaiting Model' },
        { clientId: '009I', name: 'East End Hospital', accuracy: '-', dataSize: '1.5 TB', status: 'Awaiting Model' },
        { clientId: '010J', name: 'Westside Clinic', accuracy: '-', dataSize: '2.2 TB', status: 'Awaiting Model' },
      ];
    }
    // generate sample rounds info for the interactive view
    this.generateRounds();
  }

  distributeModel() {
    // Prepare clients for distribution: mark as awaiting and open a dialog bound to the same clients array
    this.clients.forEach((c) => {
      c._prevStatus = c.status;
      c.status = 'Awaiting Model';
    });

    const dialogRef = this.dialog.open(ModelDistributionDialogComponent, {
      data: { modelName: 'v1.0', clients: this.clients },
      width: '650px',
      height: '550px',
      panelClass: 'dist-dialog-panel'
    });

    // Dialog will monitor progress and close when 100%, then show success dialog
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Show success dialog
        const successDialogRef = this.dialog.open(SuccessDialogComponent, {
          data: { modelName: 'v1.0' },
          width: '400px',
          panelClass: 'success-dialog-panel'
        });

        // After success dialog closes, update client statuses
        successDialogRef.afterClosed().subscribe(() => {
          // Simulate staggered distribution to each client, then mark Active or Connected based on previous status
          this.clients.forEach((c, idx) => {
            const startDelay = 800 + idx * 600; // stagger start per client
            setTimeout(() => {
              c.status = 'Deploying';
              // small deploy window
              setTimeout(() => {
                // If previous status was 'Awaiting Model', set to 'Active'; otherwise, set to 'Connected'
                if (c._prevStatus === 'Awaiting Model') {
                  c.status = 'Active';
                } else {
                  c.status = 'Connected';
                }
                // set or update accuracy to a plausible number if not present
                if (!c.accuracy || c.accuracy === '-' ) {
                  const acc = (85 + Math.random() * 10).toFixed(1);
                  c.accuracy = acc + '%';
                }
              }, 1000 + Math.random() * 1000);
            }, startDelay);
          });
        });
      }
    });
  }



  // helper to map status text to an icon name (robust to casing / partial matches)
  getStatusIcon(status: string) {
    const s = (status || '').toLowerCase();
    if (s.indexOf('active') !== -1) return 'check_circle';
    if (s.indexOf('connected') !== -1) return 'radio_button_unchecked';
    if (s.indexOf('await') !== -1 || s.indexOf('awaiting') !== -1) return 'hourglass_empty';
    return 'info';
  }

  getStatusClass(status: string) {
    const s = (status || '').toLowerCase();
    if (s.indexOf('active') !== -1) return 'active';
    if (s.indexOf('connected') !== -1) return 'connected';
    if (s.indexOf('await') !== -1 || s.indexOf('awaiting') !== -1) return 'awaiting';
    return '';
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  viewClientProgress() {
    // Show the client progress dashboard view without navigating away
    this.showClientProgress = true;
    this.showProfileMenu = false;
    this.activeTab = 'basic';
  }

  closeClientProgress() {
    this.showClientProgress = false;
  }

  setActiveTab(tab: 'basic' | 'interactive' | 'diagnostic') {
    this.activeTab = tab;
    // regenerate rounds when switching to interactive to keep values plausible
    if (tab === 'interactive') this.generateRounds();
  }

  generateRounds() {
    // create sample rounds up to 5, latest first
    const maxRounds = 5;
    const rounds: any[] = [];
    for (let r = maxRounds; r >= 1; r--) {
      const entries = this.clients.map((c: any, idx: number) => {
        // deterministic-ish sample values based on round and index
        const seed = (r * 13 + idx * 7) % 100;
        const trainingTime = 30 + (seed % 40); // seconds
        const modelSize = 20 + ((seed * 3) % 200); // MB
        const diff = parseFloat((Math.random() * 1.2).toFixed(3));
        const status = (seed % 11 === 0) ? 'Failed/Timeout' : (seed % 6 === 0 ? 'Training' : (seed % 4 === 0 ? 'Completed' : c.status || '4'));
        return {
          clientId: c.clientId || (('00' + (idx + 1)).slice(-3) + String.fromCharCode(65 + (idx % 26))),
          trainingTime: trainingTime + ' sec',
          modelSizeMB: modelSize,
          localDiffNorm: diff,
          status
        } as { clientId: string; trainingTime: string; modelSizeMB: number; localDiffNorm: number; status: string; };
      });

      // global metrics sample
      const completionRate = Math.round((entries.filter(e => e.status === 'Completed').length / Math.max(1, entries.length)) * 100);
      const loss = (0.35 + (r * 0.02) + (Math.random() * 0.1)).toFixed(3);
      const accuracy = (85 + r * 0.5 + Math.random() * 3).toFixed(1) + '%';
      const roundObj = {
        roundNumber: r,
        entries,
        global: {
          loss,
          accuracy,
          completionRate,
          timeElapsed: `${10 + r} min ${('0' + ((r * 7) % 60)).slice(-2)} sec`
        }
      };
      rounds.push(roundObj);
    }
    this.rounds = rounds;
  }

  getBestLocalDiff(round: { entries: { localDiffNorm: number }[] }) {
    if (!round || !round.entries || round.entries.length === 0) return null;
    let min = Number.POSITIVE_INFINITY;
    for (const e of round.entries) {
      if (typeof e.localDiffNorm === 'number' && e.localDiffNorm < min) min = e.localDiffNorm;
    }
    return isFinite(min) ? min : null;
  }

  getRingStyle(percent: number) {
    const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
    // primary filled color then a muted track
    return { 'background': `conic-gradient(#2fe29a 0 ${p}%, rgba(255,255,255,0.06) ${p}% 100%)` };
  }

  getLatestCompletionRate(): number {
    if (this.rounds && this.rounds.length > 0 && this.rounds[0].global && typeof this.rounds[0].global.completionRate === 'number') {
      return this.rounds[0].global.completionRate;
    }
    return 80;
  }

  @ViewChild('chartCanvas', { static: false }) chartCanvas: ElementRef | undefined;
  

  selectedDiagnosticClient: any = null;
  selectedDiagnosticRound: number | null = null;
  diagnosticData: any = {
    chartData: null,
    performanceHistory: [],
    failureLog: [],
    disconnectionRates: []
  };
  chartInstance: any = null;

  selectDiagnosticClient(clientId: string) {
    this.selectedDiagnosticClient = clientId;
    // Default to latest round if not set
    this.selectedDiagnosticRound = this.rounds.length > 0 ? this.rounds[0].roundNumber : null;
    this.generateDiagnosticData(clientId, this.selectedDiagnosticRound === null ? undefined : this.selectedDiagnosticRound);
    this.cdr.markForCheck();
    setTimeout(() => {
      this.renderChart();
    }, 150);
  }

  selectDiagnosticRound(round: string | number) {
    // round comes as string from select, ensure number or null
    const roundNum = round !== undefined && round !== null ? Number(round) : null;
    this.selectedDiagnosticRound = roundNum;
    this.generateDiagnosticData(this.selectedDiagnosticClient, roundNum === null ? undefined : roundNum);
    this.cdr.markForCheck();
    setTimeout(() => {
      this.renderChart();
    }, 150);
  }

  renderChart() {
    if (!this.diagnosticData.chartData) return;
    
    try {
      // Get canvas element by template reference
      const canvas = this.chartCanvas?.nativeElement as HTMLCanvasElement;
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }
      
      // Destroy existing chart if any
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
      
      // Create new chart
      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.chartInstance = new ChartJS(ctx, {
          type: 'line',
          data: this.diagnosticData.chartData,
          options: this.getChartOptions()
        });
      }
    } catch (e) {
      console.error('Chart rendering error:', e);
    }
  }

  generateDiagnosticData(clientId: string, roundNumber?: number) {
    // If a round is selected, show only that round's data; otherwise, show all
    const rounds = this.rounds.length > 0 ? this.rounds : Array.from({ length: 5 }, (_, i) => ({ roundNumber: 5 - i }));
    let selectedRound: any = null;
    if (typeof roundNumber === 'number') {
      selectedRound = rounds.find((r: any) => r.roundNumber === roundNumber);
    }
    // For performanceHistory, if round selected, only that round; else all
    const performanceHistory = selectedRound && selectedRound.global
      ? [{ round: selectedRound.roundNumber, loss: selectedRound.global.loss }]
      : rounds.map((r: any) => ({ round: r.roundNumber, loss: r.global?.loss || (0.8 - r.roundNumber * 0.12 + Math.random() * 0.1).toFixed(3) }));

    // For failureLog and disconnectionRates, just use sample data (could be extended per round)
    const failureLog = [
      { round: 28, type: 'Timeout', timespain: '5 min', details: 'Model update not received. Reconnection within 5 min imminent.' },
      { round: 32, type: 'NAN loss detected during local dcal training. Check dark data integrity.' }
    ];

    const disconnectionRates = [
      { round: '15', rate: 5.0 },
      { round: '16', rate: 2.0 },
      { round: '17', rate: 2.0 }
    ];

    this.diagnosticData = {
      clientId,
      performanceHistory,
      failureLog,
      disconnectionRates,
      chartData: this.generatePerformanceChartData(performanceHistory)
    };
  }

  generatePerformanceChartData(history: any[]) {
    // Extended history from round 0 to 50 with loss curve
    const allRounds = Array.from({ length: 51 }, (_, i) => i);
    const lossValues = allRounds.map(r => {
      // Simulate loss curve: starts high, decreases rapidly, then plateaus
      if (r === 0) return 1.0;
      if (r < 10) return 0.9 - r * 0.08;
      if (r < 25) return 0.25 - (r - 10) * 0.015;
      return Math.max(0.05, 0.075 - (r - 25) * 0.002);
    });

    return {
      labels: allRounds,
      datasets: [
        {
          label: `Client ${this.selectedDiagnosticClient} Local Loss`,
          data: lossValues,
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0, 255, 136, 0.08)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#00ff88',
          pointBorderColor: '#00ff88'
        }
      ]
    };
  }

  getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        filler: { propagate: true },
        legend: {
          display: true,
          labels: {
            color: '#00ff88',
            font: { size: 12, family: 'Poppins, Arial, sans-serif' },
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#00ff88',
          bodyColor: '#fff',
          borderColor: '#00ff88',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (context: any) => `Round ${context[0].label}`,
            label: (context: any) => `Loss: ${Number(context.parsed.y).toFixed(3)}`
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Round',
            color: '#9fbfdc',
            font: { size: 12 }
          },
          ticks: {
            color: '#9fbfdc',
            font: { size: 10 },
            maxTicksLimit: 10
          },
          grid: {
            color: 'rgba(255,255,255,0.05)',
            drawBorder: true,
            borderColor: 'rgba(255,255,255,0.1)'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Loss',
            color: '#9fbfdc',
            font: { size: 12 }
          },
          ticks: {
            color: '#9fbfdc',
            font: { size: 10 }
          },
          grid: {
            color: 'rgba(255,255,255,0.08)',
            drawBorder: true,
            borderColor: 'rgba(255,255,255,0.1)'
          },
          min: 0,
          max: 1.1
        }
      }
    } as any;
  }

  // Helpers used by the client progress view
  getRandomActive(index: number) {
    // deterministic-ish per index for slightly different values
    const seed = (index + 1) * 9301 % 1000;
    const val = 0.35 + ((seed % 100) / 200); // between ~0.35 and ~0.85
    return val.toFixed(3);
  }

  getRandomSampleSize(index: number) {
    const base = 2500 + (index * 320);
    return base + (index % 5) * 1200;
  }

  openAccountSettings() {
    // TODO: Implement account settings
    console.log('Open Account Settings');
    this.showProfileMenu = false;
  }

  openHelp() {
    // TODO: Implement help
    console.log('Open Help');
    this.showProfileMenu = false;
  }

  signOut() {
    this.authService.logout();
    this.router.navigate(['/'], { replaceUrl: true });
    this.showProfileMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const avatar = target.closest('.avatar');
    const profileMenu = target.closest('.profile-menu');
    if (!avatar && !profileMenu) {
      this.showProfileMenu = false;
    }
  }
}
