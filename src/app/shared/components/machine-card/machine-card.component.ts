import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-machine-card',
  standalone: true,
  templateUrl: './machine-card.component.html',
  styleUrls: ['./machine-card.component.less'],
})
export class MachineCardComponent {
  @Input() name = '';
  @Input() img = '';
  @Output() click = new EventEmitter<void>();
}
