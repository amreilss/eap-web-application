import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/auth.service';
import { LoginWarningPopupComponent } from '../../../../layout/login-warning-popup/login-warning-popup.component';

@Component({
  selector: 'app-action-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, LoginWarningPopupComponent],
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.less'],
})
export class ActionBarComponent {
  @Input() machineId = '';

  /** Emit events ไปยัง parent (Machine Detail) */
  @Output() requestLogin = new EventEmitter<void>();
  @Output() openDownload   = new EventEmitter<void>();
  @Output() openUpload     = new EventEmitter<void>();
  @Output() openSpecial    = new EventEmitter<void>();
  @Output() openSQC        = new EventEmitter<void>();
  @Output() openRecipeList = new EventEmitter<void>();

  /** State */
  showWarning = false;

  constructor(private auth: AuthService) {}

  /** เรียก popup login ผ่าน AuthService */
  openLoginPopup() {
    this.showWarning = false;
    this.auth.triggerLoginPopup();
    this.requestLogin.emit();   
  }

  /** ฟังก์ชันกลาง: ตรวจสอบการล็อกอินก่อนกดปุ่ม */
  private checkAuth(action: () => void) {
    this.auth.isLoggedIn$.pipe(take(1)).subscribe(isLogged => {
      if (!isLogged) {
        this.showWarning = true; // แสดง popup แจ้งเตือน
        return;
      }
      action();
    });
  }

  /** ปุ่ม Download */
  onClickDownload() {
    this.checkAuth(() => this.openDownload.emit());
  }

  /** ปุ่ม Upload */
  onClickUpload() {
    this.checkAuth(() => this.openUpload.emit());
  }

  /** ปุ่ม Special Download */
  onClickSpecial() {
    this.checkAuth(() => this.openSpecial.emit());
  }

  /** ปุ่ม SQC */
  onClickSQC() {
    this.checkAuth(() => this.openSQC.emit());
  }

  /** ปุ่ม Recipe List */
  onClickRecipeList() {
    this.checkAuth(() => this.openRecipeList.emit());
  }
}
