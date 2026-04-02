import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  signal,
  HostListener,
  ElementRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WebsocketService, MachineStatus } from '../../services/websocket.service';
import { ScrollToTopComponent } from '../../shared/components/scroll-to-top/scroll-to-top.component';
import { PlantService } from '../../services/plant.service';

type StatusRow = {
  equipID: string;
  oeeMode?: string;
  oeeDescription?: string;
};

type MachineOverride = {
  equipID: string;
  oeeMode?: string;
  oeeDescription?: string;
  updatedAt?: string;
};

@Component({
  selector: 'app-saw-production',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollToTopComponent],
  templateUrl: './saw-production.component.html',
  styleUrls: ['./saw-production.component.less'],
})
export class SawProductionComponent implements OnInit, OnDestroy {
  constructor(
    private el: ElementRef<HTMLElement>,
    private ws: WebsocketService,
    private plantSvc: PlantService
  ) {}

  private readonly OVERRIDE_KEY_PREFIX = 'machine-override:';
  private overrideTick = signal(0);

  rows = computed<StatusRow[]>(() => {
    this.overrideTick();

    return this.ws.statuses().map((m: MachineStatus) => {
      const override = this.getLocalOverride(m.equipID);

      return {
        equipID: m.equipID,
        oeeMode: override?.oeeMode ?? m.oeeMode ?? 'NA',
        oeeDescription: override?.oeeDescription ?? m.oeeDescription ?? '—',
      };
    });
  });

  displayRows = this.rows;

  ngOnInit(): void {
    this.loadFavorites();
    this.refreshOverrides();
    window.addEventListener('focus', this.onWindowFocus);
    window.addEventListener('storage', this.onStorageChange);
  }

  ngOnDestroy(): void {
    window.removeEventListener('focus', this.onWindowFocus);
    window.removeEventListener('storage', this.onStorageChange);
  }

  effect = effect(() => {
    const data = this.ws.statuses();
    console.log('Realtime Saw Data:', data);
  });

  private onWindowFocus = () => {
    this.refreshOverrides();
  };

  private onStorageChange = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith(this.OVERRIDE_KEY_PREFIX)) {
      this.refreshOverrides();
    }
  };

  private refreshOverrides() {
    this.overrideTick.update(v => v + 1);
  }

  private getLocalOverride(equipID: string): MachineOverride | null {
    try {
      const raw = localStorage.getItem(`${this.OVERRIDE_KEY_PREFIX}${equipID}`);
      if (!raw) return null;
      return JSON.parse(raw) as MachineOverride;
    } catch {
      return null;
    }
  }

  statusCounts = computed(() => {
    const c: Record<string, number> = {};
    for (const r of this.rows()) {
      const k = (r.oeeMode ?? 'NA').toUpperCase();
      c[k] = (c[k] ?? 0) + 1;
    }
    c['ALL'] = this.rows().length;
    return c;
  });

  activeCount = computed(() => this.rows().filter(r => r.oeeMode === 'PD').length);
  warningCount = computed(() =>
    this.rows().filter(r => ['RP', 'WS', 'MS'].includes((r.oeeMode || '').toUpperCase())).length
  );
  downCount = computed(() => this.rows().filter(r => r.oeeMode === 'DN').length);
  machineCount = computed(() => this.filteredRows().length);

  totalCount = computed(() => this.rows().length);
  activeCountNew = computed(() =>
    this.rows().filter(r => (r.oeeMode ?? '').toUpperCase() === 'PD').length
  );

  needActionCount = computed(() =>
    this.rows().filter(r => (r.oeeMode ?? '').toUpperCase() === 'SB').length
  );

  otherCount = computed(() => {
    const valid = this.rows().filter(r => r.oeeMode);
    return valid.filter(r => !['PD', 'SB'].includes((r.oeeMode ?? '').toUpperCase())).length;
  });

  keyword = signal('');
  sortAsc = signal(true);
  statusFilter = signal<'ALL' | string>('ALL');
  readonly statusChips = [
    'ALL',
    'PD',
    'DN',
    'RP',
    'WS',
    'CV',
    'SB',
    'PB',
    'MS',
    'EG',
    'SU',
    'OT',
    'UD',
    'CM',
    'WR',
    'WC',
    'WB',
    'WT',
    'TS',
    'CB'
  ] as const;

  innerStatusChips = this.statusChips.filter(s => s !== 'ALL');

  private readonly FAV_KEY = 'favorites';
  private readonly OP_NAME = 'SAW';
  favorites = signal<Set<string>>(new Set<string>());
  userSorted = signal(false);
  showFilters = signal(false);

  toggleFilters() { this.showFilters.set(!this.showFilters()); }
  openFilters() { this.showFilters.set(true); }
  closeFilters() { this.showFilters.set(false); }

  filteredRows = computed(() => {
    let list = this.rows();

    const k = this.keyword().trim().toLowerCase();
    if (k) list = list.filter(r => r.equipID.toLowerCase().includes(k));

    if (this.statusFilter() !== 'ALL') {
      list = list.filter(r => (r.oeeMode ?? 'NA').toUpperCase() === this.statusFilter());
    }

    return list.slice().sort((a, b) => {
      if (!this.userSorted()) {
        const fa = this.isFavorite(a.equipID);
        const fb = this.isFavorite(b.equipID);
        if (fa !== fb) return fa ? -1 : 1;
      }

      const aNA = ((a.oeeMode ?? 'NA').toUpperCase() === 'NA');
      const bNA = ((b.oeeMode ?? 'NA').toUpperCase() === 'NA');
      if (aNA !== bNA) return aNA ? 1 : -1;

      const dir = this.sortAsc() ? 1 : -1;
      return dir * a.equipID.localeCompare(b.equipID, undefined, { numeric: true });
    });
  });

  onKeywordInput(ev: Event) {
    this.keyword.set((ev.target as HTMLInputElement).value);
  }

  toggleSort() {
    this.userSorted.set(true);
    this.sortAsc.set(!this.sortAsc());
  }

  setStatusFilter(st: string) {
    this.statusFilter.set(st as any);
  }

  scrollToStats() {
    const el = document.getElementById('statsTop');
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  isFavorite(id: string): boolean {
    return this.favorites().has(id);
  }

  toggleFavorite(id: string) {
    const favs = this.loadAllFavorites();
    const list = new Set(favs[this.OP_NAME] ?? []);

    if (list.has(id)) list.delete(id);
    else list.add(id);

    favs[this.OP_NAME] = Array.from(list);
    localStorage.setItem(this.FAV_KEY, JSON.stringify(favs));

    this.favorites.set(list);
  }

  private loadFavorites() {
    const favs = this.loadAllFavorites();
    this.favorites.set(new Set(favs[this.OP_NAME] ?? []));
  }

  private loadAllFavorites(): Record<string, string[]> {
    try {
      const raw = localStorage.getItem(this.FAV_KEY);
      if (!raw) return {};
      return JSON.parse(raw) ?? {};
    } catch {
      return {};
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (!this.showFilters()) return;
    const root = this.el.nativeElement;
    if (!root.contains(ev.target as Node)) this.closeFilters();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.showFilters()) this.closeFilters();
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
}