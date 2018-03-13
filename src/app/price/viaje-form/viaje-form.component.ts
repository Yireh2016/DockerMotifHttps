import { Component, Output , AfterViewChecked , EventEmitter } from '@angular/core';

import { FormGroup,  Validators ,FormBuilder } from '@angular/forms'

declare var  jQuery: any;


@Component({
  selector: 'app-viaje-form',
  templateUrl: './viaje-form.component.html',
  styleUrls: ['./viaje-form.component.css']
})
export class ViajeFormComponent implements AfterViewChecked{


	viajeForm: FormGroup;
	tipoBoleto:string;
	@Output() viajeEventValid = new EventEmitter<boolean>();

  constructor( public fb: FormBuilder) {

		this.viajeForm = fb.group ({
				'edad': [null, Validators.compose([Validators.required,Validators.pattern('^[0-9]+$')])],
				'fechaIda': [null, Validators.compose([Validators.required])],
				'fechaVuelta': [null],
				'tipoViaje': [null, Validators.required]
			})

		 }



  viajeSubmit(){
    var data = this.viajeForm.value;
    this.resetear();
    return data;
  }

  resetear(){
    this.viajeForm.reset();
  }

  validador(){

    if (this.viajeForm.value.tipoViaje==="ida"){


      this.viajeForm.value.fechaVuelta= "No aplica, el viaje es solo ida";

      if (this.viajeForm.valid) {
        return true;
      }else{
        return false;
      }
        


    }else{

      if (this.viajeForm.value.fechaVuelta && this.viajeForm.valid) {
        return true
      }else{
        return false
      }

    }
  }

 inhibidor=false;
 valida:boolean;

  ngAfterViewChecked() {
  
  

  	if ( this.validador() && !this.inhibidor) {
  		this.viajeEventValid.emit(true);
  		this.inhibidor=true;
  		  	}
  	if (this.inhibidor && ! this.validador() ) {
  		this.inhibidor=false;
  		this.viajeEventValid.emit(false);

  	}

  }
}
