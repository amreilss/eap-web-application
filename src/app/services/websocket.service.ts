import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { PlantService } from './plant.service';

export interface MachineStatus {
  equipID: string;
  oeeMode: string;
  oeeDescription: string;
  remarks?: string;
  recipe?: string;
  startTime?: string;
  equipFlr?: string;

  equipCell?: string;
  subMode?: string;
  cDevID?: string;
  customer?: string;
  package?: string;
  empID?: string;
}

interface RawMachineStatus {
  EquipID: string;
  EquipCell?: string;
  EquipFlr?: string;
  OEEMode: string;
  SubMode?: string;
  OEEDescription?: string;
  Remarks?: string;
  CDevID?: string;
  Package?: string;
  EmpID?: string;
  Customer?: string;
  Recipe?: string;
  StartTime?: string;
}

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private http = inject(HttpClient);
  private plantSvc = inject(PlantService);

  private readonly OVERRIDE_KEY = 'machine-status-overrides';

  private _allStatuses = signal<MachineStatus[]>([]);
  private _statuses = signal<MachineStatus[]>([]);
  statuses = this._statuses.asReadonly();

  private _selectedMachine = signal<MachineStatus | null>(null);
  selectedMachine = this._selectedMachine.asReadonly();

  private statuses$ = toObservable(this._statuses);
  selectedMachine$ = toObservable(this._selectedMachine);

  constructor() {
    this.loadSelectedFromStorage();
    this.loadMockData();

    effect(() => {
      const plant = String(this.plantSvc.plant());
      console.log('[Mock Manual] Plant changed:', plant);
      this.refreshStatusesByPlant();
    });
  }

  private loadMockData() {
    this.http.get<RawMachineStatus[]>('assets/mock/saw-status.json').subscribe({
      next: (raw) => {
        const mapped: MachineStatus[] = raw.map((item) => ({
          equipID: item.EquipID,
          oeeMode: item.OEEMode || 'NA',
          oeeDescription: item.OEEDescription || '—',
          remarks: item.Remarks || '',
          recipe: item.Recipe || '',
          startTime: item.StartTime || '',
          equipFlr: item.EquipFlr || '',
          equipCell: item.EquipCell || '',
          subMode: item.SubMode || '',
          cDevID: item.CDevID || '',
          customer: item.Customer || '',
          package: item.Package || '',
          empID: item.EmpID || ''
        }));

        const merged = this.applyOverrides(mapped);

        this._allStatuses.set(merged);
        this.refreshStatusesByPlant();
        console.log('[Mock Manual] Loaded mock machines:', merged.length);
      },
      error: (err) => {
        console.error('[Mock Manual] Failed to load mock data:', err);
      }
    });
  }

  private refreshStatusesByPlant() {
    const currentPlant = String(this.plantSvc.getPlant());
    const all = this._allStatuses();

    if (!all.length) {
      this._statuses.set([]);
      return;
    }

    const filtered = all.filter(
      (m) => String(m.equipFlr ?? '') === currentPlant
    );

    this._statuses.set(filtered.length ? filtered : all);

    const sel = this._selectedMachine();
    if (sel) {
      const latest = all.find((m) => m.equipID === sel.equipID) ?? null;
      this._selectedMachine.set(latest);
      if (latest) {
        localStorage.setItem('selectedMachine', JSON.stringify(latest));
      } else {
        localStorage.removeItem('selectedMachine');
      }
    }
  }

  updateMachineStatus(equipID: string, mode: string) {
    const nextMode = mode.toUpperCase();

    this.updateMachine(equipID, {
      oeeMode: nextMode,
      oeeDescription: this.getDescription(nextMode),
      remarks: this.getRemarks(nextMode),
      startTime: new Date().toISOString()
    });
  }

  updateMachine(equipID: string, patch: Partial<MachineStatus>) {
    const next = this._allStatuses().map(machine =>
      machine.equipID === equipID
        ? { ...machine, ...patch }
        : machine
    );

    this._allStatuses.set(next);
    this.persistOverride(equipID, patch);
    this.refreshStatusesByPlant();
  }

  updateMachineFields(equipID: string, patch: Partial<MachineStatus>) {
    this.updateMachine(equipID, {
      ...patch,
      startTime: new Date().toISOString()
    });
  }

  private getDescription(mode: string): string {
    switch ((mode || '').toUpperCase()) {
      case 'PD': return 'Production';
      case 'SB': return 'Stand-By For Production';
      case 'PB': return 'Production Buy-Off';
      case 'MS': return 'Material Shortage';
      case 'CM': return 'MANU Maintenance';
      case 'WT': return 'Waiting For Tech';
      case 'WR': return 'Waiting For Repair';
      case 'WC': return 'Waiting For Conversion';
      case 'RP': return 'Repair';
      case 'CV': return 'Conversion';
      case 'TS': return 'Tech Setup';
      case 'WB': return 'Waiting Conversion Buy-Off';
      case 'CB': return 'Conversion Buy-Off';
      case 'DN': return 'Down';
      case 'EG': return 'Engineering';
      case 'WS': return 'Waiting Setup';
      case 'SU': return 'Setup';
      case 'OT': return 'Other';
      case 'UD': return 'Unscheduled Down';
      default: return '—';
    }
  }

  private getRemarks(mode: string): string {
    switch ((mode || '').toUpperCase()) {
      case 'PD': return 'Machine is running normally.';
      case 'SB': return 'Waiting for operator action.';
      case 'DN': return 'Machine down.';
      case 'WS': return 'Waiting for setup.';
      case 'CV': return 'Conversion in progress.';
      case 'CB': return 'Conversion Buy-Off.';
      case 'WB': return 'Waiting Conversion Buy-Off.';
      case 'CM': return 'MANU Maintenance.';
      case 'RP': return 'Repair in progress.';
      case 'MS': return 'Material shortage / maintenance related.';
      case 'PB': return 'Production Buy-Off.';
      case 'WT': return 'Waiting for technician.';
      case 'WR': return 'Waiting for repair.';
      case 'WC': return 'Waiting for conversion.';
      case 'TS': return 'Tech setup in progress.';
      default: return '';
    }
  }

  setStatuses(list: MachineStatus[]) {
    const merged = this.applyOverrides(list);
    this._allStatuses.set(merged);
    this.refreshStatusesByPlant();
  }

  upsertStatus(item: MachineStatus) {
    const curr = this._allStatuses();
    const idx = curr.findIndex((m) => m.equipID === item.equipID);

    if (idx >= 0) {
      const next = curr.slice();
      next[idx] = { ...curr[idx], ...item };
      this._allStatuses.set(next);
    } else {
      this._allStatuses.set([...curr, item]);
    }

    this.persistOverride(item.equipID, item);
    this.refreshStatusesByPlant();
  }

  setSelectedMachine(machine: MachineStatus) {
    this._selectedMachine.set(machine);
    localStorage.setItem('selectedMachine', JSON.stringify(machine));
  }

  clearSelectedMachine() {
    this._selectedMachine.set(null);
    localStorage.removeItem('selectedMachine');
  }

  loadSelectedFromStorage() {
    const saved = localStorage.getItem('selectedMachine');
    if (saved) {
      try {
        const parsed: MachineStatus = JSON.parse(saved);
        this._selectedMachine.set(parsed);
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  }

  getMachineById(id: string): MachineStatus | null {
    return this._allStatuses().find((m) => m.equipID === id) ?? null;
  }

  statusStreamFor(id: string): Observable<MachineStatus | null> {
    return this.statuses$.pipe(
      map((list) => list.find((m) => m.equipID === id) ?? null),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );
  }

  closeConnection() {
    // mock mode
  }

  reconnect() {
    this.refreshStatusesByPlant();
  }

  clearAllOverrides() {
    localStorage.removeItem(this.OVERRIDE_KEY);
    this.loadMockData();
  }

  private applyOverrides(list: MachineStatus[]): MachineStatus[] {
    const overrides = this.loadOverrides();
    if (!Object.keys(overrides).length) return list;

    return list.map(machine => {
      const patch = overrides[machine.equipID];
      return patch ? { ...machine, ...patch } : machine;
    });
  }

  private loadOverrides(): Record<string, Partial<MachineStatus>> {
    try {
      return JSON.parse(localStorage.getItem(this.OVERRIDE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  private persistOverride(equipID: string, patch: Partial<MachineStatus>) {
    try {
      const curr = this.loadOverrides();
      curr[equipID] = {
        ...(curr[equipID] || {}),
        ...patch
      };
      localStorage.setItem(this.OVERRIDE_KEY, JSON.stringify(curr));
    } catch {}
  }
}