
export interface OrderItem {
  id: string;
  code: string;
  ncm: string;
  description: string;
  unit: string;
  weight: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Contact {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  phone: string;
  email: string;
}

export interface Address {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CustomerInfo {
  name: string;
  document: string; // CNPJ / CPF
  rg: string;
  stateRegistration: string;
  municipalRegistration: string;
  phone: string;
  email: string;
  billingAddress: Address;
  collectionAddress: Address;
  deliveryAddress: Address;
  /** Optional address field used in simplified budget forms */
  address?: string;
  /** Optional contact name field used for display in lists */
  contactName?: string;
}

export type OrderClassification = 'Venda' | 'Demonstração' | 'Exposição' | 'Consignação' | 'Doação' | 'Outros';

export interface Order {
  id: string;
  date: string;
  salesperson: string;
  /** Classification is optional to support simplified forms */
  classification?: OrderClassification;
  classificationOther?: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  customer: CustomerInfo;
  /** Contacts are optional to support simplified forms */
  contacts?: Contact[];
  items: OrderItem[];

  // Totals & Currency (Made optional to support simplified budget forms)
  globalValue1?: number; // Sum of items
  discountTotal?: number;
  freightValue?: number;
  globalValue2?: number; // Final total
  currencyConversion?: 'Real' | 'Euro' | 'US$';
  exchangeRate?: number;
  totalInBRL?: number;

  // Commercial
  minBilling?: boolean;
  minBillingValue?: number;
  downPayment?: number; // Valor de Entrada
  finalCustomer?: boolean;
  paymentTerms: string;
  deliveryTime: string;

  // Bidding (Licitação - Optional)
  biddingNumber?: string;
  biddingDate?: string;
  commitmentNumber?: string; // Empenho
  commitmentDate?: string;

  notes: string;

  // Additional fields used in forms and export utilities
  carrier?: string;
  validity: string;
  totalWeight: number;
  totalAmount: number;
  shippingCost: number;
  validUntil: string;
  paymentMethod?: string;
  shippingType?: 'CIF' | 'FOB';
  discountGlobal?: number;

  // PDF Storage
  pdf_url?: string; // URL do PDF salvo no Supabase Storage
  pdf_generated_at?: string; // Data de geração do PDF

  // User Tracking
  created_by?: string; // Email do usuário que criou o pedido
  created_at?: string; // Data/hora de criação (ISO string)
}
