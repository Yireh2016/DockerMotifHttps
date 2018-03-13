import { Component, OnInit,ViewChild    } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { FormGroup,  Validators ,FormBuilder } from '@angular/forms'
import { Meta } from '@angular/platform-browser';


import {ContactModel} from './contact-model';
import { environment } from '../../environments/environment';
import { ModalComponent } from './modal/modal.component';



@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {

	@ViewChild('modalSuccess') modalSuccess: ModalComponent;
	@ViewChild('modalError') modalError: ModalComponent;



	constructor(private http: HttpClient, private fb: FormBuilder,private metaService: Meta) {

		this.contactForm = fb.group ({
				'name': [null, Validators.compose([Validators.required,Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ]+$')])],
				'last': [null, Validators.compose([Validators.required,Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ]+$')])],
				'email': [null, Validators.compose([Validators.required,Validators.email])],
				'codigoArea': [null, Validators.required],
				'phone': [null, Validators.compose([Validators.required,Validators.minLength(7),Validators.pattern('^[0-9]+$')])],
				'comments': [null]
			})

		 }



	ngOnInit(): void {
	this.metaService.addTag({      name: 'description',  content: 'Si tienes dudas, comentarios o deseas que te contactemos visita nuestra sección de contacto. Queremos conocerte!!!'    });
    this.metaService.addTag({      name: 'keywords',  content: 'Seguros, inversiones'});



		       this.modalError._modalBody="Favor contacte al administrador enviando un correo a  support@SwordVoice.com ";
    		   this.modalError._modalTitle="Hubo un eror enviando tus datos"; 
    		   this.modalError._modalId="error";


    		   this.modalSuccess._modalBody=`Su Información fue enviada exitosamente, te estaré contactando muy pronto.

		         Si lo deseas me puedes contactar via WhatsApp a través del 0412-6994625.

		         Muchas Gracias !!!`;
    		   this.modalSuccess._modalTitle="Información Procesada"; 
    		   this.modalSuccess._modalId="success";

	}

 	contactForm: FormGroup;
 	sending=false;
	contacto = new ContactModel ("","","","",null,"");
	headers = new HttpHeaders({
   		 'Content-Type': 'application/json'
  	});


	//get name() { return this.contactForm.get('name'); }

	onSubmit(post)  {

	this.sending=true;
		this.contacto=post;
		console.log("contacto detalles: " + JSON.stringify(post) + " el dominio es " + environment.domain);
		
		 
		this.http.post(environment.domain+'/email',JSON.stringify(this.contacto),{headers:this.headers})
		.subscribe(
	 		 	res => {
	           console.log(res);

	          
	           this.sending=false;

	           this.modalSuccess.showModal("success");
	           this.contactForm.reset();//resetea el formulario

	           
	         },
	         err => {

	           console.log(err);
	           this.sending=false;
	           this.contactForm.reset();//resetea el formulario	

	           this.modalError.showModal("error");
	           
	    }); 
	}
}

 
