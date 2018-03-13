import { Component, OnInit , Input , ViewChild , AfterViewChecked } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormGroup,  Validators ,FormBuilder } from '@angular/forms'
import { ViajeFormComponent } from '../viaje-form/viaje-form.component';
import { AutoFormComponent } from '../auto-form/auto-form.component';
import { SaludFormComponent } from '../salud-form/salud-form.component';
import { PatrimonioFormComponent } from '../patrimonio-form/patrimonio-form.component';
import { InversionesFormComponent } from '../inversiones-form/inversiones-form.component';



@Component({
  selector: 'app-default-form',
  templateUrl: './default-form.component.html',
  styleUrls: ['./default-form.component.css']
})
export class DefaultFormComponent implements OnInit , AfterViewChecked {

	@Input() serv2Form:string; 
	@ViewChild('viaje') viaje : ViajeFormComponent;
	@ViewChild('auto') auto : AutoFormComponent;
	@ViewChild('salud') salud : SaludFormComponent;
	@ViewChild('patrimonio') patrimonio : PatrimonioFormComponent;
	@ViewChild('inversion') inversion : InversionesFormComponent;

	valido=false;
	errorSend=false;
	successSend=false;

	defaultForm: FormGroup;

  constructor( private fb: FormBuilder, private http: HttpClient) {

		this.defaultForm = fb.group ({
				'name': [null, 
					Validators.compose([
						Validators.required,
						Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ]+$')])],
				'last': [null, 
					Validators.compose([
						Validators.required,
						Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ]+$')])],
				'email': [null, 
					Validators.compose([
						Validators.required,
						Validators.email])],
				'codigoArea': [null, Validators.required],
				'phone': [null, 
					Validators.compose([
						Validators.required,
						Validators.minLength(7),
						Validators.pattern('^[0-9]+$')])]
			})

		 }


  ngOnInit() {
  }

   ngAfterViewChecked() {
	   	
  		
  		
  	}	

  	isValid(val){
  		this.valido=val;
  		console.log("isValid " + val);
  	}

  	borrarMensajes(){
  		this.errorSend=false;
	    this.successSend=false;
	    this.defaultForm.reset();
	    if (this.viaje) {
	    	this.viaje.resetear();
	    }
	    else if (this.auto) {
			this.auto.resetear();
		} else if (this.salud) {
			this.salud.resetear();
		}else if (this.inversion) {
			this.inversion.resetear();
		}
	    

  	}




sending=false;
headers = new HttpHeaders({
   		 'Content-Type': 'application/json'
  	});

cotizacion:string;

	onSubmit(post)  {

		var data;
		var result2 : string;
		var result1: string;
		var result : string;
		this.defaultForm.reset();
		if (this.serv2Form==="Viajes") {
			data=this.viaje.viajeSubmit();
		}else if (this.serv2Form==="Auto") {
			data=this.auto.autoSubmit();
		} else if (this.serv2Form==="Salud") {
			data=this.salud.saludSubmit();
		}else if (this.serv2Form==="Seguro de Vida") {
			this.serv2Form="Inversiones"
			data=this.inversion.inversionSubmit();
		}


		this.sending=true;



		if (data) {
			result1=JSON.stringify(post).replace("}","");
			result2=JSON.stringify(data).replace("{",",");
			result=result1.concat(result2)
		}else{
			result=JSON.stringify(post);
		}




		console.log("result1 " + result1 + " result2 " + result2);
		console.log("result " + result);


		//this.cotizacion=JSON.parse(result[0]);
		
		 
		this.http.post(environment.domain+'/emailServ/'+this.serv2Form,result,{headers:this.headers})
		.subscribe(
	 		 	res => {
	           console.log("Correo enviado exitosamente " + res);

	          
	           this.sending=false;
	           this.successSend=true;


	           //this.modalSuccess.showModal("success");

	           
	         },
	         err => {

	           console.log(err);
	           this.sending=false;
	           this.errorSend=true;

	           //this.modalError.showModal("error");
	           
	    }); 
	}
}
