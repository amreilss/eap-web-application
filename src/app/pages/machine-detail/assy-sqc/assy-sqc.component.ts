import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assy-sqc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assy-sqc.component.html',
  styleUrls: ['./assy-sqc.component.less'],
})
export class AssySqcComponent implements OnChanges {
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

  close(){ this.closed.emit(); }
}
