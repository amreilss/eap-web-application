import { Component, signal, computed } from '@angular/core';
import { NgFor } from '@angular/common';
import { SearchBoxComponent } from '../../shared/components/search-box/search-box.component';
import { MachineCardComponent } from '../../shared/components/machine-card/machine-card.component';
import { ScrollToTopComponent } from '../../shared/components/scroll-to-top/scroll-to-top.component';

@Component({
  selector: 'app-operations',
  standalone: true,
  imports: [NgFor, SearchBoxComponent, MachineCardComponent, ScrollToTopComponent],
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.less']
})
export class OperationsComponent {
  keyword = '';
  machines = signal([
    { name: 'Back Grind', img: 'assets/img/saw.png' },
    { name: 'Saw', img: 'assets/img/saw.png' },
    { name: 'W', img: 'assets/img/saw.png' },
  ]);

  filtered = computed(() =>
    this.keyword
      ? this.machines().filter(m =>
          m.name.toLowerCase().includes(this.keyword.toLowerCase())
        )
      : this.machines()
  );

  scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
}
