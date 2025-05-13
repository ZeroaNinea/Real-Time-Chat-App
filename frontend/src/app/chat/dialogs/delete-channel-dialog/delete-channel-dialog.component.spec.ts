import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteChannelDialogComponent } from './delete-channel-dialog.component';

describe('DeleteChannelDialogComponent', () => {
  let component: DeleteChannelDialogComponent;
  let fixture: ComponentFixture<DeleteChannelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteChannelDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteChannelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
