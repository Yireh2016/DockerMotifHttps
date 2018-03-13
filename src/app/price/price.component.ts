import { Component, OnInit , ViewChild } from '@angular/core';
import { ModalServicesComponent } from './modal-services/modal-services.component'
import { Meta } from '@angular/platform-browser';


@Component({
  selector: 'app-price',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.css']
})
export class PriceComponent implements OnInit {
  @ViewChild('modal') modal: ModalServicesComponent;
  selectedService:string;

  constructor(private metaService: Meta) { }



  ngOnInit() {


    this.metaService.addTag({      name: 'description',  content: 'Ofrecemos el servicio de cotización sin compromisos vía correo electrónico, VISITANOS!!! '    });
    this.metaService.addTag({      name: 'keywords',  content: 'Precio de seguros,Cotizaciones de seguros, Cotización en línea'});

  }
  intrucciones=[
    "Escoge el servicio de tu preferencia",
    "Rellena el formulario",
    "Envía tu información",
    "La cotizacion te estará llegando a la brevedad posible al correo electrónico proporcionado"];

  servicios=[
    
    "Viajes",
    "Seguro de Vida",
    "Salud",
    "Auto",
    "Patrimonios"];

  modalForm(servicio:string){
  	console.log(servicio);
    this.modal.showModal("modalPrice");
  }




}

  

