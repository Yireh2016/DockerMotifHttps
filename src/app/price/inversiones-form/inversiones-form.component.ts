import { Component, Output , AfterViewChecked , EventEmitter } from '@angular/core';

import { FormGroup,  Validators ,FormBuilder } from '@angular/forms'


@Component({
  selector: 'app-inversiones-form',
  templateUrl: './inversiones-form.component.html',
  styleUrls: ['./inversiones-form.component.css']
})
export class InversionesFormComponent implements AfterViewChecked{


	inversionForm: FormGroup;
	//tipoBoleto:string;
	@Output() inversionEventValid = new EventEmitter<boolean>();

  constructor( private fb: FormBuilder) {

		this.inversionForm = fb.group ({
				'edad':  [null, Validators.compose([Validators.required,Validators.pattern('^[0-9]+$')])],
				'tipofumador': [null, Validators.required],
			})

		 }

 

  inversionSubmit(){
    var data = this.inversionForm.value;

    this.resetear();
    return data;
  }

  resetear(){
    this.inversionForm.reset();
  }

 inhibidor=false;

  ngAfterViewChecked() {
  	if (this.inversionForm.valid && !this.inhibidor) {
  		console.log(this.inversionForm.valid);
  		this.inversionEventValid.emit(true);
  		this.inhibidor=true;
  		  	}
  	if (this.inhibidor && !this.inversionForm.valid ) {
  		this.inhibidor=false;
  		this.inversionEventValid.emit(false);

  	}

  }
}









