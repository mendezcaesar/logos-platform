import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  // Silicon Valley Rule: We load ReactiveFormsModule to activate programmatic state machine form controllers
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  
  user = this.authService.user;
  isSaving = signal<boolean>(false);

  // Programmatic State Container Form Machine
  public cmsForm: FormGroup;

  constructor() {
    // We instantiate the form controls with explicit custom whitespace protection guards
    this.cmsForm = new FormGroup({
      title: new FormControl('', [Validators.required, this.strictWhitespaceValidator]),
      excerpt: new FormControl(''),
      content: new FormControl('', [Validators.required, this.strictWhitespaceValidator])
    });
  }

  /**
   * 🏆 World's Best Practice: Custom Clean-Space Validation Engine.
   * This intercepts spacebar spammers. If a box contains ONLY spaces, it strips them down, 
   * detects the empty string, and marks the field completely INVALID at the code level.
   */
  private strictWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const isWhitespace = (value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { whitespaceViolation: true };
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Submits clean text to our Supabase database container over a secure authenticated connection.
   */
  async handleCreatePost(): Promise<void> {
    if (this.cmsForm.invalid) {
      this.cmsForm.markAllAsTouched();
      return;
    }

    // High-Security Lock: Force the app to verify the token cache status live before pushing data
    const isAuthenticated = await this.authService.ensureAuthenticatedSession();

    if (!isAuthenticated) {
      alert('Security violation: Your authentication token is not fully loaded. Please wait 2 seconds and try again!');
      return;
    }

    this.isSaving.set(true);

    const rawTitle = this.cmsForm.get('title')?.value;
    const rawContent = this.cmsForm.get('content')?.value;
    const rawExcerpt = this.cmsForm.get('excerpt')?.value;

    const payload = {
      title: rawTitle.trim(),
      slug: this.generateSlug(rawTitle),
      content: rawContent.trim(),
      excerpt: rawExcerpt?.trim() || null
    };

    const { error } = await this.supabaseService.client
      .from('posts')
      .insert([payload]);

    this.isSaving.set(false);

    if (error) {
      console.error('Database Operation Crash Logs:', error.message);
      alert(`Database rejected article creation: ${error.message}`);
    } else {
      alert('Success! Your article was successfully written to the cloud Postgres database.');
      this.cmsForm.reset({ title: '', excerpt: '', content: '' });
    }
  }


  async handleLogout(): Promise<void> {
    await this.authService.logout();
  }
}
