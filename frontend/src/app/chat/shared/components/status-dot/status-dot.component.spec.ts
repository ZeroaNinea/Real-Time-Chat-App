import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusDotComponent } from './status-dot.component';

describe('StatusDotComponent', () => {
  let component: StatusDotComponent;
  let fixture: ComponentFixture<StatusDotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusDotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusDotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
