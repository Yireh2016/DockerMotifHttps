import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaludFormComponent } from './salud-form.component';

describe('SaludFormComponent', () => {
  let component: SaludFormComponent;
  let fixture: ComponentFixture<SaludFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaludFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaludFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
