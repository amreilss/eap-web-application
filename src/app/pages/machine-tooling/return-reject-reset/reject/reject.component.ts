import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import {
  BladeActionApiService,
  Reason,
  ApiResp,
  Preview,
  RejectPayload,
} from '../../../../services/blade-action-api.service';

type FormT = FormGroup<{
  bladeId: FormControl<string>;
  reason: FormControl<number | null>;
}>;

@Component({
  selector: 'app-reject',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reject.component.html',
  styleUrls: ['./reject.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectComponent implements OnInit {
  @Input() plant!: 'UTL1' | 'UTL2' | 'UTL3';

  @Output() completed = new EventEmitter<{
    action: 'Reject';
    bladeId?: string;
    reasonCode?: number | null;
    plant?: 'UTL1' | 'UTL2' | 'UTL3';
  }>();

  form: FormT = new FormGroup({
    bladeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    reason: new FormControl<number | null>(1, {
      validators: [Validators.required],
    }),
  });

  reasons: Reason[] = [];
  reasonsLoading = false;

  loading = false;
  msg = '';
  err = '';
  preview: RejectPayload | null = null;

  // mock ตามรูปจริง
  private readonly mockReasons: Reason[] = [
    { toolEV_ID: 1, tooling_EventName: '1.Blade due (Exposure).' } as Reason,
    { toolEV_ID: 2, tooling_EventName: '2.Blade due (Distance).' } as Reason,
    { toolEV_ID: 3, tooling_EventName: '3.Blade down (Total breakage).' } as Reason,
    { toolEV_ID: 4, tooling_EventName: '4.Blade down (Partial breakage).' } as Reason,
    { toolEV_ID: 5, tooling_EventName: '5.Blade down (Hole).' } as Reason,
    { toolEV_ID: 6, tooling_EventName: '6.Blade down (Bent).' } as Reason,
    { toolEV_ID: 7, tooling_EventName: '7.Blade down (Dent).' } as Reason,
    { toolEV_ID: 8, tooling_EventName: '8.Hold on use existing blade.' } as Reason,
    { toolEV_ID: 9, tooling_EventName: '9.ST required to scrap blade after used' } as Reason,
  ];

  constructor(private api: BladeActionApiService) {}

  ngOnInit(): void {
  // ให้มีเหตุผลให้เลือกทันที
  this.reasons = this.mockReasons;
  this.ensureDefaultReason();

  this.reasonsLoading = true;
  this.err = '';

  this.api.getReasons().pipe(finalize(() => (this.reasonsLoading = false))).subscribe({
    next: (list) => {
      const apiList = (list ?? []).filter(
        (x) => x && x.toolEV_ID != null && !!x.tooling_EventName
      );

      if (apiList.length) {
        this.reasons = apiList;
        this.ensureDefaultReason();
      }
    },
    error: () => {
      this.err = '';
    },
  });
}

  private ensureDefaultReason(): void {
    const current = this.form.controls.reason.value;
    if (current == null && this.reasons.length) {
      this.form.controls.reason.setValue(this.reasons[0].toolEV_ID);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.msg = '';
    this.err = '';
    this.preview = null;

    const id = this.form.controls.bladeId.value.trim();
    const toolEV_ID = Number(this.form.controls.reason.value);

    this.api.rejectBlade(id, toolEV_ID)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (r: ApiResp<number> & Preview<RejectPayload>) => {
          if (r?.success) {
            this.msg = String(r.message ?? '');

            this.completed.emit({
              action: 'Reject',
              bladeId: id,
              reasonCode: toolEV_ID,
              plant: this.plant,
            });
          } else {
            this.err = (Array.isArray(r?.errors) && r.errors.length)
              ? r.errors.join(' | ')
              : (r?.message ?? 'ดำเนินการไม่สำเร็จ');
          }

          this.preview = r?.preview ?? null;
        },
        error: (e: unknown) => {
          const er = e as { error?: { message?: string } };
          this.err = er?.error?.message ?? 'Failed';
        },
      });
  }
}