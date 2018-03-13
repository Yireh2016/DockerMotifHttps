import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent implements OnInit {

	name = 'Motif Seguros';
	//name = 'ANGEL ';
	sumPresentation =`Invierte en tu futuro`;


  constructor() { }

  ngOnInit() {
  }

}
