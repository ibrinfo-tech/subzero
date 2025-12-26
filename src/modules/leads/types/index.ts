import type { Lead, NewLead } from '../schemas/leadSchema';
import type { CreateLeadInput, UpdateLeadInput, LeadStatus, LeadSource } from '../schemas/leadValidation';

export type { Lead, NewLead, CreateLeadInput, UpdateLeadInput, LeadStatus, LeadSource };

/**
 * Lead record with related data (for display)
 */
export interface LeadRecord extends Lead {
  ownerName?: string | null;
  ownerEmail?: string | null;
}



