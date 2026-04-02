import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-special-download',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './special-download.component.html',
  styleUrls: ['./special-download.component.less'],
})
export class SpecialDownloadComponent implements OnChanges {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if ('open' in changes) {
      const on = !!this.open;
      document.documentElement.classList.toggle('no-scroll', on);
      document.body.classList.toggle('no-scroll', on);
    }
  }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement)?.classList.contains('md-overlay')) this.close();
  }

  close() { this.closed.emit(); }
}
