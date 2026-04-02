import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, map, Observable, of } from 'rxjs';

export type Plant = 'UTL1' | 'UTL2' | 'UTL3';

export interface BladeCandidate {
  productionStock: string;
  storeStockId: string;
  bladeType?: string;
  bladeChangeRecC?: string | number;
  customer?: string;
  spindle?: 'Z1' | 'Z2' | 'ALL' | string;
  condition?: string;
  controlLimit?: number;
  specLimit?: number;
  plant: Plant;
}

export interface CreateBladeResponse {
  toolingId?: string;
  message?: string;
  ok?: boolean;
}

type MockBladeCandidate = BladeCandidate & {
  bladeLotId?: string;
  barcodeAliases?: string[];
  stockTypeAliases?: string[];
};

@Injectable({ providedIn: 'root' })
export class AddNewBladeApiService {
  private readonly ROOT = '/ToolingService/api/Tooling';
  private readonly SEARCH_URL = `${this.ROOT}/SearchInputNewTooling`;
  private readonly ADD_URL = `${this.ROOT}/AddNewBlade`;
  private readonly GET_CONTROL_LIMIT = `${this.ROOT}/GetControlLimit`;
  private readonly GET_BLADE_LOT_ID = `${this.ROOT}/GetBladeLotID`;

  // ✅ ใช้ mock ทั้ง read/write
  private readonly DRY_RUN_WRITE = true;
  private readonly DRY_RUN_READS = true;

  private readonly MOCK_DB: MockBladeCandidate[] = [
    // =========================
    // UTL1 : 05SD4000N130BB (ตามภาพจริง)
    // =========================
    {
      productionStock: 'SW00000175',
      storeStockId: '71400075',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-1',
      customer: 'IFX',
      spindle: 'Z2',
      condition: '',
      controlLimit: 4000,
      specLimit: 4500,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000175', '05SD4000N130BB', 'sd4000n130bb'],
      stockTypeAliases: ['SW00000175', '71400075', '05SD4000N130BB', 'sd4000n130bb'],
    },
    {
      productionStock: 'SW00000176',
      storeStockId: '71400075',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-1',
      customer: 'MUR',
      spindle: 'Z2',
      condition: 'DAF',
      controlLimit: 10000,
      specLimit: 10500,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000176', '05SD4000N130BB', 'sd4000n130bb'],
      stockTypeAliases: ['SW00000176', '71400075', '05SD4000N130BB', 'sd4000n130bb'],
    },
    {
      productionStock: 'SW00000185',
      storeStockId: '71400075',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-1',
      customer: 'ALL',
      spindle: 'Z2',
      condition: 'DAF',
      controlLimit: 10000,
      specLimit: 10500,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000185', '05SD4000N130BB', 'sd4000n130bb'],
      stockTypeAliases: ['SW00000185', '71400075', '05SD4000N130BB', 'sd4000n130bb'],
    },
    {
      productionStock: 'SW00000187',
      storeStockId: '71400075',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-1',
      customer: 'ALL',
      spindle: 'Z1',
      condition: 'DAF',
      controlLimit: 12000,
      specLimit: 12500,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000187', '05SD4000N130BB', 'sd4000n130bb'],
      stockTypeAliases: ['SW00000187', '71400075', '05SD4000N130BB', 'sd4000n130bb'],
    },
    {
      productionStock: 'SW00000197',
      storeStockId: '71400031',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-32513',
      customer: 'IFX',
      spindle: 'Z1',
      condition: '',
      controlLimit: 8500,
      specLimit: 9000,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000197', '05SD4000N130BB', 'sd4000n130bb'],
      stockTypeAliases: ['SW00000197', '71400031', '05SD4000N130BB', 'sd4000n130bb'],
    },
    {
      productionStock: 'SW00000201',
      storeStockId: '71400075',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-1',
      customer: 'ALL',
      spindle: 'Z1',
      condition: '',
      controlLimit: 12000,
      specLimit: 12500,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000201', '05SD4000N130BB', 'sd4000n130bb'],
      stockTypeAliases: ['SW00000201', '71400075', '05SD4000N130BB', 'sd4000n130bb'],
    },
    {
      productionStock: 'SW00000202',
      storeStockId: '71400075',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-1',
      customer: 'ALL',
      spindle: 'Z2',
      condition: '',
      controlLimit: 10000,
      specLimit: 10500,
      plant: 'UTL1',
      bladeLotId: '72773700',
      barcodeAliases: [
        '11DADDOGH250710DX506LSE',
        '72773700 MK25 EAP0447 2507',
        '72773700 MK25 EXP0447 2507',
        'SW00000202',
        '05SD4000N130BB',
        'sd4000n130bb',
      ],
      stockTypeAliases: ['SW00000202', '71400075', '05SD4000N130BB', 'sd4000n130bb'],
    },
    {
      productionStock: 'SW00000221',
      storeStockId: '71400075',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-1',
      customer: 'ALL',
      spindle: 'Z1',
      condition: 'S',
      controlLimit: 12000,
      specLimit: 12500,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000221', '05SD4000N130BB', 'sd4000n130bb'],
      stockTypeAliases: ['SW00000221', '71400075', '05SD4000N130BB', 'sd4000n130bb'],
    },
    {
      productionStock: 'SW00000222',
      storeStockId: '71400075',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-1',
      customer: 'ALL',
      spindle: 'Z2',
      condition: 'S',
      controlLimit: 10000,
      specLimit: 10500,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000222', '05SD4000N130BB', 'sd4000n130bb'],
      stockTypeAliases: ['SW00000222', '71400075', '05SD4000N130BB', 'sd4000n130bb'],
    },
    {
      productionStock: 'SW00000259',
      storeStockId: '71400075',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-1',
      customer: 'IFX',
      spindle: 'Z1',
      condition: 'DAF',
      controlLimit: 8500,
      specLimit: 9000,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000259', '05SD4000N130BB', 'sd4000n130bb'],
      stockTypeAliases: ['SW00000259', '71400075', '05SD4000N130BB', 'sd4000n130bb'],
    },
    {
      productionStock: 'SW00000260',
      storeStockId: '71400075',
      bladeType: '05SD4000N130BB',
      bladeChangeRecC: '-1',
      customer: 'IFX',
      spindle: 'Z2',
      condition: 'DAF',
      controlLimit: 8500,
      specLimit: 9000,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000260', '05SD4000N130BB', 'sd4000n130bb'],
      stockTypeAliases: ['SW00000260', '71400075', '05SD4000N130BB', 'sd4000n130bb'],
    },

    // =========================
    // UTL1 : 05SD3000N150BB
    // =========================
    {
      productionStock: 'SW00000127',
      storeStockId: '71400031',
      bladeType: '05SD3000N150BB',
      bladeChangeRecC: '-1',
      customer: 'CYP',
      spindle: 'Z2',
      condition: 'NORMAL',
      controlLimit: 8500,
      specLimit: 9000,
      plant: 'UTL1',
      bladeLotId: 'H250710DX506',
      barcodeAliases: [
        '11DADDOGH250710DX506LSE',
        '05SD3000N150BB',
        'SW00000127',
        '71400031',
      ],
      stockTypeAliases: ['SW00000127', '71400031', '05SD3000N150BB'],
    },
    {
      productionStock: 'SW00000128',
      storeStockId: '71400031',
      bladeType: '05SD3000N150BB',
      bladeChangeRecC: '-1',
      customer: 'ALL',
      spindle: 'Z1',
      condition: '',
      controlLimit: 8200,
      specLimit: 9000,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000128', '05SD3000N150BB'],
      stockTypeAliases: ['SW00000128', '71400031', '05SD3000N150BB'],
    },
    {
      productionStock: 'SW00000129',
      storeStockId: '71400031',
      bladeType: '05SD3000N150BB',
      bladeChangeRecC: '0',
      customer: 'STM',
      spindle: 'Z2',
      condition: 'DAF',
      controlLimit: 8700,
      specLimit: 9200,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000129', '05SD3000N150BB'],
      stockTypeAliases: ['SW00000129', '71400031', '05SD3000N150BB'],
    },

    // =========================
    // UTL1 : 05SD3500N170DD
    // =========================
    {
      productionStock: 'SW00000109',
      storeStockId: '71400032',
      bladeType: '05SD3500N170DD',
      bladeChangeRecC: '-1',
      customer: 'ALL',
      spindle: 'Z1',
      condition: 'NORMAL',
      controlLimit: 9000,
      specLimit: 10500,
      plant: 'UTL1',
      bladeLotId: 'H250429P5710VL',
      barcodeAliases: [
        'LCBBBA66H250429P5710VL2',
        '05SD3500N170DD',
        'SW00000109',
        '71400032',
      ],
      stockTypeAliases: ['SW00000109', '71400032', '05SD3500N170DD'],
    },
    {
      productionStock: 'SW00000110',
      storeStockId: '71400032',
      bladeType: '05SD3500N170DD',
      bladeChangeRecC: '-1',
      customer: 'NP3',
      spindle: 'Z2',
      condition: '',
      controlLimit: 9200,
      specLimit: 10600,
      plant: 'UTL1',
      bladeLotId: '',
      barcodeAliases: ['SW00000110', '05SD3500N170DD'],
      stockTypeAliases: ['SW00000110', '71400032', '05SD3500N170DD'],
    },

    // =========================
    // UTL2
    // =========================
    {
      productionStock: 'SW00000555',
      storeStockId: '72400010',
      bladeType: 'TYPE-001',
      bladeChangeRecC: '1',
      customer: 'ABC',
      spindle: 'Z1',
      condition: 'NORMAL',
      controlLimit: 7800,
      specLimit: 8600,
      plant: 'UTL2',
      bladeLotId: 'NA510ZEN',
      barcodeAliases: [
        'RR$$1h250730NA510ZEN',
        'TYPE-001',
        'SW00000555',
        '72400010',
      ],
      stockTypeAliases: ['SW00000555', '72400010', 'TYPE-001'],
    },
    {
      productionStock: 'SW00000666',
      storeStockId: '72400011',
      bladeType: 'TYPE-002',
      bladeChangeRecC: '0',
      customer: 'XYZ',
      spindle: 'Z2',
      condition: '',
      controlLimit: 6500,
      specLimit: 8200,
      plant: 'UTL2',
      bladeLotId: 'KF025EXP0547',
      barcodeAliases: [
        '73028415 KF025 EXP0547 2507',
        'TYPE-002',
        'SW00000666',
        '72400011',
      ],
      stockTypeAliases: ['SW00000666', '72400011', 'TYPE-002'],
    },
    {
      productionStock: 'SW00000667',
      storeStockId: '72400012',
      bladeType: 'TYPE-002',
      bladeChangeRecC: '0',
      customer: 'XYZ',
      spindle: 'Z1',
      condition: 'S',
      controlLimit: 6400,
      specLimit: 8100,
      plant: 'UTL2',
      bladeLotId: '',
      barcodeAliases: ['SW00000667', 'TYPE-002'],
      stockTypeAliases: ['SW00000667', '72400012', 'TYPE-002'],
    },

    // =========================
    // UTL3
    // =========================
    {
      productionStock: 'SW00000777',
      storeStockId: '73400021',
      bladeType: 'TYPE-ALPHA',
      bladeChangeRecC: '-1',
      customer: 'CYP',
      spindle: 'ALL',
      condition: 'NORMAL',
      controlLimit: 7000,
      specLimit: 9000,
      plant: 'UTL3',
      bladeLotId: 'NE503RRF',
      barcodeAliases: [
        '++9399HAH240723NE503RRF',
        'TYPE-ALPHA',
        'SW00000777',
        '73400021',
      ],
      stockTypeAliases: ['SW00000777', '73400021', 'TYPE-ALPHA'],
    },
    {
      productionStock: 'SW00000778',
      storeStockId: '73400022',
      bladeType: 'TYPE-BETA',
      bladeChangeRecC: '-1',
      customer: 'ALL',
      spindle: 'Z2',
      condition: '',
      controlLimit: 7100,
      specLimit: 9100,
      plant: 'UTL3',
      bladeLotId: '',
      barcodeAliases: ['SW00000778', 'TYPE-BETA'],
      stockTypeAliases: ['SW00000778', '73400022', 'TYPE-BETA'],
    },
  ];

  constructor(private http: HttpClient) {}

  searchByBarcode(input: string, plant: Plant) {
    return this.search('Blade barcode ID', input, plant);
  }

  searchByStockAndType(input: string, plant: Plant) {
    return this.search('Stock & Blade Type', input, plant);
  }

  private search(searchBy: string, input: string, plant: Plant): Observable<BladeCandidate[]> {
    if (this.DRY_RUN_READS) {
      return this.mockSearch(searchBy, input, plant);
    }

    return this.http.post<any[]>(this.SEARCH_URL, { searchBy, input, plant }, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
    }).pipe(map(rows => (rows ?? []).map(this.mapCandidate)));
  }

  private mockSearch(searchBy: string, input: string, plant: Plant): Observable<BladeCandidate[]> {
    const q = this.normalize(input);

    const rows = this.MOCK_DB
      .filter(row => row.plant === plant)
      .filter(row => {
        const aliases =
          searchBy === 'Blade barcode ID'
            ? (row.barcodeAliases ?? [])
            : (row.stockTypeAliases ?? []);

        const haystack = [
          row.productionStock,
          row.storeStockId,
          row.bladeType ?? '',
          row.customer ?? '',
          row.spindle ?? '',
          ...aliases,
        ].map(v => this.normalize(v));

        return haystack.some(v => v.includes(q));
      })
      .map(({ bladeLotId, barcodeAliases, stockTypeAliases, ...rest }) => rest);

    return of(rows).pipe(delay(250));
  }

  private mapCandidate = (raw: any): BladeCandidate => {
    const L: Record<string, any> = {};
    Object.keys(raw ?? {}).forEach(k => (L[k.toLowerCase()] = raw[k]));

    const pick = (...ks: string[]) =>
      ks.map(k => L[k.toLowerCase()]).find(v => v !== undefined);

    const toNum = (v: any) => {
      const n = typeof v === 'string' ? Number(v) : v;
      return Number.isFinite(n) ? n : undefined;
    };

    return {
      productionStock: String(pick('saw_productionstock') ?? ''),
      storeStockId: String(pick('storestock') ?? ''),
      bladeType: String(pick('bladetype') ?? ''),
      bladeChangeRecC: pick('bladechangereccolor') ?? pick('bladechangerecocolor') ?? '',
      customer: String(pick('customer') ?? ''),
      spindle: String(pick('spindle') ?? ''),
      condition: String(pick('condition') ?? ''),
      controlLimit: toNum(pick('controllimit')),
      specLimit: toNum(pick('speclimit')),
      plant: (pick('plant') as Plant) ?? 'UTL1',
    };
  };

  getControlLimit(sawProductionStock: string): Observable<number | undefined> {
    if (this.DRY_RUN_READS) {
      const found = this.MOCK_DB.find(
        row => this.normalize(row.productionStock) === this.normalize(sawProductionStock)
      );
      return of(found?.controlLimit).pipe(delay(180));
    }

    return this.http.post<any>(this.GET_CONTROL_LIMIT, { saw_ProductionStock: sawProductionStock }, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
    }).pipe(map(res => {
      if (res == null) return undefined;
      if (typeof res === 'number') return res;
      const L: Record<string, any> = {};
      Object.keys(res).forEach(k => (L[k.toLowerCase()] = res[k]));
      const v = L['data'] ?? L['controllimit'] ?? L['limit'];
      const n = typeof v === 'string' ? Number(v) : v;
      return Number.isFinite(n) ? n : undefined;
    }));
  }

  getBladeLotId(sawToolingId: string): Observable<string | undefined> {
    if (this.DRY_RUN_READS) {
      const normalized = this.normalize(sawToolingId);
      const found = this.MOCK_DB.find(row =>
        (row.barcodeAliases ?? []).some(alias => this.normalize(alias) === normalized)
      );

      return of(found?.bladeLotId).pipe(delay(180));
    }

    return this.http.post<any>(this.GET_BLADE_LOT_ID, { saw_ToolingID: sawToolingId }, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
    }).pipe(map(res => {
      if (res == null) return undefined;
      if (typeof res === 'string') return res;
      const L: Record<string, any> = {};
      Object.keys(res).forEach(k => (L[k.toLowerCase()] = res[k]));
      return (L['data'] ?? L['bladelotid'] ?? L['blade_lot_id']) as string | undefined;
    }));
  }

  addNewBlade(params: {
  sawToolingId: string;
  sawProductionStock: string;
  exposureInitialUm: number;
  plant: Plant;
}): Observable<CreateBladeResponse> {
  const toolingId = (params.sawToolingId || '').trim();
  const productionStock = (params.sawProductionStock || '').trim();
  const exposure = Number(params.exposureInitialUm);

  if (this.DRY_RUN_WRITE) {
    // validation
    if (!toolingId) {
      throw new Error('Blade ID is required.');
    }

    if (!productionStock) {
      throw new Error('Production Stock is required.');
    }

    if (!Number.isFinite(exposure) || exposure <= 0) {
      throw new Error('Initial Exposure must be greater than 0.');
    }

    // mock duplicate check
    const duplicated = this.MOCK_DB.some(row =>
      (row.barcodeAliases ?? []).some(alias => this.normalize(alias) === this.normalize(toolingId))
    );

    if (duplicated) {
      throw new Error(`Tooling ID "${toolingId}" already exists in the system.`);
    }

    // mock not found production stock
    const foundStock = this.MOCK_DB.some(
      row => this.normalize(row.productionStock) === this.normalize(productionStock)
    );

    if (!foundStock) {
      throw new Error(`Production Stock "${productionStock}" was not found.`);
    }

    const mock: CreateBladeResponse = {
      ok: true,
      toolingId,
      message: 'The blade record has been created successfully.',
    };

    console.log('[DRY RUN] AddNewBlade payload:', {
      saW_ToolingID: toolingId,
      saW_ProductionStock: productionStock,
      exposure_Initial: exposure,
      plant: params.plant,
    });

    return of(mock).pipe(delay(450));
  }

  const body = {
    saW_ToolingID: toolingId,
    saW_ProductionStock: productionStock,
    exposure_Initial: exposure,
    plant: params.plant,
  };

  return this.http.post<any>(this.ADD_URL, body, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
  }).pipe(
    map(res => {
      const L: Record<string, any> = {};
      Object.keys(res ?? {}).forEach(k => (L[k.toLowerCase()] = res[k]));

      const ok = L['ok'] ?? true;
      const message =
        L['message'] ??
        L['status'] ??
        'The blade record has been created successfully.';

      const result: CreateBladeResponse = {
        ok,
        message,
        toolingId:
          L['toolingid'] ??
          L['saw_toolingid'] ??
          L['data']?.toolingid ??
          L['data']?.toolingId,
      };

      if (!ok) {
        throw new Error(message || 'Unable to create blade.');
      }

      return result;
    })
  );
}

  toInch(um: number | null | undefined): number | undefined {
    if (um == null) return undefined;
    const inch = um / 25400;
    return Number.isFinite(inch) ? Number(inch.toFixed(5)) : undefined;
  }

  private normalize(v: unknown): string {
    return String(v ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/^05/, '');
  }
}