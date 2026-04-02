import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PmCalRow {
  bonder: string;
  schType: string;
  date: string;
  dueDate: string;
}

interface PmCalData {
  pm: PmCalRow[];
  cal: PmCalRow[];
}

@Component({
  selector: 'app-pmcal-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pmcal-panel.component.html',
  styleUrls: ['./pmcal-panel.component.less']
})
export class PmcalPanelComponent {
  pmcalData: PmCalData = {
    pm: [
      { bonder: 'TSWD209', schType: 'ND', date: 'ND', dueDate: 'ND' }
    ],
    cal: [
      { bonder: 'TSWD209', schType: 'ND', date: 'ND', dueDate: 'ND' }
    ]
  };

  resetData() {
    this.pmcalData = {
      pm: [{ bonder: 'TSWD209', schType: 'ND', date: 'ND', dueDate: 'ND' }],
      cal: [{ bonder: 'TSWD209', schType: 'ND', date: 'ND', dueDate: 'ND' }]
    };
  }
}
