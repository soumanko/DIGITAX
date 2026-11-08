#!/usr/bin/env -npx tsx
/**
 * Demo Document Generator for DIGITAX
 * Creates document metadata records linked to invoices and other records.
 */

import { createServiceClient } from '@/lib/supabase/server';
import Decimal from 'decimal.js';

const supabase = createServiceClient();

interface DemoDocument {
  shop_id: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  document_type: 'sales_invoice' | 'purchase_invoice' | 'credit_note' | 'debit_note' | 'receipt' | 'other';
  processing_status: 'uploaded' | 'queued' | 'processing' | 'extracted' | 'failed' | 'manual_entry';
  uploaded_by: string;
  invoice_id?: string;
  notes?: string;
}

// Generate realistic document content hash
function generateContentHash(content: string): string {
  // Simple hash for demo purposes
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

const FRESHMART_DOCUMENTS: DemoDocument[] = [
  // Sales invoice documents
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-OUT-2026-1001.pdf',
    content_type: 'application/pdf',
    file_size: 245760,
    document_type: 'sales_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Sales invoice - Sai Tea Stall',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-OUT-2026-1002.pdf',
    content_type: 'application/pdf',
    file_size: 198340,
    document_type: 'sales_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Sales invoice - Shree Restaurant',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-OUT-2026-1003.pdf',
    content_type: 'application/pdf',
    file_size: 156780,
    document_type: 'sales_invoice',
    processing_status: 'pending_review',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Sales invoice - Pune Office Supplies - pending review',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-OUT-2026-1004.pdf',
    content_type: 'application/pdf',
    file_size: 212450,
    document_type: 'sales_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Sales invoice - Kirana Corner',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-OUT-2026-1005.pdf',
    content_type: 'application/pdf',
    file_size: 175600,
    document_type: 'sales_invoice',
    processing_status: 'confirmed',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Sales invoice - Quick Bites Cafe',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-OUT-2026-1006.pdf',
    content_type: 'application/pdf',
    file_size: 143200,
    document_type: 'sales_invoice',
    processing_status: 'uploaded',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Sales invoice - Verma Traders - awaiting review',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-OUT-2026-1007.pdf',
    content_type: 'application/pdf',
    file_size: 189450,
    document_type: 'sales_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Sales invoice - Green Leaf Cafe',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-OUT-2026-1008.pdf',
    content_type: 'application/pdf',
    file_size: 156890,
    document_type: 'sales_invoice',
    processing_status: 'confirmed',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Sales invoice - City Medical Store',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-OUT-2026-1009.pdf',
    content_type: 'application/pdf',
    file_size: 112340,
    document_type: 'sales_invoice',
    processing_status: 'pending_review',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Sales invoice - Office Cafe - pending review',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-OUT-2026-1010.pdf',
    content_type: 'application/pdf',
    file_size: 167890,
    document_type: 'sales_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Sales invoice - Singh Brothers',
  },
  // Purchase invoice documents
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-IN-2026-881.pdf',
    content_type: 'application/pdf',
    file_size: 312560,
    document_type: 'purchase_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Purchase invoice - Apex FMCG Distributors',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-IN-2026-882.pdf',
    content_type: 'application/pdf',
    file_size: 278900,
    document_type: 'purchase_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Purchase invoice - HUL Consumer Products',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-IN-2026-883.pdf',
    content_type: 'application/pdf',
    file_size: 198450,
    document_type: 'purchase_invoice',
    processing_status: 'pending_review',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Purchase invoice - Britannia Biscuits - pending review',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-IN-2026-884.pdf',
    content_type: 'application/pdf',
    file_size: 156230,
    document_type: 'purchase_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Purchase invoice - Pune Dairy Distributors',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-IN-2026-885.pdf',
    content_type: 'application/pdf',
    file_size: 134560,
    document_type: 'purchase_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Purchase invoice - Maharashtra Beverages',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-IN-2026-886.pdf',
    content_type: 'application/pdf',
    file_size: 112890,
    document_type: 'purchase_invoice',
    processing_status: 'failed',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Purchase invoice - Clean & Fresh - OCR failed',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-IN-2026-887.pdf',
    content_type: 'application/pdf',
    file_size: 98450,
    document_type: 'purchase_invoice',
    processing_status: 'manual_entry',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Purchase invoice - Fresh Produce - manual entry',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-IN-2026-888.pdf',
    content_type: 'application/pdf',
    file_size: 178340,
    document_type: 'purchase_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Purchase invoice - Household Essentials',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-IN-2026-889.pdf',
    content_type: 'application/pdf',
    file_size: 234560,
    document_type: 'purchase_invoice',
    processing_status: 'pending_review',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Purchase invoice - Shri Ram Agencies - pending review',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-IN-2026-890.pdf',
    content_type: 'application/pdf',
    file_size: 145670,
    document_type: 'purchase_invoice',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Purchase invoice - Spice King Distributors',
  },
  // Receipts and bills
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-REC-2026-10-01.pdf',
    content_type: 'application/pdf',
    file_size: 45670,
    document_type: 'receipt',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Electricity bill - MSEDCL',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-REC-2026-10-02.pdf',
    content_type: 'application/pdf',
    file_size: 32890,
    document_type: 'receipt',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Shop rent - October 2026',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-REC-2026-10-03.pdf',
    content_type: 'application/pdf',
    file_size: 28450,
    document_type: 'receipt',
    processing_status: 'uploaded',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Internet broadband bill',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-REC-2026-10-04.jpg',
    content_type: 'image/jpeg',
    file_size: 1256700,
    document_type: 'receipt',
    processing_status: 'queued',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Packaging materials receipt',
  },
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-REC-2026-10-05.pdf',
    content_type: 'application/pdf',
    file_size: 67890,
    document_type: 'receipt',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'Transportation expense receipt',
  },
  // Bank statements
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-BANK-2026-10.pdf',
    content_type: 'application/pdf',
    file_size: 856700,
    document_type: 'other',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'HDFC Current Account statement - October 2026',
  },
  // GST documents
  {
    shop_id: 'shop-freshmart-001',
    original_filename: 'FM-GSTR3B-2026-10.pdf',
    content_type: 'application/pdf',
    file_size: 156780,
    document_type: 'other',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-freshmart',
    notes: 'GSTR-3B filing summary - October 2026',
  },
];

const GRANDMART_DOCUMENTS: DemoDocument[] = [
  // Sales invoice documents (larger volume)
  ...Array.from({ length: 40 }, (_, i) => ({
    shop_id: 'shop-grandmart-002',
    original_filename: `GM-OUT-2026-${String(2001 + i).padStart(4, '0')}.pdf`,
    content_type: 'application/pdf',
    file_size: 200000 + (i * 5000),
    document_type: 'sales_invoice',
    processing_status: i % 5 === 0 ? 'pending_review' : i % 10 === 0 ? 'failed' : 'extracted',
    uploaded_by: 'demo-user-grandmart',
    notes: `Sales invoice - GM-CUST-${String(i % 20 + 1).padStart(3, '0')}`,
  })),
  // Purchase invoice documents (large volume)
  ...Array.from({ length: 25 }, (_, i) => ({
    shop_id: 'shop-grandmart-002',
    original_filename: `GM-IN-2026-${String(9001 + i).padStart(4, '0')}.pdf`,
    content_type: 'application/pdf',
    file_size: 350000 + (i * 8000),
    document_type: 'purchase_invoice',
    processing_status: i % 6 === 0 ? 'pending_review' : i % 12 === 0 ? 'failed' : 'extracted',
    uploaded_by: 'demo-user-grandmart',
    notes: `Purchase invoice - GM-SUPP-${String(i % 15 + 1).padStart(3, '0')}`,
  })),
  // Receipts
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-REC-2026-10-01.pdf',
    content_type: 'application/pdf',
    file_size: 89450,
    document_type: 'receipt',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-grandmart',
    notes: 'Electricity bill - MSEDCL - October',
  },
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-REC-2026-10-02.pdf',
    content_type: 'application/pdf',
    file_size: 156780,
    document_type: 'receipt',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-grandmart',
    notes: 'Shop rent - October 2026 - Pune Central Mall',
  },
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-REC-2026-10-03.pdf',
    content_type: 'application/pdf',
    file_size: 67890,
    document_type: 'receipt',
    processing_status: 'uploaded',
    uploaded_by: 'demo-user-grandmart',
    notes: 'Internet broadband bill',
  },
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-REC-2026-10-04.jpg',
    content_type: 'image/jpeg',
    file_size: 2156700,
    document_type: 'receipt',
    processing_status: 'queued',
    uploaded_by: 'demo-user-grandmart',
    notes: 'Packaging materials receipt - bulk',
  },
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-REC-2026-10-05.pdf',
    content_type: 'application/pdf',
    file_size: 123450,
    document_type: 'receipt',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-grandmart',
    notes: 'Transportation expense receipt',
  },
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-REC-2026-10-06.pdf',
    content_type: 'application/pdf',
    file_size: 234560,
    document_type: 'receipt',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-grandmart',
    notes: 'Employee salaries - October 2026',
  },
  // Bank statements
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-BANK-2026-10.pdf',
    content_type: 'application/pdf',
    file_size: 2456700,
    document_type: 'other',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-grandmart',
    notes: 'ICICI Current Account statement - October 2026',
  },
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-BANK-2026-10-HDFC.pdf',
    content_type: 'application/pdf',
    file_size: 1896700,
    document_type: 'other',
    processing_status: 'uploaded',
    uploaded_by: 'demo-user-grandmart',
    notes: 'HDFC Current Account statement - October 2026',
  },
  // GST documents
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-GSTR3B-2026-10.pdf',
    content_type: 'application/pdf',
    file_size: 456780,
    document_type: 'other',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-grandmart',
    notes: 'GSTR-3B filing summary - October 2026',
  },
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-GSTR1-2026-10.pdf',
    content_type: 'application/pdf',
    file_size: 678900,
    document_type: 'other',
    processing_status: 'pending_review',
    uploaded_by: 'demo-user-grandmart',
    notes: 'GSTR-1 outward supplies - October 2026',
  },
  // Credit/Debit notes
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-CN-2026-001.pdf',
    content_type: 'application/pdf',
    file_size: 89450,
    document_type: 'credit_note',
    processing_status: 'extracted',
    uploaded_by: 'demo-user-grandmart',
    notes: 'Credit note - HUL Consumer Products - damaged goods',
  },
  {
    shop_id: 'shop-grandmart-002',
    original_filename: 'GM-DN-2026-001.pdf',
    content_type: 'application/pdf',
    file_size: 67890,
    document_type: 'debit_note',
    processing_status: 'uploaded',
    uploaded_by: 'demo-user-grandmart',
    notes: 'Debit note - Royal Spice Restaurant - short delivery',
  },
];

export async function seedDocuments() {
  console.log('\n--- Seeding Documents ---\n');
  
  let totalCreated = 0;
  
  for (const businessId of ['shop-freshmart-001', 'shop-grandmart-002']) {
    const documents = businessId === 'shop-freshmart-001' 
      ? FRESHMART_DOCUMENTS 
      : GRANDMART_DOCUMENTS;
    
    console.log(`  Seeding ${documents.length} documents for ${businessId}...`);
    
    let created = 0;
    let failed = 0;
    
    for (const doc of documents) {
      try {
        const storagePath = `${doc.shop_id}/${crypto.randomUUID()}/${doc.original_filename}`;
        
        const { data, error } = await supabase
          .from('documents')
          .insert({
            shop_id: doc.shop_id,
            original_filename: doc.original_filename,
            content_type: doc.content_type,
            file_size: doc.file_size,
            storage_path: storagePath,
            content_hash: generateContentHash(doc.original_filename),
            document_type: doc.document_type,
            processing_status: doc.processing_status,
            uploaded_by: doc.uploaded_by,
            extraction_attempts: doc.processing_status === 'extracted' ? 1 : 0,
            last_extraction_error: doc.processing_status === 'failed' ? 'OCR extraction failed - unclear text' : null,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Link document to invoice if applicable
        if (doc.invoice_id) {
          await supabase
            .from('invoices')
            .update({ document_id: data.id })
            .eq('id', doc.invoice_id);
        }
        
        created++;
      } catch (err: any) {
        console.error(`    Failed: ${doc.original_filename}: ${err.message}`);
        failed++;
      }
    }
    
    console.log(`    Created ${created} documents, ${failed} failed`);
    totalCreated += created;
  }
  
  console.log(`  ✅ Total ${totalCreated} documents created`);
}

seedDocuments().catch((err) => {
  console.error('Document seeding failed:', err);
  process.exit(1);
});
