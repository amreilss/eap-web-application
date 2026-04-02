import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.less'],
})
export class RecipeListComponent implements OnChanges {
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
