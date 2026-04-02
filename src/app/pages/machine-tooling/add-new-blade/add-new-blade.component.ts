import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';

import {
  AddNewBladeApiService,
  BladeCandidate,
  Plant,
} from '../../../services/add-new-blade-api.service';

type SearchForm = FormGroup<{
  mode: FormControl<'barcode' | 'stockType'>;
  plant: FormControl<Plant>;
  query: FormControl<string>;
}>;

type ConfirmForm = FormGroup<{
  bladeId: FormControl<string>;
  exposureUm: FormControl<number | null>;
  exposureInch: FormControl<number | null>;
  initialDistance: FormControl<number | null>;
  bladeLotId: FormControl<string>;
}>;

@Component({
  selector: 'app-add-new-blade',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-new-blade.component.html',
  styleUrls: ['./add-new-blade.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddNewBladeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() machineId = '';

  @Output() created = new EventEmitter<{
    toolingId?: string;
    bladeId?: string;
    plant?: Plant;
  }>();

  form: SearchForm = new FormGroup({
    mode: new FormControl<'barcode' | 'stockType'>('barcode', { nonNullable: true }),
    plant: new FormControl<Plant>('UTL1', { nonNullable: true }),
    query: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
  });

  confirmForm: ConfirmForm = new FormGroup({
    bladeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    exposureUm: new FormControl<number | null>(1, {
      validators: [Validators.required, Validators.min(0.001)],
    }),
    exposureInch: new FormControl<number | null>({ value: null, disabled: true }),
    initialDistance: new FormControl<number | null>({ value: null, disabled: true }),
    bladeLotId: new FormControl({ value: '', disabled: true }, {
      nonNullable: true,
    }),
  });

  results: BladeCandidate[] = [];
  selectedIndex: number | null = null;

  loading = false;
  submitting = false;
  error: string | null = null;
  success: any = null;

  showConfirm = false;

  constructor(
    private api: AddNewBladeApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.confirmForm.controls.exposureUm.valueChanges.subscribe((value) => {
      this.updateExposureInch(value);
    });

    this.confirmForm.controls.bladeId.valueChanges.subscribe((value) => {
      this.updateBladeLotId(value);
    });

    this.updateExposureInch(this.confirmForm.controls.exposureUm.value);
    this.updateBladeLotId(this.confirmForm.controls.bladeId.value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get searchLabel(): string {
    return this.form.value.mode === 'barcode'
      ? 'Scan Barcode'
      : 'Search by Stock / Type';
  }

  get searchPlaceholder(): string {
    return this.form.value.mode === 'barcode'
      ? 'Scan barcode...'
      : 'Enter stock / blade type...';
  }

  get selectedRow(): BladeCandidate | null {
    return this.selectedIndex == null ? null : this.results[this.selectedIndex];
  }

  get canAdd(): boolean {
    return this.selectedIndex !== null;
  }

  get canConfirmAdd(): boolean {
    return this.confirmForm.valid && !this.submitting && !!this.selectedRow;
  }

  clear(): void {
    this.form.reset({
      mode: 'barcode',
      plant: 'UTL1',
      query: '',
    });

    this.results = [];
    this.selectedIndex = null;
    this.error = null;
    this.success = null;
    this.showConfirm = false;

    this.confirmForm.reset({
      bladeId: '',
      exposureUm: 1,
      exposureInch: null,
      initialDistance: null,
      bladeLotId: '',
    });

    this.cdr.markForCheck();
  }

  trackByIndex(index: number): number {
    return index;
  }

  selectRow(index: number): void {
    this.selectedIndex = index;
    this.error = null;
    this.success = null;
    this.cdr.markForCheck();
  }

  val(row: any, key: string): any {
    return row?.[key] ?? '-';
  }

  submitSearch(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;
    this.results = [];
    this.selectedIndex = null;

    const q = this.form.controls.query.value.trim();
    const p = this.form.controls.plant.value;

    const obs =
      this.form.controls.mode.value === 'barcode'
        ? this.api.searchByBarcode(q, p)
        : this.api.searchByStockAndType(q, p);

    obs
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (rows) => {
          this.results = rows ?? [];
          this.error = this.results.length ? null : 'No data found';
        },
        error: () => {
          this.error = 'Search failed';
          this.results = [];
        },
      });
  }

  addFromSelection(): void {
  if (!this.selectedRow) return;

  const row = this.selectedRow;
  const defaultBladeId = (row.productionStock || '').trim();

  this.confirmForm.reset({
    bladeId: defaultBladeId,
    exposureUm: 1,
    exposureInch: this.api.toInch(1) ?? null,
    initialDistance: row.controlLimit ?? null,
    bladeLotId: '',
  });

  this.showConfirm = true;
  this.error = null;
  this.success = null;
  this.cdr.markForCheck();

  this.api.getBladeLotId(defaultBladeId).subscribe({
    next: (lotId) => {
      this.confirmForm.controls.bladeLotId.setValue(lotId ?? '', { emitEvent: false });
      this.cdr.markForCheck();
    },
    error: () => {
      this.confirmForm.controls.bladeLotId.setValue('', { emitEvent: false });
      this.cdr.markForCheck();
    },
  });
}

  closeConfirm(): void {
    this.showConfirm = false;

    this.confirmForm.reset({
      bladeId: '',
      exposureUm: 1,
      exposureInch: null,
      initialDistance: null,
      bladeLotId: '',
    });

    this.cdr.markForCheck();
  }

  confirmAdd(): void {
  if (!this.selectedRow) return;

  if (this.confirmForm.invalid) {
    this.confirmForm.markAllAsTouched();
    return;
  }

  const row = this.selectedRow;
  const raw = this.confirmForm.getRawValue();

  const bladeId = raw.bladeId.trim();
  const exposureUm = raw.exposureUm ?? 1;

  this.submitting = true;
  this.error = null;
  this.success = null;
  this.cdr.markForCheck();

  let req$;

  try {
    req$ = this.api.addNewBlade({
      sawToolingId: bladeId,
      sawProductionStock: row.productionStock || '',
      exposureInitialUm: exposureUm,
      plant: this.form.controls.plant.value,
    });
  } catch (err: any) {
    this.submitting = false;
    this.error = err?.message || 'Add failed';
    this.cdr.markForCheck();
    return;
  }

  req$
    .pipe(
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      })
    )
    .subscribe({
      next: (res: any) => {
        this.success = res;
        this.showConfirm = false;
        this.selectedIndex = null;

        this.created.emit({
          toolingId: res.toolingId,
          bladeId,
          plant: this.form.controls.plant.value,
        });
      },
      error: (err: any) => {
        this.error = err?.message || 'Add failed';
      },
    });
}

  private updateExposureInch(value: number | null): void {
    const inch = this.calcExposureInch(value);
    this.confirmForm.controls.exposureInch.setValue(inch, { emitEvent: false });
    this.cdr.markForCheck();
  }

  private updateBladeLotId(value: string): void {
    const bladeLotId = this.deriveBladeLotId(value);
    this.confirmForm.controls.bladeLotId.setValue(bladeLotId, { emitEvent: false });
    this.cdr.markForCheck();
  }

  private calcExposureInch(value: number | null): number | null {
    if (value == null || Number.isNaN(Number(value)) || Number(value) <= 0) {
      return null;
    }

    const inch = Number(value) / 25400;
    return Number(inch.toFixed(5));
  }

  private toNumber(value: unknown): number | null {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  private deriveBladeLotId(bladeId: string): string {
    const v = (bladeId || '').trim();

    if (!v) return '';

    if (v.length > 25) {
      return v.substring(0, 8);
    }

    if (v.length > 16) {
      return v.substring(v.length - 15, v.length);
    }

    return '';
  }
}