import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import {
  BladeActionApiService,
  ApiResp,
  Preview,
  ResetPayload,
} from '../../../../services/blade-action-api.service';

type FormT = FormGroup<{ bladeId: FormControl<string> }>;

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetComponent {
  @Input() plant!: 'UTL1' | 'UTL2' | 'UTL3';

  @Output() completed = new EventEmitter<{
    action: 'Reset';
    bladeId?: string;
    plant?: 'UTL1' | 'UTL2' | 'UTL3';
  }>();

  form: FormT = new FormGroup({
    bladeId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
  });

  loading = false;
  msg = '';
  err = '';
  preview: ResetPayload | null = null;

  constructor(private api: BladeActionApiService) {}

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

    this.api.resetBlade(id).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (r: ApiResp<number> & Preview<ResetPayload>) => {
        if (r?.success) {
          this.msg = String(r.message ?? '');

          this.completed.emit({
            action: 'Reset',
            bladeId: id,
            plant: this.plant,
          });
        } else {
          this.err =
            (Array.isArray((r as any)?.errors) && (r as any).errors.length)
              ? (r as any).errors.join(' | ')
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