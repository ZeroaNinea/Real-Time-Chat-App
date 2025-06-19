import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateUserCardComponent } from './private-user-card.component';

describe('PrivateUserCardComponent', () => {
  let component: PrivateUserCardComponent;
  let fixture: ComponentFixture<PrivateUserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateUserCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivateUserCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
