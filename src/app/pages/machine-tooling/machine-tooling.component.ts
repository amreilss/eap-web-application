import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { BladeInfoComponent } from './blade-info/blade-info.component';
import { ManageTypeComponent } from './manage-type/manage-type.component';
import { AddNewBladeComponent } from './add-new-blade/add-new-blade.component';
import { ReturnRejectResetComponent } from './return-reject-reset/return-reject-reset.component';
import { LoginWarningPopupComponent } from '../../layout/login-warning-popup/login-warning-popup.component';

import { AuthService } from '../../core/auth/auth.service';
import { WebsocketService, MachineStatus } from '../../services/websocket.service';

type ToolKey =
  | 'blade-info'
  | 'manage-type'
  | 'add-new-blade'
  | 'return-reject-reset';

type ToolTile = {
  key: ToolKey;
  title: string;
  subtitle?: string;
  icon?: string;
  disabled?: boolean;
};

type StatusVariant = 'running' | 'idle' | 'alarm' | 'down' | 'unknown';

type MachineSnap = {
  equipID: string;
  oeeMode?: string;
  oeeDescription?: string;
  name?: string;
} | null;

type ToolingEventLog = {
  dateTime: string;
  enNo: string;
  plant: string;
  machine: string;
  activity: string;
};

@Component({
  selector: 'app-machine-tooling',
  standalone: true,
  imports: [
    CommonModule,
    BladeInfoComponent,
    ManageTypeComponent,
    AddNewBladeComponent,
    ReturnRejectResetComponent,
    LoginWarningPopupComponent,
  ],
  templateUrl: './machine-tooling.component.html',
  styleUrls: ['./machine-tooling.component.less'],
})
export class MachineToolingComponent implements OnInit, OnDestroy {
  machineId = '';
  machineName = '';

  machineStatusText = 'Unknown';
  statusVariant: StatusVariant = 'unknown';

  activeModal: ToolKey | null = null;
  showLoginWarning = false;

  eventLogs: ToolingEventLog[] = [];

  readonly tiles: ToolTile[] = [
    { key: 'blade-info', title: 'Blade', subtitle: 'Information', icon: '📄' },
    { key: 'manage-type', title: 'Manage', subtitle: 'Blade type', icon: '🧰' },
    { key: 'add-new-blade', title: 'Add', subtitle: 'new blade', icon: '➕' },
    { key: 'return-reject-reset', title: 'Return', subtitle: 'Recipe Reset', icon: '↩️' },
  ];

  private statusSub?: Subscription;

  get statusClass(): string {
    return `status-${this.statusVariant}`;
  }

  get eventLogCount(): number {
    return this.eventLogs.length;
  }

  get latestActivity(): string {
    if (!this.eventLogs.length) return 'No recent activity';
    return this.eventLogs[0].activity;
  }

  private get logStorageKey(): string {
    const machineKey = (this.machineId || this.machineName || 'unknown-machine')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
    return `machine-tooling-event-log:${machineKey}`;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private ws: WebsocketService
  ) {}

  ngOnInit(): void {
    this.machineId = this.route.snapshot.paramMap.get('id') ?? '';
    const qp = this.route.snapshot.queryParamMap;

    const state: any = (window.history && window.history.state) || {};
    const stMachine = state.machine as any | undefined;
    const stStatus = state.machineStatus as { text?: string; variant?: StatusVariant } | undefined;

    const snap = this.loadSnapshot(this.machineId);
    const fromService = this.machineId ? this.ws.getMachineById(this.machineId) : null;
    const fromSelected = this.ws.selectedMachine();

    const initialMachine =
      fromService ||
      (fromSelected?.equipID === this.machineId ? fromSelected : null);

    this.machineName =
      state.machineName ||
      stMachine?.name ||
      initialMachine?.equipID ||
      stMachine?.equipID ||
      snap?.name ||
      snap?.equipID ||
      qp.get('name') ||
      this.machineId ||
      '';

    const codeFromAny = this.firstNonEmpty(
      initialMachine?.oeeMode,
      stMachine?.oeeMode,
      snap?.oeeMode,
      qp.get('mode')
    );

    const descFromAny = this.firstNonEmpty(
      initialMachine?.oeeDescription,
      stStatus?.text,
      snap?.oeeDescription,
      qp.get('statusText')
    );

    this.applyMachineStatus(codeFromAny, descFromAny);

    if (initialMachine) {
      this.machineName = initialMachine.equipID || this.machineName;
    }

    if (this.machineId) {
      this.statusSub = this.ws.statusStreamFor(this.machineId).subscribe((latest: MachineStatus | null) => {
        if (!latest) return;

        this.machineName = latest.equipID || this.machineName;
        this.applyMachineStatus(latest.oeeMode, latest.oeeDescription);
      });
    }

    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.statusSub?.unsubscribe();
    this.unlockScroll();
  }

  private applyMachineStatus(code?: string, description?: string): void {
    const displayText = this.firstNonEmpty(description, code, 'Unknown');
    this.machineStatusText = displayText;
    this.statusVariant = this.variantFromCode(code) || this.variantFromText(displayText) || 'unknown';
  }

  private checkAuth(action: () => void): void {
    this.auth.isLoggedIn$.pipe(take(1)).subscribe((isLogged: boolean) => {
      if (!isLogged) {
        this.showLoginWarning = true;
        return;
      }
      action();
    });
  }

  private firstNonEmpty(...vals: Array<string | null | undefined>): string {
    for (const v of vals) {
      if (typeof v === 'string' && v.trim().length > 0) {
        return v.trim();
      }
    }
    return '';
  }

  private variantFromCode(code?: string): StatusVariant {
    const c = (code || '').toUpperCase();

    switch (c) {
      case 'PD':
      case 'EG':
      case 'CB':
        return 'running';

      case 'SB':
      case 'PB':
      case 'WS':
      case 'CV':
      case 'WC':
        return 'idle';

      case 'RP':
      case 'OT':
      case 'CM':
      case 'WR':
      case 'TS':
      case 'WT':
        return 'alarm';

      case 'DN':
        return 'down';

      default:
        return 'unknown';
    }
  }

  private variantFromText(text?: string): StatusVariant {
    const t = (text || '').toLowerCase();

    if (/(run|running|prod|processing|online|auto)/.test(t)) return 'running';
    if (/(idle|ready|standby|wait|hold|conversion)/.test(t)) return 'idle';
    if (/(alarm|alm|error|warn|abnormal|repair|tech|maintenance)/.test(t)) return 'alarm';
    if (/(down|stop|offline)/.test(t)) return 'down';

    return 'unknown';
  }

  private snapKey(id: string): string {
    return `machine-snapshot:${id}`;
  }

  private loadSnapshot(id: string): MachineSnap {
    try {
      return JSON.parse(localStorage.getItem(this.snapKey(id)) || 'null');
    } catch {
      return null;
    }
  }

  private loadLogs(): void {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.logStorageKey) || '[]');
      this.eventLogs = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.eventLogs = [];
    }
  }

  private saveLogs(): void {
    localStorage.setItem(this.logStorageKey, JSON.stringify(this.eventLogs.slice(0, 50)));
  }

  private readStorageValue(keys: string[]): string {
    for (const key of keys) {
      try {
        const fromSession = sessionStorage.getItem(key);
        if (fromSession && fromSession.trim()) return fromSession.trim();
      } catch {}

      try {
        const fromLocal = localStorage.getItem(key);
        if (fromLocal && fromLocal.trim()) return fromLocal.trim();
      } catch {}
    }
    return '';
  }

  private resolveEnNo(): string {
    const state: any = (window.history && window.history.state) || {};
    const qp = this.route.snapshot.queryParamMap;

    return this.firstNonEmpty(
      state?.enNo,
      state?.empId,
      state?.employeeNo,
      state?.employeeId,
      qp.get('enNo'),
      qp.get('empId'),
      this.readStorageValue([
        'enNo',
        'empId',
        'employeeNo',
        'employeeId',
        'en',
        'emp_no',
      ]),
      '—'
    );
  }

  private resolvePlant(): string {
    const state: any = (window.history && window.history.state) || {};
    const qp = this.route.snapshot.queryParamMap;

    return this.firstNonEmpty(
      state?.plant,
      state?.plantCode,
      qp.get('plant'),
      qp.get('plantCode'),
      this.readStorageValue([
        'plant',
        'plantCode',
        'plantId',
        'site',
      ]),
      '—'
    );
  }

  private addLog(activity: string): void {
    const log: ToolingEventLog = {
      dateTime: new Date().toLocaleString(),
      enNo: this.resolveEnNo(),
      plant: this.resolvePlant(),
      machine: this.machineId || this.machineName || '—',
      activity,
    };

    this.eventLogs = [log, ...this.eventLogs].slice(0, 50);
    this.saveLogs();
  }

  onTileClick(tile: ToolTile, ev?: MouseEvent): void {
    if (tile.disabled) return;

    const el = ev?.currentTarget as HTMLElement | null;
    if (el) {
      el.style.transform = 'translateY(-2px) scale(.985)';
      setTimeout(() => {
        el.style.transform = '';
      }, 120);
    }

    this.checkAuth(() => {
      this.openModal(tile.key);
    });
  }

  openModal(key: ToolKey): void {
    this.activeModal = key;
    this.lockScroll();

    setTimeout(() => {
      document.querySelector<HTMLElement>('.modal')?.focus();
    }, 0);
  }

  closeModal(): void {
    this.activeModal = null;
    this.unlockScroll();
  }

  onBladeInfoSearched(payload?: { bladeId?: string }): void {
    const bladeId = payload?.bladeId?.trim() || '—';
    this.addLog(`Search Blade Info success (${bladeId})`);
    this.closeModal();
  }

  onManageTypeSaved(payload?: { bladeType?: string; action?: string }): void {
    const action = payload?.action?.trim() || 'Manage Blade Type';
    const bladeType = payload?.bladeType?.trim() || '—';
    this.addLog(`${action} success (${bladeType})`);
    this.closeModal();
  }

  onAddNewBladeSuccess(payload?: { toolingId?: string; bladeId?: string }): void {
    const ref = payload?.toolingId?.trim() || payload?.bladeId?.trim() || '—';
    this.addLog(`Add New Blade success (${ref})`);
    this.closeModal();
  }

  onReturnRejectResetSuccess(payload?: { action?: 'Return' | 'Reject' | 'Reset'; reference?: string }): void {
    const action = payload?.action?.trim() || 'Return';
    const ref = payload?.reference?.trim() || '—';
    this.addLog(`${action} success (${ref})`);
    this.closeModal();
  }

  clearEventLogs(): void {
    this.eventLogs = [];
    localStorage.removeItem(this.logStorageKey);
  }

  goToLogin(): void {
    this.showLoginWarning = false;
    this.auth.triggerLoginPopup();
  }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement)?.classList.contains('overlay')) {
      this.closeModal();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onEsc(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.activeModal) {
      this.closeModal();
    }
  }

  goBackToMachine(): void {
    this.router.navigate(['/machine', this.machineId]);
  }

  private lockScroll(): void {
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
  }

  private unlockScroll(): void {
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');
  }
}