import { Component, Output , AfterViewChecked , EventEmitter } from '@angular/core';

import { FormGroup,  Validators ,FormBuilder } from '@angular/forms'


@Component({
  selector: 'app-auto-form',
  templateUrl: './auto-form.component.html',
  styleUrls: ['./auto-form.component.css']
})
export class AutoFormComponent implements AfterViewChecked{


	autoForm: FormGroup;
	//tipoBoleto:string;
	@Output() autoEventValid = new EventEmitter<boolean>();

  constructor( private fb: FormBuilder) {

		this.autoForm = fb.group ({
				'cedulaTipo': [null, Validators.required],
				'cedula': [ 
          null, 
          Validators.compose([ 
             Validators.required,
             Validators.pattern('^[0-9]+$'),
             Validators.minLength(6) 
          ]) ],
				'fecha': [null, Validators.required],
				'marca':[ null,Validators.required],
				'modelo':[null,Validators.required],
				'year':[
          null,
            Validators.compose([
              Validators.required,
              Validators.pattern('^[0-9]+$'),
              Validators.maxLength(4),
              Validators.minLength(4) 
              ])             
          ],
				'version':[null],
				'tipoCaja':[null,Validators.required]
			})

		 }

 

  autoSubmit(){
    var data = this.autoForm.value;

    this.resetear();
    return data;
  }

  resetear(){
    this.autoForm.reset();
  }

 inhibidor=false;

  ngAfterViewChecked() {
  	if (this.autoForm.valid && !this.inhibidor) {
  		console.log(this.autoForm.valid);
  		this.autoEventValid.emit(true);
  		this.inhibidor=true;
  		  	}
  	if (this.inhibidor && !this.autoForm.valid ) {
  		this.inhibidor=false;
  		this.autoEventValid.emit(false);

  	}

  }
}
