import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule , ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { PageHeaderComponent } from './home/page-header/page-header.component';
import { BackgroundComponent } from './home/background/background.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { FooterComponent } from './footer/footer.component';
import { ServicesComponent } from './services/services.component';
import { CustomersComponent } from './customers/customers.component';
import { ContactComponent } from './contact/contact.component';
import { ScaleUpDirective } from './home/home.directives/scaleup.directive';
import { ModalComponent } from './contact/modal/modal.component';
import { PriceComponent } from './price/price.component';
import { PriceFormsComponent } from './price/price-forms/price-forms.component';
import { SaludFormComponent } from './price/salud-form/salud-form.component';
import { AutoFormComponent } from './price/auto-form/auto-form.component';
import { InversionesFormComponent } from './price/inversiones-form/inversiones-form.component';
import { FianzasFormComponent } from './price/fianzas-form/fianzas-form.component';
import { ViajeFormComponent } from './price/viaje-form/viaje-form.component';
import { PatrimonioFormComponent } from './price/patrimonio-form/patrimonio-form.component';
import { ModalServicesComponent } from './price/modal-services/modal-services.component';
import { DefaultFormComponent } from './price/default-form/default-form.component';
import { TestComponent } from './test/test.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    PageHeaderComponent,
    BackgroundComponent,
    HomeComponent,
    AboutComponent,
    ServicesComponent,
    CustomersComponent,
    ContactComponent,
    FooterComponent,
    ScaleUpDirective,
    ModalComponent,
    PriceComponent,
    PriceFormsComponent,
    SaludFormComponent,
    AutoFormComponent,
    InversionesFormComponent,
    FianzasFormComponent,
    ViajeFormComponent,
    PatrimonioFormComponent,
    ModalServicesComponent,
    DefaultFormComponent,
    TestComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'universal-demo-v5' }),
    HttpClientModule,
    HttpModule,
    BrowserAnimationsModule,
    BrowserTransferStateModule, 
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forRoot([
      { path: 'home', component: HomeComponent },
      { path: 'about', component: AboutComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'services', component: ServicesComponent },
      { path: 'price', component: PriceComponent },
      { path: '**', redirectTo: '/home', pathMatch: 'full' },// ruta redireccionada
     ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
