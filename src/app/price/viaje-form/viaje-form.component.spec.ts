import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViajeFormComponent } from './viaje-form.component';

describe('ViajeFormComponent', () => {
  let component: ViajeFormComponent;
  let fixture: ComponentFixture<ViajeFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViajeFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViajeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
