#!/usr/bin/env -npx tsx
/**
 * GrandMart Invoice Generator
 */

import { createServiceClient } from '@/lib/supabase/server';
import { createInvoiceServer } from '@/lib/supabase/server-db';
import { money, roundMoney } from '@/lib/decimal';
import Decimal from 'decimal.js';

const supabase = createServiceClient();

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
  items: Array<{
    description: string;
    hsn_sac_code: string;
    quantity: string;
    unit_price: string;
    gst_rate: number;
    is_inter_state: boolean;
  }>;
  payment_status: 'paid' | 'unpaid' | 'partial';
  review_state: 'confirmed' | 'pending_review';
  amount_paid: string;
  notes: string | null;
}

function calculateGSTComponents(
  taxableValue: string,
  gstRate: number,
  isInterState: boolean
) {
  const rate = new Decimal(gstRate);
  const taxable = new Decimal(taxableValue);
  const totalTax = taxable.mul(rate).div(100);
  
  if (isInterState) {
    return { cgst: '0.00', sgst: '0.00', igst: roundMoney(totalTax).toString() };
  } else {
    const halfTax = totalTax.div(2);
    return { cgst: roundMoney(halfTax).toString(), sgst: roundMoney(halfTax).toString(), igst: '0.00' };
  }
}

function generateInvoiceLines(items: Array<{
  description: string;
  hsn_sac_code: string;
  quantity: string;
  unit_price: string;
  gst_rate: number;
  is_inter_state: boolean;
}>) {
  return items.map((item, index) => {
    const taxable = new Decimal(item.quantity).mul(new Decimal(item.unit_price));
    const roundedTaxable = roundMoney(taxable).toString();
    
    const { cgst, sgst, igst } = calculateGSTComponents(roundedTaxable, item.gst_rate, item.is_inter_state);
    const totalTax = new Decimal(cgst).plus(new Decimal(sgst)).plus(new Decimal(igst));
    const totalAmount = new Decimal(roundedTaxable).plus(totalTax);
    
    return {
      line_number: index + 1,
      description: item.description,
      hsn_sac_code: item.hsn_sac_code,
      quantity: item.quantity,
      unit: 'PCS',
      unit_of_measure: 'PCS',
      unit_price: item.unit_price,
      discount: '0.00',
      discount_amount: '0.00',
      taxable_value: roundedTaxable,
      gst_rate: item.gst_rate.toString(),
      cgst_rate: item.is_inter_state ? '0.00' : (item.gst_rate / 2).toFixed(2),
      cgst_amount: cgst,
      sgst_rate: item.is_inter_state ? '0.00' : (item.gst_rate / 2).toFixed(2),
      sgst_amount: sgst,
      igst_rate: item.is_inter_state ? item.gst_rate.toString() : '0.00',
      igst_amount: igst,
      cess_rate: '0.00',
      cess_amount: '0.00',
      total_tax_amount: totalTax.toFixed(2),
      total_amount: totalAmount.toFixed(2),
    };
  });
}

const GM_CUSTOMERS = [
  { name: 'Royal Spice Restaurant', gstin: '27AAXPR1234Q1ZW', inter_state: false },
  { name: 'Tech Solutions Pvt Ltd', gstin: '27AACTC9876R1ZM', inter_state: false },
  { name: 'City Mart Retail', gstin: '27AAXCM3456T1ZP', inter_state: false },
  { name: 'Green Valley Cafe', gstin: '27AAEGC7890S1ZT', inter_state: false },
  { name: 'Pune IT Services', gstin: '27AACTP4567L1ZK', inter_state: false },
  { name: 'Singh Family', gstin: null, inter_state: false },
  { name: 'Star Bakery & Confectionery', gstin: '27AAESB5678K1ZL', inter_state: false },
  { name: 'Metro Medical Store', gstin: '27AAEMM9012N1ZX', inter_state: false },
  { name: 'Desai Office Complex', gstin: '27AAEDC3456F1ZB', inter_state: false },
  { name: 'Patel Household', gstin: null, inter_state: false },
  { name: 'Spice Junction Restaurant', gstin: '27AAESP7890M1ZD', inter_state: false },
  { name: 'Quick Stop Retail', gstin: '27AAEQR1234B1ZP', inter_state: false },
  { name: 'Verma Office', gstin: '27AAEVV3456N1ZT', inter_state: false },
  { name: 'Patel Household', gstin: null, inter_state: false },
  { name: 'Daily Needs Store', gstin: '27AAEDN5678R1ZF', inter_state: false },
  { name: 'Food Junction Cafe', gstin: '27AAEFQ7890P1ZS', inter_state: false },
  { name: 'Business Center Pvt Ltd', gstin: '27AABCB9012Q1ZH', inter_state: false },
  { name: 'Rao Household', gstin: null, inter_state: false },
  { name: 'Golden Spoon Restaurant', gstin: '27AAEGS3456T1ZX', inter_state: false },
];

const GM_SUPPLIERS = [
  { name: 'Hindustan Unilever Distributors', gstin: '27AAACH2702H1ZQ' },
  { name: 'ITC Foods Supply Chain', gstin: '27AAACT5555P1ZG' },
  { name: 'Amul Dairy Supply', gstin: '27AAECA1234M1ZW', inter_state: true },
  { name: 'PepsiCo India Beverages', gstin: '27AAACP3344L1ZC' },
  { name: 'Haldirams Snacks Supply', gstin: '27AAACH9999N1ZD' },
  { name: 'Rice King Wholesalers', gstin: '27AAXRK3456T1ZH' },
  { name: 'Frozen Foods India', gstin: '27AAEFF7890R1ZX' },
  { name: 'Bakery Supplies Co', gstin: '27AAEBS1234K1ZI' },
  { name: 'Personal Care Distributors', gstin: '27AAAPC9012T1ZK' },
  { name: 'Home Care Products', gstin: '27AAAHC3456F1ZQ' },
  { name: 'Stationery & Office Supplies', gstin: '27AAXSS1234M1ZL' },
  { name: 'Packaging Solutions India', gstin: '27AAAPP5678H1ZS' },
  { name: 'Interstate Foods Pvt Ltd', gstin: '07AAEFI3456G1Z9', inter_state: true },
  { name: 'Fresh Fruits Wholesale', gstin: null },
  { name: 'Dairy Fresh Milk Supply', gstin: '27AAXDF9012J1ZB' },
  { name: 'UPI Beverages Distribution', gstin: '27AAXUB3456K1ZF' },
  { name: 'Organic Foods Supplier', gstin: '27AAEOF5678Q1ZV' },
  { name: 'Spices Direct India', gstin: '27AAASD7890M1ZW' },
  { name: 'Electronics & Appliances', gstin: '27AAAEA9012R1ZX' },
];

const GM_SALES_PRODUCTS = [
  { description: 'Sunflower Cooking Oil (5L)', hsn: '1512', price: '850.00', rate: 5 },
  { description: 'Basmati Rice Premium (5kg)', hsn: '1006', price: '420.00', rate: 5 },
  { description: 'Tea Powder (250g)', hsn: '0902', price: '120.00', rate: 5 },
  { description: 'Wheat Flour (10kg)', hsn: '1101', price: '320.00', rate: 0 },
  { description: 'Toor Dal (1kg)', hsn: '0713', price: '110.00', rate: 0 },
  { description: 'Cooking Salt (1kg)', hsn: '2501', price: '20.00', rate: 0 },
  { description: 'Sugar (1kg)', hsn: '1701', price: '45.00', rate: 0 },
  { description: 'Milk (1 liter)', hsn: '0401', price: '60.00', rate: 0 },
  { description: 'Bread Loaf', hsn: '1905', price: '40.00', rate: 0 },
  { description: 'Packaged Snacks', hsn: '2106', price: '50.00', rate: 18 },
  { description: 'Dishwashing Liquid (500ml)', hsn: '3402', price: '120.00', rate: 18 },
  { description: 'Bath Soap (100g)', hsn: '3401', price: '45.00', rate: 18 },
  { description: 'Instant Noodles (5 pack)', hsn: '1902', price: '100.00', rate: 5 },
  { description: 'Cold Drinks (2L)', hsn: '2202', price: '80.00', rate: 18 },
  { description: 'Chocolates (Assorted)', hsn: '1806', price: '60.00', rate: 18 },
];

const GM_PURCHASE_PRODUCTS = [
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
  { description: 'Instant Noodles (5 pack x 20)', hsn: '1902', price: '1800.00', rate: 5 },
  { description: 'Cold Drinks (2L x 24)', hsn: '2202', price: '1600.00', rate: 18 },
  { description: 'Chocolates (Assorted x 25)', hsn: '1806', price: '1200.00', rate: 18 },
];

export async function seedGrandMartInvoices(shopId: string, userId: string) {
  console.log('  Generating GrandMart invoices...');
  
  const salesInvoices: DemoInvoice[] = [];
  const purchaseInvoices: DemoInvoice[] = [];
  
  // Generate 160 sales invoices
  let invNum = 2001;
  let dateOffset = 0;
  
  for (let i = 0; i < 160; i++) {
    const customer = GM_CUSTOMERS[i % GM_CUSTOMERS.length];
    const numItems = 3 + (i % 6);
    const selectedProducts = [];
    
    for (let j = 0; j < numItems; j++) {
      selectedProducts.push(GM_SALES_PRODUCTS[(i * 4 + j) % GM_SALES_PRODUCTS.length]);
    }
    
    const items = selectedProducts.map((p, idx) => ({
      description: p.description,
      hsn_sac_code: p.hsn,
      quantity: (1 + (idx % 4)).toString(),
      unit_price: p.price,
      gst_rate: p.rate,
      is_inter_state: customer.inter_state,
    }));
    
    const lines = generateInvoiceLines(items);
    const subtotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.taxable_value)), new Decimal(0));
    const cgstTotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.cgst_amount)), new Decimal(0));
    const sgstTotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.sgst_amount)), new Decimal(0));
    const igstTotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.igst_amount)), new Decimal(0));
    const totalTax = cgstTotal.plus(sgstTotal).plus(igstTotal);
    const totalAmount = subtotal.plus(totalTax);
    
    const paymentStatuses = ['paid', 'unpaid', 'partial'];
    const paymentStatus = paymentStatuses[i % 5];
    
    let amountPaid = '0';
    if (paymentStatus === 'paid') {
      amountPaid = totalAmount.toFixed(2);
    } else if (paymentStatus === 'partial') {
      amountPaid = totalAmount.mul(0.6).toFixed(2);
    }
    
    const date = new Date('2026-10-01');
    date.setDate(date.getDate() + dateOffset);
    const dateStr = date.toISOString().split('T')[0];
    dateOffset += (i % 2) + 1;
    
    salesInvoices.push({
      shop_id: shopId,
      user_id: userId,
      direction: 'sales',
      invoice_type: 'sales_tax_invoice',
      invoice_number: `GM/OUT/2026/${invNum++}`,
      invoice_date: dateStr,
      due_date: dateStr,
      supplier_name: 'GrandMart Supermarket',
      supplier_gstin: '27XYZAB5678H2ZY',
      buyer_name: customer.name,
      customer_gstin: customer.gstin,
      place_of_supply: '27',
      is_inter_state: customer.inter_state,
      items,
      payment_status: paymentStatus as 'paid' | 'unpaid' | 'partial',
      review_state: i % 15 === 0 ? 'pending_review' : 'confirmed',
      amount_paid: amountPaid,
      notes: null,
    });
  }
  
  // Generate 90 purchase invoices
  invNum = 9001;
  dateOffset = 0;
  
  for (let i = 0; i < 90; i++) {
    const supplier = GM_SUPPLIERS[i % GM_SUPPLIERS.length];
    const numItems = 4 + (i % 5);
    const selectedProducts = [];
    
    for (let j = 0; j < numItems; j++) {
      selectedProducts.push(GM_PURCHASE_PRODUCTS[(i * 3 + j) % GM_PURCHASE_PRODUCTS.length]);
    }
    
    const items = selectedProducts.map((p, idx) => ({
      description: p.description,
      hsn_sac_code: p.hsn,
      quantity: (2 + (idx % 3)).toString(),
      unit_price: p.price,
      gst_rate: p.rate,
      is_inter_state: supplier.inter_state || false,
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
      amountPaid = totalAmount.mul(0.5).toFixed(2);
    }
    
    const date = new Date('2026-10-01');
    date.setDate(date.getDate() + dateOffset);
    const dateStr = date.toISOString().split('T')[0];
    dateOffset += 2 + (i % 4);
    
    const isPendingReview = i % 10 === 0;
    
    purchaseInvoices.push({
      shop_id: shopId,
      user_id: userId,
      direction: 'purchase',
      invoice_type: 'purchase_tax_invoice',
      invoice_number: `GM/IN/2026/${invNum++}`,
      invoice_date: dateStr,
      due_date: new Date(new Date(dateStr).setDate(new Date(dateStr).getDate() + 30)).toISOString().split('T')[0],
      supplier_name: supplier.name,
      supplier_gstin: supplier.gstin,
      buyer_name: 'GrandMart Supermarket',
      customer_gstin: '27XYZAB5678H2ZY',
      place_of_supply: supplier.inter_state ? '07' : '27',
      is_inter_state: supplier.inter_state || false,
      items,
      payment_status: paymentStatus as 'paid' | 'unpaid' | 'partial',
      review_state: isPendingReview ? 'pending_review' : 'confirmed',
      amount_paid: amountPaid,
      notes: isPendingReview ? 'Pending HSN verification' : null,
    });
  }
  
  const allInvoices = [...salesInvoices, ...purchaseInvoices];
  let success = 0;
  let failed = 0;
  
  for (const inv of allInvoices) {
    try {
      await createInvoiceServer(inv.shop_id, inv.user_id, {
        direction: inv.direction,
        invoice_type: inv.invoice_type,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        supplier_name: inv.supplier_name,
        supplier_gstin: inv.supplier_gstin,
        customer_name: inv.buyer_name,
        customer_gstin: inv.customer_gstin,
        place_of_supply: inv.place_of_supply,
        is_inter_state: inv.is_inter_state,
        items: inv.items,
        payment_status: inv.payment_status,
        review_state: inv.review_state,
        amount_paid: inv.amount_paid,
        notes: inv.notes,
      }, inv.items);
      success++;
    } catch (err: any) {
      console.error(`    Failed: ${inv.invoice_number}: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`    Created ${success} invoices, ${failed} failed`);
  return { sales: salesInvoices.length, purchase: purchaseInvoices.length };
}

export { seedGrandMartInvoices };
