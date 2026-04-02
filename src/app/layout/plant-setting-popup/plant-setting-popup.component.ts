import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantService, Plant } from '../../services/plant.service';

@Component({
  selector: 'app-plant-setting-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plant-setting-popup.component.html',
  styleUrls: ['./plant-setting-popup.component.less']
})
export class PlantSettingPopupComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  selected!: Plant;

  constructor(private plantSvc: PlantService) {}

  ngOnInit(): void {
    this.selected = this.plantSvc.getPlant();
  }

  select(p: Plant) {
    this.selected = p;
  }

  castToPlant(p: string): Plant {
    return p as Plant;
  }

  save() {
    this.plantSvc.setPlant(this.selected);
    this.close.emit();
  }

  cancel() {
    this.close.emit();
  }
}
