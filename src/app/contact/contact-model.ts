export class ContactModel {

		constructor(
		public name: string,
		public last: string,
		public email: string,
		public codigoArea: string,
		public phone: number,
		public comments?: string
		){}

}
