import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, OnChanges, SimpleChanges, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

export type DownloadRecipeResult = {
  ok: boolean;
  message?: string;
  data?: any;
};

type DownloadForm = FormGroup<{
  source: FormControl<string | null>;
  recipeFolder: FormControl<string | null>;
  utacLotId: FormControl<string | null>;
  referenceBom: FormControl<string | null>;
  recipeName: FormControl<string | null>;
  fileName: FormControl<string | null>;
  lotDieId: FormControl<string | null>;
  libDieId: FormControl<string | null>;
  lotWaferSize: FormControl<string | null>;
  libWaferSize: FormControl<string | null>;
  z1BladeId: FormControl<string | null>;
  z1Initial: FormControl<string | null>;
  z1Remain: FormControl<string | null>;
  z2BladeId: FormControl<string | null>;
  z2Initial: FormControl<string | null>;
  z2Remain: FormControl<string | null>;
  dressZ1: FormControl<string | null>;
  dressZ2: FormControl<string | null>;
  intervalZ1: FormControl<string | null>;
  intervalZ2: FormControl<string | null>;
  emplId: FormControl<string | null>;
  remarks: FormControl<string | null>;
}>;

@Component({
  selector: 'app-download-recipe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './download-recipe.component.html',
  styleUrls: ['./download-recipe.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadRecipeComponent implements OnChanges {
  @Input() open = false;
  @Input() equipID = '';

  /** ไม่ให้ parent ปิดเองหลังสำเร็จ (ดีฟอลต์ false = ไม่ emit) */
  @Input() emitDownloaded = false;

  /** หน่วงเวลา “ปลอม” ให้โหลดไว ๆ (ms). ตั้งเป็น 0 = เร็วทันที */
  @Input() fakeDelayMs = 120;

  @Output() closed = new EventEmitter<void>();
  @Output() downloaded = new EventEmitter<DownloadRecipeResult>();

  loading = false;
  success: string | null = null;
  error: string | null = null;

  recipeNameOptions: string[] = [];
  lotDieIdOptions: string[] = [];

  form: DownloadForm = new FormGroup({
    source: new FormControl<string | null>('Latest in Machine'),
    recipeFolder: new FormControl<string | null>(null),
    utacLotId: new FormControl<string | null>(null),
    referenceBom: new FormControl<string | null>(null),
    recipeName: new FormControl<string | null>(null, { validators: [Validators.required] }),
    fileName: new FormControl<string | null>(null),
    lotDieId: new FormControl<string | null>(null, { validators: [Validators.required] }),
    libDieId: new FormControl<string | null>(null),
    lotWaferSize: new FormControl<string | null>(null),
    libWaferSize: new FormControl<string | null>(null),
    z1BladeId: new FormControl<string | null>(null),
    z1Initial: new FormControl<string | null>(null),
    z1Remain: new FormControl<string | null>(null),
    z2BladeId: new FormControl<string | null>(null),
    z2Initial: new FormControl<string | null>(null),
    z2Remain: new FormControl<string | null>(null),
    dressZ1: new FormControl<string | null>(null),
    dressZ2: new FormControl<string | null>(null),
    intervalZ1: new FormControl<string | null>(null),
    intervalZ2: new FormControl<string | null>(null),
    emplId: new FormControl<string | null>(null),
    remarks: new FormControl<string | null>(null),
  });

  /** ปิดได้ก็ต่อเมื่อไม่ได้โหลดอยู่ และยังไม่มี success */
  get canClose(): boolean {
    return !this.loading && !this.success;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.error = this.success = null;

        if (this.recipeNameOptions.length === 0) {
          this.recipeNameOptions = [
            `${this.equipID || 'EQ'}-STD`,
            `${this.equipID || 'EQ'}-GOLDEN`,
            `${this.equipID || 'EQ'}-QUAL`
          ];
        }
        if (this.lotDieIdOptions.length === 0) {
          this.lotDieIdOptions = ['DIE-01', 'DIE-02', 'DIE-03', 'DIE-04'];
        }

        document.body.classList.add('popup-open');

        setTimeout(() => {
          const el = document.querySelector<HTMLSelectElement>('select[formcontrolname=recipeName]');
          el?.focus();
        });
      } else {
        document.body.classList.remove('popup-open');
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.open && this.canClose) this.onClose();
  }

  onBackdrop() {
    if (this.canClose) this.onClose();
  }

  onClose() {
    if (!this.canClose) return;
    this.closed.emit();
  }

  clear() {
    const keepSource = this.form.controls.source.value;
    this.form.reset({
      source: keepSource ?? 'Latest in Machine',
      recipeFolder: null,
      utacLotId: null,
      referenceBom: null,
      recipeName: null,
      fileName: null,
      lotDieId: null,
      libDieId: null,
      lotWaferSize: null,
      libWaferSize: null,
      z1BladeId: null,
      z1Initial: null,
      z1Remain: null,
      z2BladeId: null,
      z2Initial: null,
      z2Remain: null,
      dressZ1: null,
      dressZ2: null,
      intervalZ1: null,
      intervalZ2: null,
      emplId: null,
      remarks: null,
    });
    this.error = this.success = null;
  }

  submit() {
    this.error = this.success = null;

    if (this.form.controls.recipeName.invalid || this.form.controls.lotDieId.invalid) {
      this.form.markAllAsTouched();
      this.error = 'กรุณาเลือก Recipe Name และ Lot Die ID';
      return;
    }

    this.loading = true;

    // ====== MOCK DOWNLOAD: เร็วมาก / ปรับได้ด้วย fakeDelayMs ======
    const done = () => {
      this.loading = false;
      this.success = 'ดาวน์โหลดสำเร็จ';

      if (this.emitDownloaded) {
        this.downloaded.emit({
          ok: true,
          message: 'Downloaded',
          data: { equipID: this.equipID, ...this.form.getRawValue() }
        });
      }
    };

    if (this.fakeDelayMs <= 0) {
      // ให้ UI ได้ตั้งค่า loading ก่อน แล้วค่อยสำเร็จใน microtask (แทบจะทันที)
      queueMicrotask(done);
    } else {
      setTimeout(done, this.fakeDelayMs);
    }
    // ============================================
  }
}
