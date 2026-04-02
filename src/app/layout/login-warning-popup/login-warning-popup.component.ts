import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-warning-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-warning-popup.component.html',
  styleUrls: ['./login-warning-popup.component.less']
})
export class LoginWarningPopupComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() goLogin = new EventEmitter<void>(); 

  close() {
    this.closed.emit();
  }

  goToLogin() {
    this.goLogin.emit(); 
    this.close();
  }
}
