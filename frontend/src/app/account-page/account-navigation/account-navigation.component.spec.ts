import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountNavigationComponent } from './account-navigation.component';

describe('AccountNavigationComponent', () => {
  let component: AccountNavigationComponent;
  let fixture: ComponentFixture<AccountNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountNavigationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
