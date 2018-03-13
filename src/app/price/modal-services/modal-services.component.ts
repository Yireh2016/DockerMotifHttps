import { Component, OnChanges, Input , ViewChild } from '@angular/core';
import { DefaultFormComponent } from '../default-form/default-form.component';

declare var jQuery:any;


@Component({
  selector: 'app-modal-services',
  templateUrl: './modal-services.component.html',
  styleUrls: ['./modal-services.component.css']
})
export class ModalServicesComponent implements OnChanges {
  @Input() servicio: string;
  @ViewChild('formulario') formulario : DefaultFormComponent;


  constructor() { }

  ngOnChanges() {
  	console.log(this.servicio);
  }
  showModal(id:string){
  	 jQuery("#"+id).modal("show");
  }

  resetear(){
    this.formulario.borrarMensajes();
  }
}
