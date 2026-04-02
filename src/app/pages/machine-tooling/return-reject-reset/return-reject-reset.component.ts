import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';

import {
  BladeActionApiService,
  ApiResp,
  Reason as ApiReason,
} from '../../../services/blade-action-api.service';

type Mode = 'return' | 'reject' | 'reset';

type ActionForm = FormGroup<{
  mode: FormControl<Mode>;
  bladeId: FormControl<string>;
  reasonCode: FormControl<number | null>;
}>;

type Reason = {
  code: number;
  en: string;
  th?: string;
  tone?: 'info' | 'warn' | 'danger';
};

@Component({
  selector: 'app-return-reject-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './return-reject-reset.component.html',
  styleUrls: ['./return-reject-reset.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReturnRejectResetComponent implements OnInit, OnDestroy {
  @Output() completed = new EventEmitter<{
    action?: 'Return' | 'Reject' | 'Reset';
    reference?: string;
  }>();

  form: ActionForm = new FormGroup({
    mode: new FormControl<Mode>('return', { nonNullable: true }),
    bladeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    reasonCode: new FormControl<number | null>(null),
  });

  reasons: Reason[] = [];
  reasonsLoading = false;
  reasonsError: string | null = null;

  loading = false;
  success: string | null = null;
  error: string | null = null;

  private sub = new Subscription();
  private successTimer: any = null;

  private readonly mockReasons: Reason[] = [
    { code: 1, en: '1.Blade due (Exposure).', tone: 'warn' },
    { code: 2, en: '2.Blade due (Distance).', tone: 'warn' },
    { code: 3, en: '3.Blade down (Total breakage).', tone: 'danger' },
    { code: 4, en: '4.Blade down (Partial breakage).', tone: 'danger' },
    { code: 5, en: '5.Blade down (Hole).', tone: 'danger' },
    { code: 6, en: '6.Blade down (Bent).', tone: 'danger' },
    { code: 7, en: '7.Blade down (Dent).', tone: 'danger' },
    { code: 8, en: '8.Hold on use existing blade.', tone: 'info' },
    { code: 9, en: '9.ST required to scrap blade after used', tone: 'warn' },
  ];

  constructor(private api: BladeActionApiService) {}

  ngOnInit(): void {
    this.reasonsLoading = true;
    this.reasonsError = null;

    this.api
      .getReasons()
      .pipe(finalize(() => (this.reasonsLoading = false)))
      .subscribe({
        next: (rows: ApiReason[]) => {
          const mapped = (rows ?? [])
            .filter(r => r?.toolEV_ID != null && !!r?.tooling_EventName)
            .map((r) => ({
              code: r.toolEV_ID,
              en: r.tooling_EventName,
              tone: this.guessTone(r.tooling_EventName),
            }));

          this.reasons = mapped.length ? mapped : this.mockReasons;
          this.ensureDefaultReason();
        },
        error: () => {
          this.reasons = this.mockReasons;
          this.ensureDefaultReason();
          this.reasonsError = null;
        },
      });

    this.sub.add(
      this.form.controls.mode.valueChanges.subscribe((m) => {
        if (m === 'reject') {
          this.ensureDefaultReason();
        } else {
          this.form.controls.reasonCode.setValue(null);
        }
        this.clearMsg();
      })
    );

    this.sub.add(
      merge(
        this.form.controls.bladeId.valueChanges,
        this.form.controls.reasonCode.valueChanges
      )
        .pipe(debounceTime(120), distinctUntilChanged())
        .subscribe(() => this.clearMsg())
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.successTimer) clearTimeout(this.successTimer);
  }

  get isReject(): boolean {
    return this.form.controls.mode.value === 'reject';
  }

  get selectedReason(): Reason | null {
    const code = this.form.controls.reasonCode.value;
    return code == null
      ? null
      : this.reasons.find((r) => r.code === Number(code)) ?? null;
  }

  get submitText(): string {
    return this.loading
      ? 'Processing…'
      : this.form.controls.mode.value === 'return'
      ? 'Return'
      : this.form.controls.mode.value === 'reject'
      ? 'Reject'
      : 'Reset';
  }

  get submitClass(): Record<string, boolean> {
    const m = this.form.controls.mode.value;
    return {
      'btn--primary': m === 'return',
      'btn--reject': m === 'reject',
      'btn--reset': m === 'reset',
    };
  }

  private ensureDefaultReason(): void {
    if (this.form.controls.mode.value === 'reject' && !this.form.controls.reasonCode.value) {
      this.form.controls.reasonCode.setValue(
        this.reasons.find(x => x.code === 2)?.code ?? this.reasons[0]?.code ?? null
      );
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isReject && !this.form.controls.reasonCode.value) {
      this.error = 'กรุณาเลือก Reason';
      return;
    }

    this.loading = true;
    this.clearMsg();

    const { mode, bladeId, reasonCode } = this.form.getRawValue();

    const obs =
      mode === 'return'
        ? this.api.returnBlade(bladeId)
        : mode === 'reset'
        ? this.api.resetBlade(bladeId)
        : this.api.rejectBlade(bladeId, Number(reasonCode));

    obs
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (r: ApiResp) => {
          if (r?.success) {
            this.success = this.cleanMessage(r.message);
            this.error = null;

            this.completed.emit({
              action: mode === 'return' ? 'Return' : mode === 'reject' ? 'Reject' : 'Reset',
              reference: bladeId,
            });
          } else {
            this.error =
              Array.isArray(r?.errors) && r.errors.length
                ? r.errors.join(' | ')
                : this.cleanMessage(r?.message) || 'ดำเนินการไม่สำเร็จ';
            this.success = null;
          }
          this.startSuccessTimer();
        },
        error: (e: unknown) => {
          this.error = (e as any)?.error?.message ?? 'ดำเนินการไม่สำเร็จ';
          this.success = null;
        },
      });
  }

  clear(): void {
    const mode = this.form.controls.mode.value;
    this.form.reset({
      mode,
      bladeId: '',
      reasonCode:
        mode === 'reject'
          ? this.reasons.find((x) => x.code === 2)?.code ?? this.reasons[0]?.code ?? null
          : null,
    });
    this.clearMsg();
  }

  private clearMsg(): void {
    this.success = null;
    this.error = null;
    if (this.successTimer) {
      clearTimeout(this.successTimer);
      this.successTimer = null;
    }
  }

  private startSuccessTimer(ms = 2400): void {
    if (this.successTimer) clearTimeout(this.successTimer);
    this.successTimer = setTimeout(() => {
      this.success = null;
      this.successTimer = null;
    }, ms);
  }

  private guessTone(name: string): 'info' | 'warn' | 'danger' {
    const s = (name || '').toLowerCase();
    if (s.includes('down') || s.includes('hole') || s.includes('bent') || s.includes('dent')) {
      return 'danger';
    }
    if (s.includes('distance') || s.includes('scrap')) return 'warn';
    return 'info';
  }

  private cleanMessage(m: unknown): string {
    return String(m ?? '')
      .replace(/^\s*\[(?:PREVIEW|DRY RUN)\]\s*/i, '')
      .replace(/\s*–.*/, '')
      .trim();
  }
}