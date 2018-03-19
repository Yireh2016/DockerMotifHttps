import { Component, OnInit ,ViewEncapsulation , HostListener, ViewChild , ElementRef  } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { Router , NavigationStart } from '@angular/router';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';

declare var jQuery:any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  encapsulation: ViewEncapsulation.None
})


export class HeaderComponent implements OnInit {



  @ViewChild("butonMenu", {read: ElementRef}) butonMenu: ElementRef;

  menuIsColapsed=true;
  

	currPos: Number = 0;
    startPos: Number = 0;
    changePos: Number = 50;

	navbar = [ 

		{menu:'Inicio',ruta:'/home'},
		{menu:'Nosotros',ruta:'/about'},
		{menu:'Servicios',ruta:'/services'},
    {menu:'Blog',ruta:'http://blog.motifseguros.com/'},
		{menu:'Cotizaciones',ruta:'/price'},
		{menu:'Clientes',ruta:'/customers'},
		{menu:'Contacto',ruta:'/contact'},
		];



  constructor(private router: Router) { 

  }

 isColapsed(){
   
     this.menuIsColapsed=!this.menuIsColapsed;
   
 }

  ngOnInit() {// cierra el menu al navegar entre paginas en dispositivos moviles
     this.router.events
    .subscribe((event) => {
     if (event instanceof NavigationStart) {
      
      /*if (
          ( jQuery('#barraPrincipal').css("display")==="block" )
          && 
          ( window.innerHeight < 600 || window.innerWidth < 600 )
           ) {
              jQuery('#botonColapse').click();
           }*/
      }
    });

    
  }

 


}

