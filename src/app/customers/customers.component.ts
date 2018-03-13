import { Component, OnInit  } from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser} from '@angular/common';
import { Meta } from '@angular/platform-browser';




 const CONT_CLIENTES =2;
 const CONT_ALIADOS =5;

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],

})



export class CustomersComponent implements OnInit {
  

  constructor(@Inject(PLATFORM_ID) platformId: string,private metaService: Meta) { 

    this.testBrowser = isPlatformBrowser(platformId);
  	

  }

 /*ngOnInit() {

    //setTimeout(x =>this.animacionClientes(this.contClientes), this.triggerClientes);

        
      
    

  }*/

   ngOnInit(){

    this.metaService.addTag({      name: 'description',  content: 'Presentámos a nuestros clientes y aliados mas  importantes. Creámos vículos para toda la vida  '    });
    this.metaService.addTag({      name: 'keywords',  content: 'Clientes,Aliados'});


     if (this.testBrowser) {
      setTimeout( () => this.animacionClientes(),this.triggerClientes);
      setTimeout( () => this.animacionAliados(),this.triggerAliados);
                //this is only executed on the browser
            }
    //this.flip();
    //setTimeout(x =>this.flip(),2000);
    //this.flip();
   // console.log("flips on init");
  }


testBrowser: boolean;

contAliados=0;
aliadoIn=false;
cargaPrincipalAliado=true;
triggerAliados=500;//representa el tiempo de disparar la animacion clientes, la primera vez es 500ms
aliado= new Array;


contClientes=0;
customerIn=false;
cargaPrincipalCliente=true;
triggerClientes=500;//representa el tiempo de disparar la animacion clientes, la primera vez es 500ms
cliente= new Array;


  animacionClientes(){    

    if ( this.cargaPrincipalCliente) {//comienza la animacion 500ms despues de cargar la pagina
      //console.log("comienza animacion inicial cliente 1, despues de 1000 ms ");
        this.triggerClientes=6000;//despues de la primera vez coloca la animacion en 6 seg
      setInterval(() => this.animacionClientes(), this.triggerClientes);

        this.contClientes=this.runClientes(this.contClientes);
        this.cargaPrincipalCliente=false;//espera 500ms solo al cargar la pagina 

      }else {//la animacion dura 6 segundos despues de la primera vez en adelante
        this.contClientes=this.runClientes(this.contClientes);
       }
  }

  runClientes(i:number){//

      if (i>= CONT_CLIENTES) {//si el numero de clientes sobrepasa la cantidad de clientes reinicia
        i=0;//se reinicia el numero de cliente
      }
      i++; //numero de  customer

      this.cliente[i]=this.customerIn=true;//muestra el customer 
      //console.log("comienza animacion para cliente " + i + " " + this.cliente[i]);

      setTimeout( () => { 
        this.cliente[i]=this.customerIn=false; 
       // console.log("finaliza animacion de cliente  " + (i) + " " + this.cliente[i]);
         } , 5000);//quita el customer despues de 5500 ms
      

      return i;
    


  }





    animacionAliados(){    

    if ( this.cargaPrincipalAliado) {//comienza la animacion 500ms despues de cargar la pagina
        this.triggerAliados=6000;//despues de la primera vez coloca la animacion en 6 seg
      setInterval(() => this.animacionAliados(), this.triggerAliados);

        this.contAliados=this.runAliados(this.contAliados);
        this.cargaPrincipalAliado=false;//espera 500ms solo al cargar la pagina 

      }else {//la animacion dura 6 segundos despues de la primera vez en adelante
        this.contAliados=this.runAliados(this.contAliados);
       }
  }

  runAliados(i:number){//

      if (i>= CONT_ALIADOS) {//si el numero de clientes sobrepasa la cantidad de clientes reinicia
        i=0;//se reinicia el numero de cliente
      }
      i++; //numero de  customer

      this.aliado[i]=this.aliadoIn=true;//muestra el customer 

      setTimeout( () => { 
        this.aliado[i]=this.aliadoIn=false; 
         } , 5000);//quita el customer despues de 5500 ms
      

      return i;
    
  }

 



}

