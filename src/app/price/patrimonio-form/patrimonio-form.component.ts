import { Component, Output  , EventEmitter , OnInit } from '@angular/core';



@Component({
  selector: 'app-patrimonio-form',
  templateUrl: './patrimonio-form.component.html',
  styleUrls: ['./patrimonio-form.component.css']
})
export class PatrimonioFormComponent implements OnInit {


	@Output() patriEventValid = new EventEmitter<boolean>();

  constructor( ) {

		

		 }
 ngOnInit(){
  	this.patriEventValid.emit(true);

 }






}
