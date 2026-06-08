import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validates a South African ID number (13 digits)
   */
  static saID(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => //the actual validator that Angular will run => "Angular gives me a field, I decide if it's valid or not"
      { 
      const value = control.value;
      if (!value) return null; // Don't validate if the field is empty

      // Basic regex for 13 digits
      const idRegex = /^[0-9]{13}$/;
      const isValid = idRegex.test(value);

      return isValid ? null : { invalidSAID: true };
    };
  }

  /**
   * Validates South African Mobile numbers
   * Matches 10-digit format (082...) or international (+27...)
   */
  static saPhone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      // Regex matches: 
      // 1. Starting with 0 followed by 6, 7, or 8 and then 8 digits
      // 2. Starting with +27 followed by 6, 7, or 8 and then 8 digits
      const phoneRegex = /^((\+27|0)[6-8][0-9]{8})$/;
      const isValid = phoneRegex.test(value);

      return isValid ? null : { invalidSAPhone: true };
    };
  }
}

/* 
1. Receives input field
2. Reads its value
3. If empty → ignore
4. If not empty → validate format
5. Return null (valid) OR error (invalid)
*/