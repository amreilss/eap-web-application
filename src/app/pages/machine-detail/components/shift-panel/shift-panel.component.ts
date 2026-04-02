import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ShiftData {
  bondedDevTtl?: number | string;
  bondedDevPd?: number | string;
  rejects?: number | string;
  uphPd?: number | string;
  mtba?: number | string;
  mtta?: number | string;
  efficiency?: number | string;
}

@Component({
  selector: 'app-shift-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shift-panel.component.html',
  styleUrls: ['./shift-panel.component.less'],
})
export class ShiftPanelComponent {
  //  Mock data
  shiftData: ShiftData = {
    bondedDevTtl: 0,
    bondedDevPd: 0,
    rejects: 0,
    uphPd: 0,
    mtba: '',
    mtta: '',
    efficiency: '',
  };

  patchShift(data: Partial<ShiftData>) {
    this.shiftData = { ...this.shiftData, ...data };
  }

  resetShift() {
    this.shiftData = {
      bondedDevTtl: 0,
      bondedDevPd: 0,
      rejects: 0,
      uphPd: 0,
      mtba: '',
      mtta: '',
      efficiency: '',
    };
  }
}
