import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateFriendListComponent } from './private-friend-list.component';

describe('PrivateFriendListComponent', () => {
  let component: PrivateFriendListComponent;
  let fixture: ComponentFixture<PrivateFriendListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateFriendListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivateFriendListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
