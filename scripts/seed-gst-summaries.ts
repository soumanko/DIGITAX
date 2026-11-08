#!/usr/bin/env -npx tsx
/**
 * GST Summary Seeder for DIGITAX
 * Creates GST period summaries for both demo businesses.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { createShopWithMembership } from '@/lib/supabase/server-db';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';

const supabase = createServiceClient();

async function seedGSTSummaries() {
  console.log('\n--- Seeding GST Summaries ---\n');

  for (const shopId of ['shop-freshmart-001', 'shop-grandmart-002']) {
    console.log(`  Generating GST summary for ${shopId}...`);
    
    // Get all invoices for the shop
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', shopId);

    if (error) {
      console.error(`    Failed to fetch invoices: ${error.message}`);
      continue;
    }

    if (!invoices || invoices.length === 0) {
      console.log(`    No invoices found, skipping`);
      continue;
    }

    // Generate GST summary for October 2026
    const year = 2026;
    const month = 10;

    try {
      const summary = generateGSTPeriodSummary(shopId, year, month, invoices);

      // Create or update filing period
      const { data: filingPeriod } = await supabase
        .from('filing_periods')
        .upsert({
          shop_id: shopId,
          financial_year: '2026-27',
          period_start: '2026-10-01',
          period_end: '2026-10-31',
          return_type: 'GSTR-3B',
          status: 'prepared',
        })
        .select()
        .single();

      if (!filingPeriod) {
        console.error(`    Failed to create filing period`);
        continue;
      }

      // Insert GST summary
      const { data: gstSummary, error: gstError } = await supabase
        .from('gst_summaries')
        .insert({
          shop_id: shopId,
          filing_period_id: filingPeriod.id,
          financial_year: '2026-27',
          tax_period: '2026-10',
          return_type: 'GSTR-3B',
          taxable_sales: summary.gstr1.totalTaxableValue,
          exempt_sales: '0.00',
          total_sales: summary.gstr1.totalTaxableValue,
          taxable_purchases: summary.gstr3b.outward_supplies.taxableValue,
          total_purchases: summary.gstr3b.outward_supplies.taxableValue,
          output_cgst: summary.gstr3b.outward_supplies.cgst,
          output_sgst: summary.gstr3b.outward_supplies.sgst,
          output_igst: summary.gstr3b.outward_supplies.igst,
          output_cess: summary.gstr3b.outward_supplies.cess,
          input_cgst: summary.gstr3b.eligible_itc.all_other_itc.cgst,
          input_sgst: summary.gstr3b.eligible_itc.all_other_itc.sgst,
          input_igst: summary.gstr3b.eligible_itc.all_other_itc.igst,
          input_cess: summary.gstr3b.eligible_itc.all_other_itc.cess,
          net_tax_liability: summary.netTaxPayable.total,
          source_record_counts: {
            invoices: invoices.length,
            transactions: 0,
          },
          invoices_included: invoices.length,
          transactions_included: 0,
          unresolved_issues: 0,
          calculation_version: '1.0.0',
          engine_version: '1.0.0',
          ruleset_version: '2026.1',
          status: 'draft',
          review_state: 'pending_review',
          warnings: [],
          details: summary,
          generated_by: 'demo-user',
          generated_at: new Date().toISOString(),
          calculated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (gstError) {
        console.error(`    Failed to create GST summary: ${gstError.message}`);
        continue;
      }

      console.log(`    ✅ GST summary created - Net liability: ₹${summary.netTaxPayable.total}`);
      console.log(`       Output tax: ₹${summary.gstr3b.outward_supplies.cgst + '-' + summary.gstr3b.outward_supplies.sgst + '-' + summary.gstr3b.outward_supplies.igst}`);
      console.log(`       Input ITC: ₹${summary.gstr3b.eligible_itc.all_other_itc.cgst + '-' + summary.gstr3b.eligible_itc.all_other_itc.sgst + '-' + summary.gstr3b.eligible_itc.all_other_itc.igst}`);

    } catch (err: any) {
      console.error(`    Failed: ${err.message}`);
    }
  }

  console.log('  ✅ GST summaries seeding complete');
}

seedGSTSummaries().catch((err) => {
  console.error('GST summary seeding failed:', err);
  process.exit(1);
});
