import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  
  user = this.authService.user;
  isSaving = signal<boolean>(false);
  public cmsForm: FormGroup;

  constructor() {
    this.cmsForm = new FormGroup({
      title: new FormControl('', [Validators.required, this.strictWhitespaceValidator]),
      excerpt: new FormControl(''),
      content: new FormControl('', [Validators.required, this.strictWhitespaceValidator])
    });
  }

  /**
   * 🏆 Lifecycle Sync: Automatically load and lock the security token 
   * the exact millisecond this page opens up on the screen!
   */
  async ngOnInit(): Promise<void> {
    try {
      await this.authService.ensureAuthenticatedSession();
    } catch (err) {
      console.error('Initial session hydration failed:', err);
    }
  }

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

  async handleCreatePost(): Promise<void> {
    if (this.cmsForm.invalid) {
      this.cmsForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    // Double check token availability cleanly
    const isAuthenticated = await this.authService.ensureAuthenticatedSession();

    if (!isAuthenticated) {
      this.isSaving.set(false);
      alert('Security violation: Your session token could not be verified. Please log out and back in.');
      return;
    }

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
