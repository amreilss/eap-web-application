import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SetupPanelComponent } from '../setup-panel/setup-panel.component';
import { LotPanelComponent } from '../lot-panel/lot-panel.component';
import { ShiftPanelComponent } from '../shift-panel/shift-panel.component';
import { PmcalPanelComponent } from '../pmcal-panel/pmcal-panel.component';

@Component({
  selector: 'app-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    SetupPanelComponent,
    LotPanelComponent,
    ShiftPanelComponent,
    PmcalPanelComponent
  ],
  templateUrl: './detail-panel.component.html',
  styleUrls: ['./detail-panel.component.less']
})
export class DetailPanelComponent implements OnInit {
  @Input() selectedEquipID: string = '';

  tabs = [
    { id: 'setup', label: 'Setup', icon: 'settings' },
    { id: 'lot',   label: 'Lot',   icon: 'list' },
    { id: 'shift', label: 'Shift', icon: 'clock' },
    { id: 'pmcal', label: 'PM/Cal', icon: 'tool' },
  ];

  activeTab: string = 'setup';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const idFromUrl = this.route.snapshot.paramMap.get('id');
    if (!this.selectedEquipID && idFromUrl) {
      this.selectedEquipID = idFromUrl;
    }

    this.route.paramMap.subscribe(p => {
      const id = p.get('id');
      if (id) this.selectedEquipID = id;
    });
  }
}
