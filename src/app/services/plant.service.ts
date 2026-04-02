import { Injectable, signal, computed } from '@angular/core';

export type Plant = '1' | '2' | '3';

@Injectable({ providedIn: 'root' })
export class PlantService {
  private initial: Plant = (localStorage.getItem('plant') as Plant) || '1';
  private _plant = signal<Plant>(this.initial);
  plant = computed(() => this._plant());

  constructor() {
    if (!localStorage.getItem('plant')) {
      localStorage.setItem('plant', this.initial);
    }
  }

  setPlant(p: Plant) {
    this._plant.set(p);
    localStorage.setItem('plant', p);
  }

  getPlant(): Plant {
    return this._plant();
  }

  getPlantLabel(p: Plant | string): string {
    switch (p) {
      case '1': return 'Plant 1';
      case '2': return 'Plant 2';
      case '3': return 'Plant 3';
      default:  return 'Unknown';
    }
  }

  getPlantBadge(p: Plant | string): string {
    switch (p) {
      case '1': return 'P1';
      case '2': return 'P2';
      case '3': return 'P3';
      default:  return 'P?';
    }
  }
}
