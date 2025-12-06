import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login-unlock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login-unlock.component.html',
  styleUrls: ['./login-unlock.component.css'],
})
export class LoginUnlockComponent {
  isLocked = true;
  password = '';
  username = '';
  invalid = false;

  constructor(private auth: AuthService, private router: Router) {}

  onUnlock() {
    this.invalid = false;
    if (this.auth.login(this.username, this.password)) {
      // show unlocked icon briefly then navigate
  this.isLocked = false;
  // wait for unlock animation to finish (700ms) plus a tiny buffer
  setTimeout(() => this.router.navigate(['/dashboard']), 900);
    } else {
      // show invalid shake briefly
      this.invalid = true;
      setTimeout(() => (this.invalid = false), 800);
    }
  }
}
