import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactionCountComponent } from './reaction-count.component';

describe('ReactionCountComponent', () => {
  let component: ReactionCountComponent;
  let fixture: ComponentFixture<ReactionCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactionCountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReactionCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
