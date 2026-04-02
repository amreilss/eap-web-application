import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ManageTypeApiService,
  ManageTypeDetail,
  ManageTypeUpsertPayload,
} from '../../../services/manage-type-api.service';

type MTForm = {
  lotNoNew: FormControl<string>;
  isTaiko: FormControl<boolean>;
  recipe: FormControl<string>;
  z1: FormControl<string>;
  z1_2nd: FormControl<string>;
  z2: FormControl<string>;
  z2_2nd: FormControl<string>;
};

@Component({
  selector: 'app-manage-type',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-type.component.html',
  styleUrls: ['./manage-type.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ManageTypeApiService],
})
export class ManageTypeComponent {
  @Output() saved = new EventEmitter<{
    bladeType?: string;
    action?: string;
    lotNoNew?: string;
    recipe?: string;
  }>();

  loading = false;
  error: string | null = null;
  success: string | null = null;
  mode: 'insert' | 'update' | null = null;
  detail: ManageTypeDetail | null = null;
  canEdit = false;

  form: FormGroup<MTForm> = new FormGroup<MTForm>({
    lotNoNew: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    isTaiko: new FormControl(false, { nonNullable: true }),
    recipe: new FormControl('', { nonNullable: true }),
    z1: new FormControl('', { nonNullable: true }),
    z1_2nd: new FormControl('', { nonNullable: true }),
    z2: new FormControl('', { nonNullable: true }),
    z2_2nd: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private api: ManageTypeApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.form.controls.recipe.disable({ emitEvent: false });
    this.lockAllBladeInputs();

    this.form.controls.isTaiko.valueChanges.subscribe(() => {
      this.updateBladeInputsEnabled();
      this.cdr.markForCheck();
    });
  }

  get actionLabel(): string {
    if (this.loading) return this.mode === 'update' ? 'Updating…' : 'Adding…';
    return this.mode === 'update' ? 'Update' : 'Add';
  }

  get modeLabel(): string {
    if (this.mode === 'update') return 'Update';
    if (this.mode === 'insert') return 'Insert';
    return 'Waiting';
  }

  get recipeValue(): string {
    return this.form.controls.recipe.value || '';
  }

  get canSubmit(): boolean {
    const lot = (this.form.controls.lotNoNew.value || '').trim();
    const recipe = (this.form.controls.recipe.value || '').trim();
    const z1 = (this.form.controls.z1.value || '').trim();

    return !this.loading && this.canEdit && !!lot && !!recipe && !!z1;
  }

  get showResultPanel(): boolean {
    return !!this.detail || (!!this.canEdit && this.mode === 'insert');
  }

  private lockAllBladeInputs(): void {
    this.form.controls.z1.disable({ emitEvent: false });
    this.form.controls.z1_2nd.disable({ emitEvent: false });
    this.form.controls.z2.disable({ emitEvent: false });
    this.form.controls.z2_2nd.disable({ emitEvent: false });
  }

  private updateBladeInputsEnabled(): void {
    if (!this.canEdit) {
      this.lockAllBladeInputs();
      return;
    }

    this.form.controls.z1.enable({ emitEvent: false });
    this.form.controls.z1_2nd.enable({ emitEvent: false });

    if (this.form.controls.isTaiko.value) {
      this.form.controls.z2.disable({ emitEvent: false });
      this.form.controls.z2.setValue('', { emitEvent: false });

      this.form.controls.z2_2nd.disable({ emitEvent: false });
      this.form.controls.z2_2nd.setValue('', { emitEvent: false });
    } else {
      this.form.controls.z2.enable({ emitEvent: false });
      this.form.controls.z2_2nd.enable({ emitEvent: false });
    }
  }

  private errMsg(e: unknown): string {
    if (e instanceof Error) return e.message;
    if (typeof e === 'string') return e;
    try {
      return JSON.stringify(e);
    } catch {
      return 'Unexpected error';
    }
  }

  private buildBladeTypeSummary(): string {
    const v = this.form.getRawValue();
    const parts = [
      v.z1?.trim(),
      v.z1_2nd?.trim(),
      v.isTaiko ? null : v.z2?.trim(),
      v.isTaiko ? null : v.z2_2nd?.trim(),
    ]
      .filter((x): x is string => !!x && x.length > 0);

    return parts.join(' / ') || v.lotNoNew?.trim() || '—';
  }

  clear(): void {
    this.form.reset({
      lotNoNew: '',
      isTaiko: false,
      recipe: '',
      z1: '',
      z1_2nd: '',
      z2: '',
      z2_2nd: '',
    } as any);

    this.form.controls.recipe.disable({ emitEvent: false });

    this.mode = null;
    this.detail = null;
    this.error = null;
    this.success = null;
    this.canEdit = false;

    this.lockAllBladeInputs();
    this.cdr.markForCheck();
  }

  async onLotNewBlur(): Promise<void> {
    const lot = (this.form.controls.lotNoNew.value || '').trim();
    if (!lot) return;

    this.loading = true;
    this.error = null;
    this.success = null;
    this.detail = null;
    this.mode = null;
    this.cdr.markForCheck();

    try {
      const recipe = await this.api.getRecipeName(lot);
      this.form.controls.recipe.setValue(recipe || '');

      this.canEdit = !!recipe && recipe.trim().length > 0;

      if (!this.canEdit) {
        this.form.patchValue({
          z1: '',
          z1_2nd: '',
          z2: '',
          z2_2nd: '',
        } as any);
        this.lockAllBladeInputs();
        this.error = 'ไม่พบ Recipe ของ Lot นี้';
        return;
      }

      this.updateBladeInputsEnabled();

      const d = await this.api.getDetail(lot);
      this.detail = d;

      if (d) {
        this.mode = 'update';
        this.form.patchValue({
          z1: d.bladeTypeZ1 || '',
          z2: d.bladeTypeZ2 || '',
          z1_2nd: d.prodStockZ1_2nd || '',
          z2_2nd: d.prodStockZ2_2nd || '',
        } as any);
      } else {
        this.mode = 'insert';
        this.form.patchValue({
          z1: '',
          z1_2nd: '',
          z2: '',
          z2_2nd: '',
        } as any);
      }

      this.updateBladeInputsEnabled();
    } catch (e) {
      this.error = this.errMsg(e) || 'โหลดข้อมูล Lot ไม่สำเร็จ';
      this.canEdit = false;
      this.detail = null;
      this.mode = null;
      this.lockAllBladeInputs();
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async save(): Promise<void> {
    if (!this.canSubmit) {
      this.error = 'กรุณากรอก Lot No., Recipe และ Z1 ให้ครบ';
      this.success = null;
      this.cdr.markForCheck();
      return;
    }

    const v = this.form.getRawValue();

    const payload: ManageTypeUpsertPayload = {
      lotNoNew: v.lotNoNew,
      recipe: this.recipeValue,
      isTaiko: !!v.isTaiko,
      bladeZ1: v.z1?.trim() || null,
      bladeZ2: v.isTaiko ? null : (v.z2?.trim() || null),
      bladeZ1_2nd: v.z1_2nd?.trim() || null,
      bladeZ2_2nd: v.isTaiko ? null : (v.z2_2nd?.trim() || null),
    };

    const actionName = this.mode === 'update' ? 'Update Blade Type' : 'Insert Blade Type';

    this.loading = true;
    this.error = null;
    this.success = null;
    this.cdr.markForCheck();

    try {
      if (this.mode === 'update') {
        await this.api.update(payload);
        this.success = 'Update สำเร็จ';
      } else {
        await this.api.insert(payload);
        this.success = 'Insert สำเร็จ';
        this.mode = 'update';
      }

      this.detail = await this.api.getDetail(v.lotNoNew);

      this.saved.emit({
        action: actionName,
        lotNoNew: v.lotNoNew?.trim() || '',
        recipe: this.recipeValue,
        bladeType: this.buildBladeTypeSummary(),
      });
    } catch (e) {
      this.error = this.errMsg(e) || 'บันทึกไม่สำเร็จ';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}