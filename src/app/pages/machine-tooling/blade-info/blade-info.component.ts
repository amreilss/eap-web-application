import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { BladeInfo, AutoPlantResult } from '../../../services/tooling-api.service';

type BladeInfoForm = FormGroup<{ bladeId: FormControl<string> }>;

@Component({
  selector: 'app-blade-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './blade-info.component.html',
  styleUrls: ['./blade-info.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BladeInfoComponent {
  @Output() searched = new EventEmitter<{
    bladeId?: string;
    toolingId?: string;
    plant?: 'UTL1' | 'UTL2' | 'UTL3' | null;
  }>();

  private readonly MOCK_BLADE_DB: Record<string, AutoPlantResult> = {
    '11DADDOGH250710DX506LSE': {
      plant: 'UTL1',
      data: {
        toolingId: '11DADDOGH250710DX506LSE',
        productionStock: 'SW00000127',
        toolingStatus: 'ACTIVE',
        exposureRemaining: 0.82,
        distanceRemaining: 7200,
        spindle: 'Z2',
        bladeType: '05SD3000N150BB',
        storeStock: '71400031',
        machineName: 'DICER-01',
        condition: 'NORMAL',
        bladeLotId: 'LOT123456',
        customer: 'CYP',
        bladeChangeRecColor: '-1',
      },
    },

    'AA1200H250700DX001': {
      plant: 'UTL2',
      data: {
        toolingId: 'AA1200H250700DX001',
        productionStock: 'SW00000210',
        toolingStatus: 'USED',
        exposureRemaining: 0.95,
        distanceRemaining: 8800,
        spindle: 'Z1',
        bladeType: 'TYPE-001',
        storeStock: '70000010',
        machineName: 'DICER-02',
        condition: 'WARNING',
        bladeLotId: 'LOT222111',
        customer: 'ABC',
        bladeChangeRecColor: '1',
      },
    },

    'BB3400H250800NA002': {
      plant: 'UTL3',
      data: {
        toolingId: 'BB3400H250800NA002',
        productionStock: 'SW00000345',
        toolingStatus: 'NEW',
        exposureRemaining: 0.3,
        distanceRemaining: 2500,
        spindle: 'Z3',
        bladeType: 'TYPE-002',
        storeStock: '70000020',
        machineName: 'DICER-03',
        condition: 'NORMAL',
        bladeLotId: 'LOT333222',
        customer: 'XYZ',
        bladeChangeRecColor: '0',
      },
    },

    'CC7788H250900VL003': {
      plant: 'UTL1',
      data: {
        toolingId: 'CC7788H250900VL003',
        productionStock: 'SW00000456',
        toolingStatus: 'ACTIVE',
        exposureRemaining: 0.6,
        distanceRemaining: 5000,
        spindle: 'Z2',
        bladeType: 'TYPE-003',
        storeStock: '70000030',
        machineName: 'DICER-04',
        condition: 'NORMAL',
        bladeLotId: 'LOT444333',
        customer: 'CYP',
        bladeChangeRecColor: '-1',
      },
    },

    'DD9900H251000DX004': {
      plant: 'UTL2',
      data: {
        toolingId: 'DD9900H251000DX004',
        productionStock: 'SW00000567',
        toolingStatus: 'USED',
        exposureRemaining: 0.98,
        distanceRemaining: 9100,
        spindle: 'Z1',
        bladeType: 'TYPE-004',
        storeStock: '70000040',
        machineName: 'DICER-05',
        condition: 'CRITICAL',
        bladeLotId: 'LOT555444',
        customer: 'ABC',
        bladeChangeRecColor: '1',
      },
    },
  };

  private readonly examples: string[] = Object.keys(this.MOCK_BLADE_DB);

  samplePlaceholder = 'เช่น ' + this.examples[0];

  form: BladeInfoForm = new FormGroup({
    bladeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
  });

  loading = false;
  error: string | null = null;
  data: BladeInfo | null = null;
  searchedOnce = false;
  foundPlant: 'UTL1' | 'UTL2' | 'UTL3' | null = null;
  confirmed = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const r = Math.floor(Math.random() * this.examples.length);
    this.samplePlaceholder = 'เช่น ' + this.examples[r];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const bladeId = this.form.controls.bladeId.value.trim();

    this.loading = true;
    this.error = null;
    this.data = null;
    this.foundPlant = null;
    this.searchedOnce = true;
    this.confirmed = false;
    this.cdr.markForCheck();

    setTimeout(() => {
      const key = Object.keys(this.MOCK_BLADE_DB).find(
        (k) => k.toLowerCase() === bladeId.toLowerCase()
      );

      const res = key ? this.MOCK_BLADE_DB[key] : null;

      if (res) {
        this.data = res.data;
        this.foundPlant = res.plant;

        // สำคัญ: search สำเร็จแล้วแค่แสดงข้อมูล
        // ยังไม่ emit ไป log จนกว่าจะกดยืนยัน
      } else {
        this.error = 'ไม่พบข้อมูลในระบบ';
      }

      this.loading = false;
      this.cdr.markForCheck();
    }, 500);
  }

  confirmSelection(): void {
    if (!this.data || !this.foundPlant) {
      this.error = 'กรุณาค้นหาข้อมูล Blade ก่อนยืนยัน';
      this.cdr.markForCheck();
      return;
    }

    const bladeId = this.form.controls.bladeId.value.trim();

    this.searched.emit({
      bladeId,
      toolingId: this.data.toolingId,
      plant: this.foundPlant,
    });

    this.confirmed = true;
    this.error = null;
    this.cdr.markForCheck();
  }

  clear(): void {
    this.form.reset({ bladeId: '' });
    this.data = null;
    this.error = null;
    this.searchedOnce = false;
    this.foundPlant = null;
    this.confirmed = false;
    this.cdr.markForCheck();
  }
}