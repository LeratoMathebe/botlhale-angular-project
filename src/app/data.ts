//this service acts like a shared storage. Questionnaire saves the data and the Results page just reads the data

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {

  responses: { name: string; age: string; food: string }[] = []; //array to store responses by the users
}
