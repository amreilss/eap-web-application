import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY, from } from 'rxjs';
import { concatMap, catchError, map, filter, take, shareReplay } from 'rxjs/operators';

export interface BladeInfo {
  toolingId: string;
  productionStock: string;
  toolingStatus: string;
  exposureRemaining: number | null;
  distanceRemaining: number | null;
  spindle: string;
  bladeType: string;
  storeStock: string;
  machineName: string;
  condition: string;
  bladeLotId: string;
  bladeTypeFullName?: string;
  customer?: string;
  bladeChangeRecColor?: string | number;
  starttimeMachine?: string;
  endtimeMachine?: string;
}

type Plant = 'UTL1' | 'UTL2' | 'UTL3';

export interface AutoPlantResult {
  plant: Plant;
  data: BladeInfo;
}

@Injectable({ providedIn: 'root' })
export class ToolingApiService {
  /** เรียกผ่าน proxy เพื่อตัด CORS */
  private readonly URL = '/ToolingService/api/Tooling/BladeInformation';

  /** cache จำ plant ที่เจอแล้วต่อ sawToolingID */
  private plantCache = new Map<string, AutoPlantResult>();

  constructor(private http: HttpClient) {}

  /** ยิง POST {sawToolingID, plant} ลอง UTL1→UTL2→UTL3 จนเจอข้อมูลตัวแรก */
  getBladeInfo(bladeId: string): Observable<AutoPlantResult> {
    const cached = this.plantCache.get(bladeId);
    if (cached) return from([cached]);

    const plants: Plant[] = ['UTL1', 'UTL2', 'UTL3'];

    return from(plants).pipe(
      concatMap((plant) =>
        this.http
          .post<any>(
            this.URL,
            { sawToolingID: bladeId, plant },
            { headers: { Accept: 'application/json', 'Content-Type': 'application/json' } }
          )
          .pipe(
            catchError(() => EMPTY),
            map((raw) => ({ plant, data: this.mapRawToView(raw) }))
          )
      ),
      // “เจอข้อมูล” ถ้ามี id หรือ bladeType (กันเคส id ว่างแต่มีข้อมูลอย่างอื่น)
      filter((res) => !!res.data.toolingId || !!res.data.bladeType),
      take(1),
      map((res) => {
        this.plantCache.set(bladeId, res);
        return res;
      }),
      shareReplay(1)
    );
  }

  /** map payload จริง -> model UI (case-insensitive key) */
  private mapRawToView(raw: any): BladeInfo {
    // ทำให้คีย์เป็นตัวพิมพ์เล็กทั้งหมด
    const L: Record<string, any> = {};
    Object.keys(raw ?? {}).forEach((k) => (L[k.toLowerCase()] = raw[k]));

    const pick = (...keys: string[]) => {
      for (const k of keys) {
        const v = L[k.toLowerCase()];
        if (v !== undefined) return v;
      }
      return undefined;
    };

    const toNum = (v: any): number | null => {
      const n = typeof v === 'string' ? Number(v) : v;
      return Number.isFinite(n) ? n : null;
    };

    return {
      toolingId: String(pick('saw_toolingid', 'saw_tooling_id', 'sawtoolingid') ?? ''),
      productionStock: String(pick('saw_productionstock') ?? ''),
      toolingStatus: String(pick('tooling_eventname') ?? ''),
      exposureRemaining: toNum(pick('exposure_remaining')),
      distanceRemaining: toNum(pick('distance_remaining')),
      spindle: String(pick('spindle') ?? ''),
      bladeType: String(pick('bladetype') ?? pick('bladetype_fullname') ?? ''),
      storeStock: String(pick('storestock') ?? ''),
      machineName: String(pick('machinename') ?? ''),
      condition: String(pick('condition') ?? ''),
      bladeLotId: String(pick('bladelotid') ?? ''),

      // extra
      bladeTypeFullName: (pick('bladetype_fullname') ?? '') || undefined,
      customer: (pick('customer') ?? '') || undefined,
      bladeChangeRecColor: pick('bladechangereccolor'),
      starttimeMachine: (pick('starttime_machine') ?? '') || undefined,
      endtimeMachine: (pick('endtime_machine') ?? '') || undefined,
    };
  }
}
