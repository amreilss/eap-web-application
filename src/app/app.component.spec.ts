import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  // ปรับ assertion ให้เข้ากับ app shell ปัจจุบัน (เช่น มี router-outlet)
  it('should render app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('router-outlet')).not.toBeNull();
  });
});
