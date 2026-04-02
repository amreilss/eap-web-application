import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

type SetupKey =
  | 'recipeName'
  | 'z1BladeType' | 'z1BladeTypeFullName' | 'z1BladeId' | 'z1ProductionStock'
  | 'z2BladeType' | 'z2BladeTypeFullName' | 'z2BladeId' | 'z2ProductionStock'
  | 'coatingSolutionExpireDate'
  | 'z1ExposureRemains' | 'z1DistanceRemains'
  | 'z2ExposureRemains' | 'z2DistanceRemains';

export interface SetupData {
  recipeName?: string;
  z1BladeType?: string;
  z1BladeTypeFullName?: string;
  z1BladeId?: string;
  z1ProductionStock?: string;
  z2BladeType?: string;
  z2BladeTypeFullName?: string;
  z2BladeId?: string;
  z2ProductionStock?: string;
  coatingSolutionExpireDate?: string;
  z1ExposureRemains?: number | string;
  z1DistanceRemains?: number | string;
  z2ExposureRemains?: number | string;
  z2DistanceRemains?: number | string;
}

@Component({
  selector: 'app-setup-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setup-panel.component.html',
  styleUrls: ['./setup-panel.component.less'],
})
export class SetupPanelComponent implements OnInit {
  setupData: SetupData = {};

  ngOnInit(): void {
    // ✅ Mock data ให้เหมือนในภาพ
    this.setupData = {
      recipeName: 'STM0487P_F_1',

      z1BladeType: 'S1440',
      z1BladeTypeFullName: 'S1440',
      z1BladeId: '72632906 KF047 EXP1058 2506',
      z1ProductionStock: 'SW00000131',

      z2BladeType: 'S1030',
      z2BladeTypeFullName: 'S1030',
      z2BladeId: '73021120 KF029 EXP0790 2507',
      z2ProductionStock: 'SW00000134',

      coatingSolutionExpireDate: '',

      z1ExposureRemains: 0.04090,
      z1DistanceRemains: 2238.65574,
      z2ExposureRemains: 0.02786,
      z2DistanceRemains: 11747.59016,
    };
  }

  patchSetup(data: Partial<SetupData>) {
    this.setupData = { ...this.setupData, ...data };
  }

  resetSetup() {
    this.setupData = {};
  }
}
