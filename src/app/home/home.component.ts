import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';



@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(    private titleService: Title, private metaService: Meta) { }

  ngOnInit() {

    this.metaService.addTag({      name: 'description',  content: 'La mejor solución en seguros internacionales y nacionales en Venezuela. Ofrecemos excelentes planes de inversión adaptados a tus necesidades'    });
    this.metaService.addTag({      name: 'keywords',  content: 'Inversiones, Seguros, Pólizas, Protección, Viajes, Bienestar, Salud, Automovil, Polizas, Polizas de viaje, Polizas de seguros, Polizas de vida, Seguro Internacional , Segurs internacionales, Seguros en dólares, Seguros en dolares, Seguro Internacional en Venezuela, Seguro Internacional en Caracas, Seguros de Viaje, Seguros de autos, Seguros de carro, Seguros en Venezuela , Atrio Seguros, Seguros de vida, Aseguradora, Aseguradoras'});
  }


    
}
