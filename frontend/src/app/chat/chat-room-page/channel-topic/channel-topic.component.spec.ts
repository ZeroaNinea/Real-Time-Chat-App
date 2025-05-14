import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelTopicComponent } from './channel-topic.component';

describe('ChannelTopicComponent', () => {
  let component: ChannelTopicComponent;
  let fixture: ComponentFixture<ChannelTopicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelTopicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelTopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
