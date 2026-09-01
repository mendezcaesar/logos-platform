import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private authService = inject(AuthService);

  async handleGitHubLogin(): Promise<void> {
    try {
      await this.authService.loginWithGitHub();
    } catch (err) {
      console.error('UI OAuth Trigger Fail:', err);
    }
  }
}
