import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InversionesFormComponent } from './inversiones-form.component';

describe('InversionesFormComponent', () => {
  let component: InversionesFormComponent;
  let fixture: ComponentFixture<InversionesFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InversionesFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InversionesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
