import {
  AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild
} from '@angular/core';
import { NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { SearchBoxComponent } from '../../shared/components/search-box/search-box.component';
import { MachineCardComponent } from '../../shared/components/machine-card/machine-card.component';
import { computed, signal } from '@angular/core';
import { ScrollToTopComponent} from '../../shared/components/scroll-to-top/scroll-to-top.component';
import { PlantService } from '../../services/plant.service';


interface Machine { name: string; img: string; } 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, SearchBoxComponent, MachineCardComponent, ScrollToTopComponent ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bgEffects', { static: true }) bgEffects!: ElementRef<HTMLDivElement>;
  @ViewChild('utacLogo', { static: true }) utacLogo!: ElementRef<HTMLDivElement>;
  @ViewChild('heroRoot', { static: true }) heroRoot!: ElementRef<HTMLElement>;
  @ViewChild('ctaBtn', { static: true }) ctaBtn!: ElementRef<HTMLButtonElement>;

  private particleTimer?: number;
  private mouseMoveHandler?: (e: MouseEvent) => void;

  constructor(
    private zone: NgZone, 
    private router: Router,
    private plantSvc: PlantService
  ) {}

  // --------- DATA MC ----------
  keyword = signal('');
  machines = signal<Machine[]>([
    { name: 'Back Grind', img: 'assets/img/back-grind.png' },
    { name: 'Wafer Mount', img: 'assets/img/wafer-mount.png' },
    { name: 'Saw', img: 'assets/img/saw.png' },
    { name: 'Die Attach', img: 'assets/img/die-attach.png' },
    { name: 'Snap Cure', img: 'assets/img/snap-cure.jpg' },
    { name: 'Plasma', img: 'assets/img/plasma.jpg' },
    { name: 'Lead Bond', img: 'assets/img/lead-bond.png' },
    { name: 'Wire Bond"', img: 'assets/img/wire-bond.jpg' },
    { name: 'Mold', img: 'assets/img/mold.jpg' },
    { name: 'Laser mark', img: 'assets/img/laser-mark.jpg' },
  ]);

  filtered = computed<Machine[]>(() => {
    const q = this.keyword().trim().toLowerCase().replace(/\s+/g, ' ');
    if (!q) return this.machines();
  
    return this.machines().filter(m => {
      const name = (m.name ?? '').toLowerCase().replace(/\s+/g, ' ');
      return name.includes(q) || name.replace(/\s+/g, '').includes(q);
    });
  });
  
  onKeywordInput(ev: Event) {
    this.keyword.set((ev.target as HTMLInputElement).value);
  }

  openIfSaw = (name: string): void => {
    if (name?.toLowerCase().includes('saw')) {
      this.router.navigate(['/saw']);  
    }
  };

  // ------- PLANT TEST -------
    get currentPlant() {
      return this.plantSvc.getPlant();
    }

    changePlant(p: string) {
      this.plantSvc.setPlant(p as any);
      alert(`เปลี่ยนเป็น Plant ${p} แล้ว`);
    }

  trackByName = (_: number, item: Machine) => item.name;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.particleTimer = window.setInterval(() => this.createParticle(), 1500);

      this.mouseMoveHandler = (e: MouseEvent) => {
        const rect = this.heroRoot.nativeElement.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

        const shapes =
          this.heroRoot.nativeElement.querySelectorAll<HTMLElement>('.floating-shape');
        shapes.forEach((shape, idx) => {
          const speed = (idx + 1) * 0.3;
          shape.style.transform = `translate(${mouseX * speed * 10}px, ${mouseY * speed * 10}px)`;
        });

        const logo = this.utacLogo.nativeElement;
        logo.style.transform = `translate(${mouseX * 2}px, ${mouseY * 2}px)`;
      };
      this.heroRoot.nativeElement.addEventListener('mousemove', this.mouseMoveHandler!, { passive: true });

      this.ctaBtn.nativeElement.addEventListener('click', (ev: MouseEvent) => {
        ev.preventDefault();
        const btn = this.ctaBtn.nativeElement;
        const ripple = document.createElement('span');
        const r = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height);
        ripple.style.cssText =
          `position:absolute;left:${ev.clientX - r.left - size / 2}px;top:${ev.clientY - r.top - size / 2}px;` +
          `width:${size}px;height:${size}px;background:rgba(255,255,255,.3);border-radius:50%;` +
          `transform:scale(0);animation:ripple .6s linear;pointer-events:none;`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      }, { passive: false });

      if (!document.getElementById('ripple-keyframes')) {
        const style = document.createElement('style');
        style.id = 'ripple-keyframes';
        style.textContent = `@keyframes ripple { to { transform: scale(4); opacity: 0; } }`;
        document.head.appendChild(style);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.particleTimer) clearInterval(this.particleTimer);
    if (this.mouseMoveHandler) {
      this.heroRoot?.nativeElement.removeEventListener('mousemove', this.mouseMoveHandler);
    }
  }

  private createParticle() {
    const container = this.bgEffects.nativeElement;
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 4 + 's';
    p.style.animationDuration = Math.random() * 2 + 3 + 's';
    container.appendChild(p);
    setTimeout(() => p.remove(), 5000);
  }
}
