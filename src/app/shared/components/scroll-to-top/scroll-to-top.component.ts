import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-to-top.component.html',
  styleUrls: ['./scroll-to-top.component.less']
})
export class ScrollToTopComponent {
  isVisible = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isVisible = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
