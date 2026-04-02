import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, OnChanges, SimpleChanges, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

type FolderType = 'PRODUCTION' | 'QUAL' | 'PROCESS' | 'EQUIPMENT' | 'R&D' | 'SWR';

type UploadForm = FormGroup<{
  type: FormControl<string | null>;
  model: FormControl<string | null>;
  swRev: FormControl<string | null>;

  /** เปลี่ยนจากไฟล์อัปโหลด → ช่องกรอกชื่อไฟล์ */
  recipeFilename: FormControl<string>;
  recipeName: FormControl<string>;
  autoLoad: FormControl<string | null>;
  utacLotId: FormControl<string | null>;
  referenceBom: FormControl<string | null>;

  dieSeq: FormControl<string | null>;
  dieId: FormControl<string | null>;
  waferSizeAl: FormControl<string | null>;
  waferSizeMc: FormControl<string | null>;

  folder: FormControl<FolderType>;

  uploadAsGolden: FormControl<boolean>;
  releaseForDownload: FormControl<boolean>;
  frozenRecipe: FormControl<boolean>;
  processSpec: FormControl<string | null>;

  createdBy: FormControl<string | null>;
  verifiedBy: FormControl<string | null>;
  verifiedPass: FormControl<string | null>;

  revision: FormControl<string>;
  z1: FormControl<string | null>;
  z2: FormControl<string | null>;
}>;

@Component({
  selector: 'app-upload-recipe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upload-recipe.component.html',
  styleUrls: ['./upload-recipe.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadRecipeComponent implements OnChanges {
  /** เปิด/ปิดป็อปอัป */
  @Input() open = false;
  /** ค่า EquipID ที่แสดงด้านบน (readonly) */
  @Input() equipID = '';
  /** ตั้งชื่อเรซิพีเริ่มต้น เช่น EQ-001-STD */
  @Input() defaultRecipeName = '';

  /** กดปิด (กากบาท/พื้นหลัง/ปุ่ม Cancel) */
  @Output() closed = new EventEmitter<void>();
  /** ส่งผลลัพธ์เมื่ออัปโหลดสำเร็จ */
  @Output() submitted = new EventEmitter<{ ok: true; message: string }>();

  // UI state
  loading = false;
  error: string | null = null;
  success: string | null = null;

  // dropdown data
  readonly dieSeqOptions = ['A', 'B', 'C', 'D'];
  readonly dieIdOptions = ['1', '2', '3', '4'];

  form: UploadForm = new FormGroup({
    type: new FormControl<string | null>(null),
    model: new FormControl<string | null>(null),
    swRev: new FormControl<string | null>(null),

    // เปลี่ยนจาก file: FormControl<File|null> → recipeFilename: string
    recipeFilename: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(255),
        // กันอักขระต้องห้ามทั่วไป: <>:"/\|?* และ control chars
        Validators.pattern(/^[^<>:"/\\|?*\u0000-\u001F]+$/),
      ],
    }),
    recipeName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    autoLoad: new FormControl<string | null>(null),
    utacLotId: new FormControl<string | null>(null),
    referenceBom: new FormControl<string | null>(null),

    dieSeq: new FormControl<string | null>(null),
    dieId: new FormControl<string | null>(null),
    waferSizeAl: new FormControl<string | null>(null),
    waferSizeMc: new FormControl<string | null>(null),

    folder: new FormControl<FolderType>('PRODUCTION', { nonNullable: true }),

    uploadAsGolden: new FormControl<boolean>(false, { nonNullable: true }),
    releaseForDownload: new FormControl<boolean>(false, { nonNullable: true }),
    frozenRecipe: new FormControl<boolean>(false, { nonNullable: true }),
    processSpec: new FormControl<string | null>(null),

    createdBy: new FormControl<string | null>(null),
    verifiedBy: new FormControl<string | null>(null),
    verifiedPass: new FormControl<string | null>(null),

    revision: new FormControl<string>('', { nonNullable: true }),
    z1: new FormControl<string | null>(null),
    z2: new FormControl<string | null>(null),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        // set up when opened
        this.error = this.success = null;
        if (this.defaultRecipeName) {
          this.form.controls.recipeName.setValue(this.defaultRecipeName);
        }
        document.body.classList.add('popup-open'); // lock page scroll
        // focus first important field
        setTimeout(() => {
          const el = document.querySelector<HTMLInputElement>('#recipeNameInput');
          el?.focus();
        }, 0);
      } else {
        document.body.classList.remove('popup-open');
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.open) this.onClose();
  }

  onClose() {
    this.closed.emit();
  }

  /** utils: paste/clear สำหรับชื่อไฟล์ */
  async pasteFromClipboard() {
    try {
      const txt = (await navigator.clipboard?.readText?.()) ?? '';
      this.form.controls.recipeFilename.setValue(txt.trim());
      this.form.controls.recipeFilename.markAsTouched();
    } catch {
      // เงียบไว้ก็พอ (บางเครื่อง/สิทธิ์ใช้งาน clipboard ไม่ได้)
    }
  }

  clearRecipeFilename() {
    this.form.controls.recipeFilename.setValue('');
    this.form.controls.recipeFilename.markAsTouched();
  }

  clear() {
    const keepFolder = this.form.controls.folder.value;
    this.form.reset({
      recipeFilename: '',
      recipeName: this.defaultRecipeName || '',
      folder: keepFolder,
      uploadAsGolden: false,
      releaseForDownload: false,
      frozenRecipe: false,
      revision: '',
    });
    this.error = this.success = null;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      return;
    }
    if (!this.equipID) {
      this.error = 'ไม่พบ Equip ID';
      return;
    }
    this.loading = true;
    this.error = this.success = null;

    // TODO: เรียก API จริง
    setTimeout(() => {
      this.loading = false;
      this.success = 'อัปโหลดสำเร็จ';
      this.submitted.emit({ ok: true, message: 'Uploaded' });
      // ปิดเองหรือให้ผู้ใช้กดปิดก็ได้
      // this.onClose();
    }, 800);
  }
}
