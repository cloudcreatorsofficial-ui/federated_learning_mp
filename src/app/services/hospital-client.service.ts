import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HospitalClientService {
  private apiBase = 'http://localhost:8000';

  private clients = [
    { id: 1, clientId: '001A', name: 'Central Hospital', location: 'City A', status: 'Awaiting Model', dataSize: '1.2 TB' },
    { id: 2, clientId: '002B', name: 'Eastside Clinic', location: 'City B', status: 'Awaiting Model', dataSize: '1.8 TB' },
    { id: 3, clientId: '003C', name: 'General Hospital', location: 'City C', status: 'Awaiting Model', dataSize: '2.5 TB' },
    { id: 4, clientId: '004D', name: "St. Mary's Clinic", location: 'City D', status: 'Awaiting Model', dataSize: '1.9 TB' },
    { id: 5, clientId: '005E', name: 'Community Health Center', location: 'City E', status: 'Awaiting Model', dataSize: '3.1 TB' },
    { id: 6, clientId: '006F', name: 'Regional Medical', location: 'City F', status: 'Awaiting Model', dataSize: '2.7 TB' },
    { id: 7, clientId: '007G', name: 'City Hospital', location: 'City G', status: 'Awaiting Model', dataSize: '1.5 TB' },
    { id: 8, clientId: '008H', name: 'Metro Health', location: 'City H', status: 'Awaiting Model', dataSize: '2.2 TB' },
    { id: 9, clientId: '009I', name: 'Valley Clinic', location: 'City I', status: 'Awaiting Model', dataSize: '1.7 TB' },
    { id: 10, clientId: '010J', name: 'Northside Medical', location: 'City J', status: 'Awaiting Model', dataSize: '2.9 TB' },
  ];

  constructor(private http: HttpClient) {}

  getClients(): any[] {
    return this.clients;
  }

  getClient(id: number): any | undefined {
    return this.clients.find(c => c.id === id);
  }

  distributeModel(): Observable<any> {
    return this.http.post(`${this.apiBase}/distribute`, {});
  }

  distributeStreamUrl(): string {
    return `${this.apiBase}/distribute_stream`;
  }

  status(): Observable<any> {
    return this.http.get(`${this.apiBase}/status`);
  }

  getClientsStatus(): Observable<any> {
    return this.http.get(`${this.apiBase}/clients_status`);
  }

  // optional helper for ack (not used by UI currently)
  acknowledgeClient(clientId: number): Observable<any> {
    return this.http.post(`${this.apiBase}/acknowledge/${clientId}`, {});
  }

  getTrainingHistory(): Observable<any> {
    return this.http.get(`${this.apiBase}/training_history`);
  }
}
