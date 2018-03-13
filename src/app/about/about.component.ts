import { Component, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})




export class AboutComponent implements OnInit {

  constructor(private metaService: Meta) {

  }


  ngOnInit(){
    setTimeout(x =>this.flip(),200);
    
    this.metaService.addTag({      name: 'description',  content: 'Somos un grupo de asesores financieros con gran experiencia en el mercado. Nuestro compromiso es tu seguridad y bienestar'    });
    this.metaService.addTag({      name: 'keywords',  content: 'Consultores,Finanzas,Asesores financieros'});
  }


  slogan=`¡Tu Bienestar es nuestro compromiso!`;
  cardFront=`Somos un grupo de asesores en planificación estratégica financiera con una amplia experiencia en el mercado asegurador en Venezuela y el resto del mundo. Nuestras especialidades incluyen el área de protección de familias, empresas y bienes.
Nuestros aliados están respaldados por la Lloyd’s of London (reaseguradora más prestigiosa a nivel global) y que a su vez se encuentran entre las principales empresas más importantes de los Estados Unidos, amparado por el Índice Bursátil S&P 500 ( Indicador que mide la confiabilidad empresarial ). 
`;

  cardBack=`  Estamos comprometidos con nuestros clientes para que puedan lograr su libertad financiera a través del respaldo de empresas nacionales e internacionales, con novedosos productos de seguros e inversiones que se adaptan a tus necesidades. Pensando siempre en la protección de tu familia, empresas y bienes.`

  /*Soy un asesor de seguros con 5 años de experiencia en el mercado Venezolano, 
  asesorando y asegunado centenares de familias y trabajadores, a través de una gran variedad de 
  empresas aseguradoras nacionales e internacionales.`*/

  cambio=false;
  
  flip(){

  	this.cambio=!this.cambio;

  }

   
}
