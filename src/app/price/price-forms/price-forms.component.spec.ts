import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceFormsComponent } from './price-forms.component';

describe('PriceFormsComponent', () => {
  let component: PriceFormsComponent;
  let fixture: ComponentFixture<PriceFormsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PriceFormsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PriceFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
