import { Component, Output , AfterViewChecked , EventEmitter } from '@angular/core';

import { FormGroup,  Validators ,FormBuilder } from '@angular/forms'


@Component({
  selector: 'app-salud-form',
  templateUrl: './salud-form.component.html',
  styleUrls: ['./salud-form.component.css']
})
export class SaludFormComponent implements AfterViewChecked{


	saludForm: FormGroup;
	//tipoBoleto:string;
	@Output() saludEventValid = new EventEmitter<boolean>();

  constructor( private fb: FormBuilder) {

		this.saludForm = fb.group ({
				'fecha': [null, Validators.required]
			})

		 }

 

  saludSubmit(){
    var data = this.saludForm.value;

    this.resetear();
    return data;
  }

  resetear(){
    this.saludForm.reset();
  }

 inhibidor=false;

  ngAfterViewChecked() {
  	if (this.saludForm.valid && !this.inhibidor) {
  		console.log(this.saludForm.valid);
  		this.saludEventValid.emit(true);
  		this.inhibidor=true;
  		  	}
  	if (this.inhibidor && !this.saludForm.valid ) {
  		this.inhibidor=false;
  		this.saludEventValid.emit(false);

  	}

  }
}






