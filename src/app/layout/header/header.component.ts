import {
  Component, HostListener, OnDestroy, OnInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PlantService } from '../../services/plant.service';
import { PlantSettingPopupComponent } from '../plant-setting-popup/plant-setting-popup.component';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
type UserVm = { id?: string; name?: string } | null;
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PlantSettingPopupComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  showBackButton = false;
  private sub?: Subscription;
  plantSvc = inject(PlantService);
  showPlantPopup = false;
  showLogin = false;
  showUserMenu = false;
  showChangePassword = false;
  loading = false;
  error = '';
  success = '';
  isLoggedIn$!: Observable<boolean>;
  user$!: Observable<UserVm>;
  form!: FormGroup;
  changeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private location: Location
  ) {

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showBackButton = event.urlAfterRedirects !== '/';
      });
  }
  
  goBack() {
    this.location.back(); 
  }

  goHome() {
    this.router.navigateByUrl('/');
  }
  
  ngOnInit() {
    this.isLoggedIn$ = this.auth.isLoggedIn$;
    this.user$ = this.auth.user$ as Observable<UserVm>;

    this.form = this.fb.group({
      userID: ['', Validators.required],
      userPassword: ['', Validators.required],
    });

    this.changeForm = this.fb.group({
      oldUserPassword: ['', Validators.required],
      newUserPassword: ['', Validators.required],
      confirmUserPassword: ['', Validators.required],
    });

    this.sub = this.auth.loginPopup$.subscribe(() => {
      if (!this.showLogin) {
        this.resetPopups();
        this.showLogin = true;
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  openPlantPopup() {
    this.resetPopups();
    this.showPlantPopup = true;
  }

  closePlantPopup() {
    this.showPlantPopup = false;
  }

  toggleLogin() {
    this.resetPopups();
    this.showLogin = !this.showLogin;
  }

  openChangePassword() {
    this.resetPopups();
    this.showChangePassword = true;
  }

  submitLogin() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.showLogin = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Invalid User ID or Password';
      },
    });
  }

  submitChangePassword() {
    if (this.changeForm.invalid) return;
    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.changePassword(this.changeForm.value).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.success = res?.message || 'Password updated successfully';
        setTimeout(() => {
          this.showChangePassword = false;
          this.changeForm.reset();
        }, 1500);
      },
      error: () => {
        this.loading = false;
        this.error = 'Please recheck your password and try again';
      },
    });
  }

  logout() {
    this.auth.logout();
    this.resetPopups();
    this.showMenu = false;
  }

  closeLogin() {
    this.showLogin = false;
  }

  closeChangePassword() {
    this.showChangePassword = false;
  }

  private resetPopups() {
    this.showUserMenu = false;
    this.showChangePassword = false;
    this.error = '';
    this.success = '';
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const el = ev.target as HTMLElement;
    const safe = el.closest(
      '.menu-dropdown, .btn-icon, .btn-login, .login-dialog, .change-pass-modal, .plant-popup'
    );
    if (!safe) this.showMenu = false;
  }

  showMenu = false;
  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  get userValue() {
    let value: any;
    this.user$.subscribe(u => (value = u)).unsubscribe();
    return value;
  }
}
