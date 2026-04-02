import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LotData {
  utacLotId?: string;
  stage?: string;
  partId?: string;
  deviceId?: string;
  customer?: string;
  lotSize?: string | number;
  package?: string;
  packageSize?: string;
  packagePinCount?: string | number;
  waferQty?: string | number;
  expectedUph?: string | number;
  sawProgramName?: string;
  actualWaferSize?: string | number;
}

@Component({
  selector: 'app-lot-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lot-panel.component.html',
  styleUrls: ['./lot-panel.component.less'],
})
export class LotPanelComponent implements OnInit, OnChanges {
  @Input() equipID = '';
  @Input() lotId = '';

  lotData: LotData = {};
  isLoading = false;
  errorMsg = '';
  lastUpdatedAt: Date | null = null;

  ngOnInit(): void {
    this.loadMockLot();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equipID'] || changes['lotId']) {
      this.loadMockLot();
    }
  }

  loadMockLot(): void {
    this.isLoading = true;
    this.errorMsg = '';

    setTimeout(() => {
      this.lotData = {
        utacLotId: 'STDPS5133.1',
        stage: 'A000-SAW',
        partId: 'UMCR*UBFPAC5',
        deviceId: 'UMCR*UBFPAC5',
        customer: 'STM',
        lotSize: 6391,
        package: 'QFN',
        packageSize: '3X3',
        packagePinCount: 0,
        waferQty: 1,
        expectedUph: '-',
        sawProgramName: 'STM0491P_E',
        actualWaferSize: '-',
      };

      this.lastUpdatedAt = new Date();
      this.isLoading = false;
    }, 200);
  }
}