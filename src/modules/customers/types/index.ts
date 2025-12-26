import type { Customer } from '../schemas/customerSchema';
import type { CreateCustomerInput, UpdateCustomerInput } from '../schemas/customerValidation';

export type { Customer, CreateCustomerInput, UpdateCustomerInput };

export interface CustomerRecord extends Customer {
  ownerName?: string | null;
  ownerEmail?: string | null;
  leadName?: string | null;
}

