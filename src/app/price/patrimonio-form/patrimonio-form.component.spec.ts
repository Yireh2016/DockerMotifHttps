import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatrimonioFormComponent } from './patrimonio-form.component';

describe('PatrimonioFormComponent', () => {
  let component: PatrimonioFormComponent;
  let fixture: ComponentFixture<PatrimonioFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PatrimonioFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatrimonioFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
