import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenameChannelDialogComponent } from './rename-channel-dialog.component';

describe('RenameChannelDialogComponent', () => {
  let component: RenameChannelDialogComponent;
  let fixture: ComponentFixture<RenameChannelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenameChannelDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenameChannelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
