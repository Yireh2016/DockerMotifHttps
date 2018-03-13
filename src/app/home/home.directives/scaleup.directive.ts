import { Directive ,  ElementRef } from '@angular/core';

@Directive({
  selector: '[imgScaleUp]',
})
export class ScaleUpDirective  {


  constructor(element: ElementRef) {//set transition time to scale background

  	element.nativeElement.style.transition = '15s';
  	element.nativeElement.style.transform = 'scale(0.7)';
	setTimeout(() => element.nativeElement.style.transform = 'scale(1)',250);

  }



}
