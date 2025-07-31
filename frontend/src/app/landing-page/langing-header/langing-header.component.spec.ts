import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LangingHeaderComponent } from './langing-header.component';

describe('LangingHeaderComponent', () => {
  let component: LangingHeaderComponent;
  let fixture: ComponentFixture<LangingHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LangingHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LangingHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
