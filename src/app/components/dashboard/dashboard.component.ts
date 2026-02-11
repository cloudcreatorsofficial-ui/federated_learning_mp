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
  rounds: any[] = [];

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
    // Mark clients as awaiting and open distribution dialog
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

    // Determine targeted clients (for demo we use first 3 clients)
    const targetedIds = this.clients.slice(0, 3).map(c => c.id);
    // Mark targeted clients with a _target flag so the dialog can focus on them
    this.clients.forEach((c) => { c._target = targetedIds.includes(c.id); });

    // open SSE stream for real-time progress — first ensure server has a global model
    const clientParam = targetedIds.join(',');
    const dialogComp = (dialogRef.componentInstance as any);
    
    this.clientService.status().subscribe({
      next: (s) => {
        if (!s || !s.global_model_updated) {
          console.error('No global model available to distribute');
          // close dialog and notify user
          try { dialogRef.close(false); } catch (e) {}
          return;
        }

        const url = `${this.clientService.distributeStreamUrl()}?clients=${clientParam}&model_name=global_model_updated.h5`;
        const es = new EventSource(url);

        es.onmessage = (ev) => {
          try {
            console.debug('SSE message', ev.data);
            const d = JSON.parse(ev.data || '{}');
            const key = d.client; // e.g., 'client1'
            if (key) {
              const id = Number((key || '').replace('client',''));
              const local = this.clients.find(x => x.id === id);
              if (local) {
                if (d.error) {
                  local.status = 'Error: ' + d.error;
                } else if (typeof d.progress === 'number') {
                  local.progress = d.progress;
                  if (d.progress >= 100) {
                    local.status = 'Deployed';
                    local.progress = 100;
                  } else {
                    local.status = `Deploying (${d.progress}%)`;
                  }
                }
              }
            }

            // update center progress if available
            if (d.overall !== undefined && dialogComp) {
              try { dialogComp.progress = d.overall; } catch(e){}
            }

            this.cdr.markForCheck();
          } catch (e) {
            console.error('sse parse error', e);
          }
        };

        es.addEventListener('done', () => {
          try { es.close(); } catch (e) {}
          
          // Signal to dialog that SSE stream is complete
          if (dialogComp) {
            try { dialogComp.sseComplete = true; } catch(e){}
          }

          // after stream finishes, start polling for ack status like before
          let pollCount = 0;
          const maxPolls = 30; // ~60 seconds if interval 2s
          const pollInterval = 2000; // 2s
          const pollId = setInterval(() => {
            pollCount += 1;
            this.clientService.getClientsStatus().subscribe({
              next: (statusObj) => {
                targetedIds.forEach((id) => {
                  const key = `client${id}`;
                  const entry = statusObj[key];
                  if (!entry) return;
                  const localClient = this.clients.find((x) => x.id === id);
                  if (!localClient) return;

                  if (entry.deployed && !entry.ack) {
                    localClient.status = 'Deployed (Awaiting Ack)';
                  }
                  if (entry.ack) {
                    localClient.status = 'Active';
                    localClient.accuracy = localClient.accuracy || (85 + Math.random() * 10).toFixed(1) + '%';
                  }
                });

                this.cdr.markForCheck();

                const allAck = targetedIds.length > 0 && targetedIds.every(id => statusObj[`client${id}`] && statusObj[`client${id}`].ack);
                if (allAck) {
                  clearInterval(pollId);
                  dialogRef.close(true);
                } else if (pollCount >= maxPolls) {
                  clearInterval(pollId);
                  dialogRef.close(false);
                }
              },
              error: (e) => {
                console.error('failed to poll clients status', e);
                if (pollCount >= maxPolls) {
                  clearInterval(pollId);
                  dialogRef.close(false);
                }
              }
            });
          }, pollInterval);
        });

        es.onerror = (err) => {
          console.error('SSE error', err);
          try { es.close(); } catch(e){}
        };
      },
      error: (err) => {
        console.error('failed to fetch status', err);
        try { dialogRef.close(false); } catch (e) {}
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const successDialogRef = this.dialog.open(SuccessDialogComponent, {
          data: { modelName: 'v1.0', message: 'Model distributed to clients successfully.' },
          width: '400px',
          panelClass: 'success-dialog-panel'
        });

        successDialogRef.afterClosed().subscribe(() => {
          // ensure UI mark for check to show final statuses
          this.cdr.markForCheck();
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

  private statusPollInterval: any;

  viewClientProgress() {
    // Show the client progress dashboard view without navigating away
    this.showClientProgress = true;
    this.showProfileMenu = false;
    this.activeTab = 'basic';
    
    // Fetch training history from backend
    this.clientService.getTrainingHistory().subscribe({
      next: (historyData) => {
        if (historyData.rounds && historyData.rounds.length > 0) {
          this.rounds = historyData.rounds;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to fetch training history', err);
        // Use default data if API fails
        this.generateRounds();
      }
    });
    
    // Start polling for real-time client status
    this.startStatusPolling();
  }

  closeClientProgress() {
    this.showClientProgress = false;
    // Stop polling when closing
    if (this.statusPollInterval) {
      clearInterval(this.statusPollInterval);
      this.statusPollInterval = null;
    }
  }

  startStatusPolling() {
    // Poll every 2 seconds for real-time status updates
    if (this.statusPollInterval) {
      clearInterval(this.statusPollInterval);
    }

    this.statusPollInterval = setInterval(() => {
      this.clientService.getClientsStatus().subscribe({
        next: (statusObj) => {
          // Update only the first 3 clients with real status
          for (let i = 1; i <= 3; i++) {
            const key = `client${i}`;
            const status = statusObj[key];
            const client = this.clients.find(c => c.id === i);
            
            if (client && status) {
              if (status.ack) {
                client.status = 'Active';
                client.accuracy = client.accuracy || (85 + Math.random() * 10).toFixed(1) + '%';
              } else if (status.deployed) {
                client.status = 'Deployed (Awaiting Ack)';
              } else {
                client.status = 'Awaiting Model';
              }
              client.lastUpdate = new Date().toLocaleTimeString();
            }
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to fetch client status', err);
        }
      });
    }, 2000); // Poll every 2 seconds
  }

  getClientReadinessPercent(): number {
    const first3Clients = this.clients.slice(0, 3);
    const activeCount = first3Clients.filter((c: any) => c.status === 'Active').length;
    return Math.round((activeCount / 3) * 100);
  }

  getActiveClientsCount(): number {
    return this.clients.slice(0, 3).filter((c: any) => c.status === 'Active').length;
  }

  getAwaitingClientsCount(): number {
    return this.clients.slice(0, 3).filter((c: any) => c.status === 'Awaiting Model').length;
  }

  setActiveTab(tab: 'basic' | 'interactive' | 'diagnostic') {
    this.activeTab = tab;
    // regenerate rounds when switching to interactive to keep values plausible
    if (tab === 'interactive') this.generateRounds();
  }

  generateRounds() {
    // create sample rounds up to 5, latest first
    const maxRounds = 2;
    const rounds: any[] = [];
    for (let r = maxRounds; r >= 1; r--) {
      const clients = this.clients.slice(0, 3).map((c: any, idx: number) => {
        // deterministic-ish sample values based on round and index
        const seed = (r * 13 + idx * 7) % 100;
        const trainingTime = 40 + (seed % 10); // seconds
        const modelSize = 50 + ((seed * 3) % 5); // MB
        const loss = parseFloat((0.45 - r * 0.07 + (Math.random() * 0.05)).toFixed(3));
        const accuracy = 85 + r * 1.3 + (seed % 5);
        return {
          id: c.clientId || `client${idx + 1}`,
          trainingTime: trainingTime + 's',
          modelSize: modelSize,
          loss: loss,
          accuracy: accuracy
        };
      });

      // global metrics sample
      const completionRate = 100;
      const avgLoss = parseFloat((0.407 - r * 0.037).toFixed(3));
      const avgAccuracy = (86.8 + r * 1.3);
      const roundObj = {
        roundNumber: r,
        clients,
        global: {
          loss: avgLoss,
          accuracy: avgAccuracy,
          completionRate,
          timeElapsed: `${2 + r * 0.5} min`
        }
      };
      rounds.push(roundObj);
    }
    this.rounds = rounds;
  }

  getBestLocalDiff(round: any) {
    if (!round || !round.clients || round.clients.length === 0) return null;
    let min = Number.POSITIVE_INFINITY;
    for (const c of round.clients) {
      if (typeof c.loss === 'number' && c.loss < min) min = c.loss;
    }
    return isFinite(min) ? min : null;
  }

  getRingStyle(percent: number) {
    const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
    // primary filled color then a muted track
    return { 'background': `conic-gradient(#2fe29a 0 ${p}%, rgba(255,255,255,0.06) ${p}% 100%)` };
  }

  parseTrainingSeconds(trainingTime: string): number {
    const match = trainingTime.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  getClientColor(index: number): string {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'];
    return colors[index % colors.length];
  }

  getChartPoints(clients: any[], clientIndex: number): string {
    let points = '';
    const xStart = 80;
    const xStep = 100;
    const yBase = 170;
    const yScale = 50;

    clients.forEach((client, i) => {
      const x = xStart + (i * xStep);
      const y = yBase - (client.loss * yScale);
      points += `${x},${y} `;
    });

    return points.trim();
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
    clientId: '',
    status: '',
    loss: 0,
    accuracy: 0,
    trainingTime: 'N/A'
  };

  selectDiagnosticClient(clientId: string) {
    this.selectedDiagnosticClient = clientId;
    // Default to latest round if not set
    this.selectedDiagnosticRound = this.rounds.length > 0 ? this.rounds[0].roundNumber : null;
    this.generateDiagnosticData(clientId);
    this.cdr.markForCheck();
  }

  selectDiagnosticRound(round: string | number) {
    // round comes as string from select, ensure number or null
    const roundNum = round !== undefined && round !== null ? Number(round) : null;
    this.selectedDiagnosticRound = roundNum;
    this.generateDiagnosticData(this.selectedDiagnosticClient);
    this.cdr.markForCheck();
  }

  generateDiagnosticData(clientId: string) {
    // Find client metrics from real training rounds
    const clientMetrics: any = {
      clientId,
      status: 'Active',
      loss: 0,
      accuracy: 0,
      trainingTime: 'N/A'
    };

    // Extract real client data from training rounds
    if (this.rounds && this.rounds.length > 0) {
      let latestRound: any = null;
      
      // Find the latest round
      for (let round of this.rounds) {
        if (round.clients && round.clients.length > 0) {
          const clientMatch = round.clients.find((c: any) => c.id === clientId);
          if (clientMatch) {
            if (!latestRound || round.roundNumber > latestRound.roundNumber) {
              latestRound = round;
            }
          }
        }
      }

      if (latestRound) {
        const selectedClientData = latestRound.clients.find((c: any) => c.id === clientId);
        if (selectedClientData) {
          clientMetrics.loss = selectedClientData.loss;
          clientMetrics.accuracy = selectedClientData.accuracy;
          clientMetrics.trainingTime = selectedClientData.trainingTime;
        }
      }
    }

    this.diagnosticData = {
      clientId,
      status: clientMetrics.status,
      loss: clientMetrics.loss,
      accuracy: clientMetrics.accuracy,
      trainingTime: clientMetrics.trainingTime
    };

    this.cdr.markForCheck();
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
