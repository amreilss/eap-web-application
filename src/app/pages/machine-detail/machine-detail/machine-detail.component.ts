import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { ActionBarComponent } from '../components/actions/action-bar.component';
import { WebsocketService, MachineStatus } from '../../../services/websocket.service';
import { DetailPanelComponent } from '../components/detail-panel/detail-panel.component';
import { UploadRecipeComponent } from '../upload-recipe/upload-recipe.component';
import { DownloadRecipeComponent } from '../download-recipe/download-recipe.component';
import { SpecialDownloadComponent } from '../special-download/special-download.component';
import { AssySqcComponent } from '../assy-sqc/assy-sqc.component';
import { RecipeListComponent } from '../recipe-list/recipe-list.component';
import { OpActionsPanelComponent, ActionBtn } from '../op-actions-panel/op-actions-panel.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-machine-detail',
  standalone: true,
  imports: [
    CommonModule,
    DetailPanelComponent,
    ActionBarComponent,
    UploadRecipeComponent,
    DownloadRecipeComponent,
    SpecialDownloadComponent,
    AssySqcComponent,
    RecipeListComponent,
    OpActionsPanelComponent
  ],
  templateUrl: './machine-detail.component.html',
  styleUrls: ['./machine-detail.component.less']
})
export class MachineDetailComponent implements OnInit, OnDestroy {
  machine: MachineStatus | null = null;
  isLoading = false;

  mode: 'production' | 'maintenance' = 'production';
  activeTab: 'setup' | 'lot' | 'shift' | 'pmcal' = 'setup';

  showDownload = false;
  showUpload = false;
  showTooling = false;
  showSpecial = false;
  showSQC = false;
  showRecipeList = false;

  prodBtns: ActionBtn[] = [
    { key: 'PD', label: 'Production (PD)' },
    { key: 'SB', label: 'Stand-By For Production (SB)' },
    { key: 'PB', label: 'Production Buy-Off (PB)' },
    { key: 'MS', label: 'Material Shortage (MS)' },
    { key: 'CM', label: 'Setup / MANU Maintenance (CM)' },
    { key: 'WT', label: 'Waiting For Tech (WT)' },
    { key: 'WR', label: 'Waiting For Repair (WR)' },
    { key: 'WC', label: 'Waiting For Conversion (WC)' },
  ];

  maintBtns: ActionBtn[] = [
    { key: 'RP', label: 'Repair (Technician) (RP)' },
    { key: 'CV', label: 'Conversion (CV)' },
    { key: 'TS', label: 'Tech Setup (Change Blade) (TS)' },
    { key: 'WB', label: 'Waiting Conversion Buy-Off (WB)' },
    { key: 'CB', label: 'Conversion Buy-Off (CB)' },
  ];

  private _wsSub?: Subscription;

  constructor(
    private ws: WebsocketService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id') || '';

    const preFromNav = this.router.getCurrentNavigation()?.extras?.state?.['machine'] as Partial<MachineStatus> | undefined;
    const preFromHist = (history.state && (history.state as any)['machine']) as Partial<MachineStatus> | undefined;
    const pre = preFromNav || preFromHist;

    if (pre?.equipID) {
      this.machine = {
        equipID: pre.equipID,
        oeeMode: pre.oeeMode ?? '',
        oeeDescription: pre.oeeDescription ?? '',
        remarks: pre.remarks ?? '',
        recipe: pre.recipe ?? '',
        startTime: pre.startTime ?? '',
        equipFlr: pre.equipFlr ?? '',
        equipCell: pre.equipCell ?? '',
        subMode: pre.subMode ?? '',
        cDevID: pre.cDevID ?? '',
        customer: pre.customer ?? '',
        package: pre.package ?? '',
        empID: pre.empID ?? ''
      };
      this.ws.setSelectedMachine(this.machine);
    }

    const resolved: MachineStatus | null = this.route.snapshot.data['machine'] ?? null;
    if (resolved?.equipID) {
      this.machine = resolved;
      this.ws.setSelectedMachine(resolved);
    }

    if (!this.machine) {
      const fromSvc = this.ws.selectedMachine() || this.ws.loadSelectedFromStorage() || null;

      if (fromSvc?.equipID === routeId) {
        this.machine = fromSvc;
      } else if (routeId) {
        const found = this.ws.getMachineById(routeId);
        if (found) {
          this.machine = found;
          this.ws.setSelectedMachine(found);
        } else {
          this.machine = {
            equipID: routeId,
            oeeMode: '',
            oeeDescription: ''
          } as MachineStatus;
        }
      }
    }

    const qp = this.route.snapshot.queryParamMap;
    const tabFromQuery = qp.get('tab');
    const modeFromQuery = qp.get('mode');

    this.activeTab = (tabFromQuery as any) || 'setup';
    this.mode = (modeFromQuery as any) || 'production';

    if (tabFromQuery || modeFromQuery) {
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }

    if (routeId) {
      this._wsSub = this.ws.statusStreamFor(routeId).subscribe((latest) => {
        if (!latest) return;
        this.machine = { ...latest };
        this.ws.setSelectedMachine(this.machine);
      });
    }
  }

  ngOnDestroy(): void {
    this._wsSub?.unsubscribe();
  }

  handleAction(code: string): void {
    if (!this.machine) return;

    const nextMode = (code || '').toUpperCase();

    // อัปเดต source หลักใน service ตรงๆ
    this.ws.updateMachineStatus(this.machine.equipID, nextMode);

    // ดึงค่าล่าสุดกลับมาใส่หน้า detail ทันที
    const latest = this.ws.getMachineById(this.machine.equipID);
    if (latest) {
      this.machine = { ...latest };
      this.ws.setSelectedMachine(this.machine);
    }
  }

  goToTooling(m: MachineStatus = this.machine as MachineStatus): void {
    if (!m) return;

    this.router.navigate(['/tooling', m.equipID], {
      state: {
        machine: {
          equipID: m.equipID,
          name: m.equipID,
          oeeMode: m.oeeMode,
          oeeDescription: m.oeeDescription,
        },
        machineStatus: {
          text: m.oeeDescription || m.oeeMode || 'Unknown',
          variant: this.variantFromCode(m.oeeMode),
        },
      },
    });
  }

  private variantFromCode(mode?: string): 'running' | 'idle' | 'alarm' | 'down' | 'unknown' {
    switch ((mode || '').toUpperCase()) {
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

  setMode(m: 'production' | 'maintenance') {
    this.mode = m;
  }

  setActiveTab(t: 'setup' | 'lot' | 'shift' | 'pmcal') {
    this.activeTab = t;
  }

  badgeClass(mode?: string): string {
    switch ((mode || '').toUpperCase()) {
      case 'EG': return 'badge badge--turquoise';
      case 'MS': return 'badge badge--maroon';
      case 'SU': return 'badge badge--orange';
      case 'PD': return 'badge badge--green';
      case 'SB': return 'badge badge--yellow';

      case 'OT':
      case 'UD':
      case 'RP':
      case 'DN':
      case 'CM':
      case 'WR':
        return 'badge badge--red';

      case 'WS':
      case 'CV':
      case 'WC':
        return 'badge badge--orange';

      case 'PB':
        return 'badge badge--yellow';

      case 'WB':
        return 'badge badge--pink';

      case 'WT':
        return 'badge badge--turquoise';

      case 'TS':
        return 'badge badge--blue';

      case 'CB':
        return 'badge badge--green';

      default:
        return 'badge badge--grey';
    }
  }

  statusClass(mode?: string): string {
    switch ((mode || '').toUpperCase()) {
      case 'PD':
      case 'CB':
        return 'dot is-pd';

      case 'SB':
      case 'PB':
        return 'dot is-sb';

      case 'RP':
      case 'WR':
      case 'CM':
      case 'DN':
        return 'dot is-dn';

      case 'CV':
      case 'WC':
      case 'TS':
        return 'dot is-rp';

      case 'WT':
        return 'dot is-wt';

      default:
        return 'dot is-uk';
    }
  }

  openUploadPopup() {
    this.showUpload = true;
  }

  onRecipeUploaded(_: any) {
    this.showUpload = false;
  }

  onRecipeDownloaded(_: any) {
    this.showDownload = false;
  }

  triggerLoginPopup() {
    this.auth.triggerLoginPopup();
  }
}