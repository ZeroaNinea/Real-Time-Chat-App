import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  imports: [],
  standalone: true,
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss',
})
export class LogoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('accessToken');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error(err);
        alert('Something went wrong during logout.');
      },
    });
  }
}
