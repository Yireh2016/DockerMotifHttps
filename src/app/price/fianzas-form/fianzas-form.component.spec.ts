import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FianzasFormComponent } from './fianzas-form.component';

describe('FianzasFormComponent', () => {
  let component: FianzasFormComponent;
  let fixture: ComponentFixture<FianzasFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FianzasFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FianzasFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
