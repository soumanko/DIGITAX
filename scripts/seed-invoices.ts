#!/usr/bin/env -npx tsx
/**
 * Demo Invoice Generator for DIGITAX
 * Generates sales and purchase invoices for both demo businesses.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { createInvoiceServer } from '@/lib/supabase/server-db';
import { money, roundMoney, formatINR } from '@/lib/decimal';
import Decimal from 'decimal.js';

const supabase = createServiceClient();

interface InvoiceLineItem {
  description: string;
  hsn_sac_code: string;
  quantity: string;
  unit_price: string;
  gst_rate: number;
  is_inter_state: boolean;
}

interface DemoInvoice {
  shop_id: string;
  user_id: string;
  direction: 'sales' | 'purchase';
  invoice_type: 'sales_tax_invoice' | 'purchase_tax_invoice';
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  supplier_name: string;
  supplier_gstin: string | null;
  buyer_name: string;
  customer_gstin: string | null;
  place_of_supply: string;
  is_inter_state: boolean;
  items: InvoiceLineItem[];
  payment_status: 'paid' | 'unpaid' | 'partial';
  review_state: 'confirmed' | 'pending_review';
  amount_paid: string;
  notes: string | null;
}

// FreshMart invoice data (60-80 invoices across Oct 2026 - Mar 2027)
const FRESHMART_SALES_INVOICES: Omit<DemoInvoice, 'shop_id' | 'user_id' | 'supplier_name' | 'supplier_gstin'>[] = [
  {
    direction: 'sales',
    invoice_type: 'sales_tax_invoice',
    invoice_number: 'FM/OUT/2026/1001',
    invoice_date: '2026-10-02',
    due_date: '2026-10-02',
    buyer_name: 'Sai Tea Stall',
    customer_gstin: null,
    place_of_supply: '27',
    is_inter_state: false,
    items: [
      { description: 'Sunflower Cooking Oil (5L Tin)', hsn_sac_code: '1512', quantity: '2', unit_price: '850.00', gst_rate: 5, is_inter_state: false },
      { description: 'Basmati Rice Premium (5kg Bag)', hsn_sac_code: '1006', quantity: '5', unit_price: '420.00', gst_rate: 5, is_inter_state: false },
      { description: 'Tea Powder (250g)', hsn_sac_code: '0902', quantity: '10', unit_price: '120.00', gst_rate: 5, is_inter_state: false },
    ],
    payment_status: 'paid',
    review_state: 'confirmed',
    amount_paid: '0', // calculated below
    notes: null,
  },
  // ... more invoices will be added programmatically
];

// Generate sales invoices for FreshMart
function generateFreshMartSalesInvoices(): DemoInvoice[] {
  const invoices: DemoInvoice[] = [];
  const customers = [
    { name: 'Sai Tea Stall', gstin: null },
    { name: 'Shree Restaurant', gstin: '27ABCPR3344Q1ZM' },
    { name: 'Pune Office Supplies', gstin: '27AAEPS5678P1ZS' },
    { name: 'Kirana Corner', gstin: '27AAEPK1234R1ZJ' },
    { name: 'Quick Bites Cafe', gstin: '27AXEPK5678L1ZT' },
    { name: 'Verma Traders', gstin: '27AAEPV4567M1ZK' },
    { name: 'Green Leaf Cafe', gstin: '27AEZPG8901T1ZP' },
    { name: 'City Medical Store', gstin: '27ABEPM2345N1ZB' },
    { name: 'Office Cafe', gstin: '27AAEOC6789P1ZV' },
    { name: 'Singh Brothers', gstin: '27ABEPS1234Q1ZL' },
    { name: 'Morning Star Bakery', gstin: '27ABEPB5678R1ZF' },
    { name: 'Lotus Catering Services', gstin: '27ABEPL7890S1ZD' },
    { name: 'Shree Hardware Store', gstin: '27ABEPS9012T1ZC' },
  ];
  
  const products = [
    { description: 'Sunflower Cooking Oil (5L Tin)', hsn: '1512', price: '850.00', rate: 5 },
    { description: 'Basmati Rice Premium (5kg Bag)', hsn: '1006', price: '420.00', rate: 5 },
    { description: 'Tea Powder (250g)', hsn: '0902', price: '120.00', rate: 5 },
    { description: 'Wheat Flour (10kg Bag)', hsn: '1101', price: '320.00', rate: 0 },
    { description: 'Toor Dal (1kg)', hsn: '0713', price: '110.00', rate: 0 },
    { description: 'Cooking Salt (1kg)', hsn: '2501', price: '20.00', rate: 0 },
    { description: 'Sugar (1kg)', hsn: '1701', price: '45.00', rate: 0 },
    { description: 'Milk (1 liter)', hsn: '0401', price: '60.00', rate: 0 },
    { description: 'Bread Loaf', hsn: '1905', price: '40.00', rate: 0 },
    { description: 'Packaged Snacks', hsn: '2106', price: '50.00', rate: 18 },
    { description: 'Dishwashing Liquid (500ml)', hsn: '3402', price: '120.00', rate: 18 },
    { description: 'Bath Soap (100g)', hsn: '3401', price: '45.00', rate: 18 },
  ];
  
  let invNum = 1001;
  let dateOffset = 0;
  
  for (let i = 0; i < 70; i++) {
    const customer = customers[i % customers.length];
    const numItems = 2 + (i % 4); // 2-5 items per invoice
    const selectedProducts = [];
    
    for (let j = 0; j < numItems; j++) {
      selectedProducts.push(products[(i * 3 + j) % products.length]);
    }
    
    const items = selectedProducts.map((p, idx) => ({
      description: p.description,
      hsn_sac_code: p.hsn,
      quantity: (1 + (idx % 3)).toString(),
      unit_price: p.price,
      gst_rate: p.rate,
      is_inter_state: false,
    }));
    
    const lines = generateInvoiceLines(items);
    const subtotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.taxable_value)), new Decimal(0));
    const cgstTotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.cgst_amount)), new Decimal(0));
    const sgstTotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.sgst_amount)), new Decimal(0));
    const igstTotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.igst_amount)), new Decimal(0));
    const totalTax = cgstTotal.plus(sgstTotal).plus(igstTotal);
    const totalAmount = subtotal.plus(totalTax);
    
    const paymentStatuses = ['paid', 'unpaid', 'partial'];
    const paymentStatus = paymentStatuses[i % 3];
    
    let amountPaid = '0';
    if (paymentStatus === 'paid') {
      amountPaid = totalAmount.toFixed(2);
    } else if (paymentStatus === 'partial') {
      amountPaid = totalAmount.mul(0.5).toFixed(2);
    }
    
    const date = new Date('2026-10-01');
    date.setDate(date.getDate() + dateOffset);
    const dateStr = date.toISOString().split('T')[0];
    dateOffset += (i % 3) + 1; // advance 1-3 days per invoice
    
    invoices.push({
      direction: 'sales',
      invoice_type: 'sales_tax_invoice',
      invoice_number: `FM/OUT/2026/${invNum++}`,
      invoice_date: dateStr,
      due_date: dateStr,
      buyer_name: customer.name,
      customer_gstin: customer.gstin,
      place_of_supply: '27',
      is_inter_state: false,
      items,
      payment_status: paymentStatus as 'paid' | 'unpaid' | 'partial',
      review_state: i % 10 === 0 ? 'pending_review' : 'confirmed',
      amount_paid: amountPaid,
      notes: null,
    });
  }
  
  return invoices;
}

function generateFreshMartPurchaseInvoices(): DemoInvoice[] {
  const invoices: DemoInvoice[] = [];
  const suppliers = [
    { name: 'Apex FMCG Distributors LLP', gstin: '27AABCA1234F1Z5' },
    { name: 'Hindustan Consumer Products Agency', gstin: '27AAACH2702H1ZQ' },
    { name: 'Britannia Biscuits Super Stockist', gstin: '27AAACB0345K1Z9' },
    { name: 'Pune Dairy Distributors', gstin: '27AAXPD4567M1ZK' },
    { name: 'Maharashtra Beverages Supplier', gstin: '27AAXMB8901P1ZS' },
    { name: 'Clean & Fresh Wholesalers', gstin: '27AAECF2345N1ZB' },
    { name: 'Fresh Produce Wholesaler', gstin: null },
    { name: 'Household Essentials Distributor', gstin: '27AAEHE6789T1ZF' },
    { name: 'Spice King Distributors', gstin: '27AAXSK1234Q1ZM' },
    { name: 'Tata Tea Distributors', gstin: '27AAACT2702H1ZQ' },
    { name: 'Edible Oils Wholesale', gstin: '27AAEOE5678L1ZV' },
  ];
  
  const products = [
    { description: 'Sunflower Cooking Oil (15L Tin x 10)', hsn: '1512', price: '2100.00', rate: 5 },
    { description: 'Basmati Rice Premium (25kg Bag x 10)', hsn: '1006', price: '2400.00', rate: 5 },
    { description: 'Tea Powder (500g x 20)', hsn: '0902', price: '220.00', rate: 5 },
    { description: 'Wheat Flour (50kg Bag x 5)', hsn: '1101', price: '1200.00', rate: 0 },
    { description: 'Toor Dal (5kg x 10)', hsn: '0713', price: '550.00', rate: 0 },
    { description: 'Cooking Salt (1kg x 20)', hsn: '2501', price: '22.00', rate: 0 },
    { description: 'Sugar (5kg x 10)', hsn: '1701', price: '220.00', rate: 0 },
    { description: 'Milk (1 liter x 30)', hsn: '0401', price: '60.00', rate: 0 },
    { description: 'Packaged Snacks (Assorted x 10)', hsn: '2106', price: '100.00', rate: 18 },
    { description: 'Dishwashing Liquid (500ml x 12)', hsn: '3402', price: '120.00', rate: 18 },
  ];
  
  let invNum = 881;
  let dateOffset = 0;
  
  for (let i = 0; i < 35; i++) {
    const supplier = suppliers[i % suppliers.length];
    const numItems = 2 + (i % 3);
    const selectedProducts = [];
    
    for (let j = 0; j < numItems; j++) {
      selectedProducts.push(products[(i * 2 + j) % products.length]);
    }
    
    const items = selectedProducts.map((p, idx) => ({
      description: p.description,
      hsn_sac_code: p.hsn,
      quantity: (1 + (idx % 2)).toString(),
      unit_price: p.price,
      gst_rate: p.rate,
      is_inter_state: false,
    }));
    
    const lines = generateInvoiceLines(items);
    const subtotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.taxable_value)), new Decimal(0));
    const cgstTotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.cgst_amount)), new Decimal(0));
    const sgstTotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.sgst_amount)), new Decimal(0));
    const igstTotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.igst_amount)), new Decimal(0));
    const totalTax = cgstTotal.plus(sgstTotal).plus(igstTotal);
    const totalAmount = subtotal.plus(totalTax);
    
    const paymentStatuses = ['paid', 'unpaid', 'partial'];
    const paymentStatus = paymentStatuses[i % 4];
    
    let amountPaid = '0';
    if (paymentStatus === 'paid') {
      amountPaid = totalAmount.toFixed(2);
    } else if (paymentStatus === 'partial') {
      amountPaid = totalAmount.mul(0.4).toFixed(2);
    }
    
    const date = new Date('2026-10-01');
    date.setDate(date.getDate() + dateOffset);
    const dateStr = date.toISOString().split('T')[0];
    dateOffset += 2 + (i % 3);
    
    const isPendingReview = i % 7 === 0;
    
    invoices.push({
      direction: 'purchase',
      invoice_type: 'purchase_tax_invoice',
      invoice_number: `FM/IN/2026/${invNum++}`,
      invoice_date: dateStr,
      due_date: new Date(new Date(dateStr).setDate(new Date(dateStr).getDate() + 15)).toISOString().split('T')[0],
      buyer_name: 'FreshMart Grocery Store',
      customer_gstin: '27ABCDF1234G1ZX',
      place_of_supply: '27',
      is_inter_state: false,
      supplier_name: supplier.name,
      supplier_gstin: supplier.gstin,
      items,
      payment_status: paymentStatus as 'paid' | 'unpaid' | 'partial',
      review_state: isPendingReview ? 'pending_review' : 'confirmed',
      amount_paid: amountPaid,
      notes: isPendingReview ? 'Pending verification of HSN codes' : null,
    });
  }
  
  return invoices;
}

async function seedFreshMartInvoices(shopId: string, userId: string) {
  console.log('  Generating FreshMart invoices...');
  
  const salesInvoices = generateFreshMartSalesInvoices();
  const purchaseInvoices = generateFreshMartPurchaseInvoices();
  const allInvoices = [...salesInvoices, ...purchaseInvoices];
  
  let success = 0;
  let failed = 0;
  
  for (const inv of allInvoices) {
    try {
      await createInvoiceServer(shopId, userId, {
        ...inv,
        supplier_name: inv.supplier_name || 'FreshMart Grocery Store',
        supplier_gstin: inv.supplier_gstin,
      }, inv.items);
      success++;
    } catch (err: any) {
      console.error(`    Failed to create invoice ${inv.invoice_number}:`, err.message);
      failed++;
    }
  }
  
  console.log(`    Created ${success} invoices, ${failed} failed`);
  return { sales: salesInvoices.length, purchase: purchaseInvoices.length };
}

export { generateFreshMartSalesInvoices, generateFreshMartPurchaseInvoices, seedFreshMartInvoices };
