export interface DemoBusiness {
  id: string;
  name: string;
  description: string;
  business_type: string;
  gst_registration_type: 'regular' | 'composition' | 'unregistered' | 'input_service_distributor' | 'casual_taxable' | 'non_resident';
  taxpayer_scheme: 'regular' | 'composition_goods' | 'composition_services' | 'qrmp';
  gstin: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  state_code: string;
  pincode: string;
  phone: string;
  email: string;
  preferred_language: 'en' | 'hi' | 'bn' | 'mr';
  financial_year_start_month: number;
  profile: {
    owner_name: string;
    owner_email: string;
    owner_phone: string;
  };
}

export const DEMO_BUSINESSES: DemoBusiness[] = [
  {
    id: 'shop-freshmart-001',
    name: 'FreshMart Grocery Store',
    description: 'Independent neighbourhood grocery retailer',
    business_type: 'Kirana & FMCG Retail',
    gst_registration_type: 'regular',
    taxpayer_scheme: 'regular',
    gstin: '27ABCDF1234G1ZX',
    address_line1: 'Shop No. 15, MG Road',
    address_line2: 'Near Bank of Baroda',
    city: 'Pune',
    state: 'Maharashtra',
    state_code: '27',
    pincode: '411001',
    phone: '+91 98765 43210',
    email: 'demo@freshmart.in',
    preferred_language: 'en',
    financial_year_start_month: 4,
    profile: {
      owner_name: 'Ramesh Kulkarni',
      owner_email: 'ramesh@freshmart.in',
      owner_phone: '+91 98765 43210',
    },
  },
  {
    id: 'shop-grandmart-002',
    name: 'GrandMart Supermarket',
    description: 'Multi-category supermarket',
    business_type: 'Supermarket & Multi-category Retail',
    gst_registration_type: 'regular',
    taxpayer_scheme: 'regular',
    gstin: '27XYZAB5678H2ZY',
    address_line1: 'Unit 101, A Wing, Pune Central Mall',
    address_line2: 'Satara Road, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    state_code: '27',
    pincode: '411043',
    phone: '+91 98765 43211',
    email: 'demo@grandmart.in',
    preferred_language: 'en',
    financial_year_start_month: 4,
    profile: {
      owner_name: 'Sanjay Desai',
      owner_email: 'sanjay@grandmart.in',
      owner_phone: '+91 98765 43211',
    },
  },
];

export function getDemoBusiness(shopId: string): DemoBusiness | undefined {
  return DEMO_BUSINESSES.find((b) => b.id === shopId);
}

export const DEMO_BUSINESS_IDS = DEMO_BUSINESSES.map((b) => b.id);
