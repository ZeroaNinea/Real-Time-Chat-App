import { Component, inject } from '@angular/core';
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
  logoutInProgress = false;

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('accessToken');
        this.logoutInProgress = true;
        setTimeout(() => this.router.navigate(['/']), 1000);
      },
      error: (err) => {
        console.error(err);
        alert('Something went wrong during logout.');
      },
    });
  }
}
