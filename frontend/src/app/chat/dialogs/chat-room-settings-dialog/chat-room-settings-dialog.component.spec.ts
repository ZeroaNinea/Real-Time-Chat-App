import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatRoomSettingsDialogComponent } from './chat-room-settings-dialog.component';

describe('ChatRoomSettingsDialogComponent', () => {
  let component: ChatRoomSettingsDialogComponent;
  let fixture: ComponentFixture<ChatRoomSettingsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatRoomSettingsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatRoomSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
