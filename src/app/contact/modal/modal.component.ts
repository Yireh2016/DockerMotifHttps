import { Component, OnInit, Input } from '@angular/core';
declare var jQuery:any;


@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {

	 modalTitle:string;
	 modalBody:string;
	 modalId:string;

  /*constructor( modalTitle:string,modalBody:string) { 
	this.modalTitle=modalTitle;
	this.modalTitle=modalTitle;

  }*/

  set _modalTitle(titulo:string){

  	this.modalTitle=titulo;
  }

	set _modalId(id:string){

  	this.modalId=id;
  }




    set _modalBody(cuerpo:string){

    	this.modalBody=cuerpo;

  }

  showModal(id:string){
  	 jQuery("#"+id).modal("show");
  }
  ngOnInit() {
  }
  
}
