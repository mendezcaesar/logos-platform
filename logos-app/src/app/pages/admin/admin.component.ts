import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent {
  private authService = inject(AuthService);
  user = this.authService.user;

  async handleLogout(): Promise<void> {
    await this.authService.logout();
  }
}
