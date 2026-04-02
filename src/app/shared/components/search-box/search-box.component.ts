import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-search-box',
  standalone: true,
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.less'],
})
export class SearchBoxComponent {
  @Input() placeholder = 'Search...';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  
  onInput(event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.value = input?.value ?? '';
    this.valueChange.emit(this.value);
  }
  

  
}
