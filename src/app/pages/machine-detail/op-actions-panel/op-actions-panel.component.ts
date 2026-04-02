// + OnChanges เพื่อ sync ค่าจากภายนอก
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';

export type GroupKey = 'PROD' | 'MAINT' | null;
export interface ActionBtn { key: string; label: string; disabled?: boolean; }

@Component({
  selector: 'op-actions-panel',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './op-actions-panel.component.html',
  styleUrls: ['./op-actions-panel.component.less'],
})
export class OpActionsPanelComponent implements OnChanges {
  @Input() productionActions: ActionBtn[] = [];
  @Input() maintenanceActions: ActionBtn[] = [];
  @Input() expanded: GroupKey = null;
  @Input() showHeaders = true;

  @Output() select = new EventEmitter<string>();

  expandedInternal: GroupKey = null;

  ngOnChanges(changes: SimpleChanges) {
    if ('expanded' in changes) {
      this.expandedInternal = this.expanded;
    }
  }

  toggle(group: GroupKey) {
    this.expandedInternal = (this.expandedInternal === group) ? null : group;
  }

  onSelect(key: string, disabled?: boolean) {
    if (!disabled) this.select.emit(key);
  }
}
