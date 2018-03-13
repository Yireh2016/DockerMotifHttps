import { Component, OnInit , HostListener } from '@angular/core';
import { Meta } from '@angular/platform-browser';


const NUM_SERVICIOS = 10;
const 	OFFSET = 0;


@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {

    flechaArriba:boolean;
  	flechaAbajo=true;
  	direccion:boolean;//true abajo false arriba
  	offsetAnterior=0;
    winSize=window.innerHeight;
  	//paso:number=this.controlPaso(window.pageYOffset);


  constructor(private metaService: Meta) { }



ngOnInit(){

	
    this.metaService.addTag({      name: 'description',  content: 'Tenemos una gran variedad de servicios y productos que se pueden adaptar a tus necesidades y las de tus familiares'    });
    this.metaService.addTag({      name: 'keywords',  content: 'Servicios,productos'});

}

  @HostListener('window:scroll', ['$event']) onScrollEvent($event){
  
  console.log(window.pageYOffset);


  		this.controlFlechas();
  		
  	}

  @HostListener('window:resize', ['$event']) onResize(event) {
      this.winSize=window.innerHeight;
      this.controlFlechas();
      console.log("winSize "+this.winSize);
  }



  	controlPaso(puntero:number,direccion:boolean,winSize:number){
  		
  		
  		var resultado=(puntero-OFFSET)%(winSize);
  		if (resultado<0) {
  			resultado=0;
  			puntero=puntero+OFFSET;
  		}

  		if (direccion) {//si se le dio click a  bajando

  			
  			console.log("resultado es " + resultado);
  			if (resultado===0) {
  				if (puntero-OFFSET<0) {
  					window.scrollTo(0, 	OFFSET+winSize);
  				}else{
  					window.scrollTo(0, 
  						OFFSET+winSize*(((puntero-OFFSET)/winSize)+1)
  					);
  				}
  				
  			}else {		

  				window.scrollTo(0, OFFSET+((winSize)*(Math.ceil((puntero-OFFSET)/(winSize)))));
  				console.log("(Math.ceil((puntero-OFFSET)/(winSize)))) "+ (Math.ceil((puntero-OFFSET)/(winSize))));
  			}

  		}else{//si se le dio click a subiendo

        if (Math.floor(  (puntero-OFFSET)/(winSize)  )===0 || (puntero-OFFSET)/(winSize) === 1) {
            window.scrollTo(0,0);
            return;
          }

    			if (resultado===0) {
    				window.scrollTo(0, OFFSET+((winSize)*((puntero-OFFSET)/(winSize)-1)));
    			}else{          
              window.scrollTo(0, OFFSET+((winSize)*(Math.floor((puntero-OFFSET)/(winSize)))));
    			}
  		}

  		

 

  	}

  	controlFlechas(){
  		if (window.pageYOffset <= OFFSET) {
	  		this.flechaArriba=false;
	  	}else{
	  		this.flechaArriba=true;
	  	}

	  	if (window.pageYOffset>=window.innerHeight*(NUM_SERVICIOS-1)) {
	  		this.flechaAbajo=false;
	  	}else{
	  		this.flechaAbajo=true;
	  	}

  	}

  	up(){

  			this.direccion=false; 
  			this.controlPaso(window.pageYOffset,this.direccion,this.winSize);
  			

  	}

  	down(){ 
  			this.direccion=true;
  			this.controlPaso(window.pageYOffset,this.direccion,this.winSize);
  			
  		 	 			
  	}

  	

/*
	pantalla 1 off 0 o 50 numserv 5
	p 2 off 950
	p3 off 1850 
	p4 off 2750
	p5 off 3650




*/

}
