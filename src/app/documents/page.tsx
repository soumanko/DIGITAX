'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/lib/theme-provider';
import { escapeHtml } from '@/lib/security/xss-sanitizer';
import { formatINR } from '@/lib/decimal';
import { Document } from '@/types';
import {
  UploadCloud,
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  Edit3,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  File,
  ChevronRight,
} from 'lucide-react';

interface DocumentStatusBadgeProps {
  status: string;
}

function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const variants: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'accent'; label: string }> = {
    uploaded: { variant: 'default', label: 'Uploaded' },
    processing: { variant: 'accent', label: 'Processing' },
    ocr_completed: { variant: 'success', label: 'OCR Complete' },
    pending_review: { variant: 'warning', label: 'Pending Review' },
    reviewed: { variant: 'success', label: 'Reviewed' },
    error: { variant: 'error', label: 'Failed' },
  };
  const v = variants[status] || { variant: 'default', label: status };
  return <Badge variant={v.variant} size="sm">{v.label}</Badge>;
}

interface DocumentTypeIconProps {
  type: string;
  className?: string;
}

function DocumentTypeIcon({ type, className }: DocumentTypeIconProps) {
  const icons: Record<string, React.ElementType> = {
    sales_invoice: FileText,
    purchase_invoice: FileText,
    credit_note: FileCheck2,
    debit_note: FileCheck2,
    receipt: File,
    other: File,
  };
  const Icon = icons[type] || File;
  return <Icon className={className} />;
}

export default function DocumentsPage() {
  const { resolvedTheme } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  [resolvedTheme];
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const statusOptions = [
    { label: 'Uploaded', value: 'uploaded' },
    { label: 'Processing', value: 'processing' },
    { label: 'Pending Review', value: 'pending_review' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Failed', value: 'error' },
  ];

  const typeOptions = [
    { label: 'Sales Invoice', value: 'sales_invoice' },
    { label: 'Purchase Invoice', value: 'purchase_invoice' },
    { label: 'Credit Note', value: 'credit_note' },
    { label: 'Debit Note', value: 'debit_note' },
    { label: 'Receipt', value: 'receipt' },
    { label: 'Other', value: 'other' },
  ];

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
      }
    } catch {
      // Error handled by empty state
    } finally {
      setLoading(false);
    }
  }

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || doc.processing_status === filterStatus;
    const matchesType =
      filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  async function handleDownload(docId: string, storagePath: string) {
    try {
      const res = await fetch(
        `/api/documents/${docId}/signed-url?download=true`
      );
      if (res.ok) {
        const data = await res.json();
        window.open(data.signedUrl, '_blank');
      }
    } catch {
      // Error handled silently
    }
  }

  async function handleDelete(docId: string) {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadDocuments();
      }
    } catch {
      // Error handled silently
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Document Intelligence"
          description="Manage and review your uploaded invoices and financial documents."
          breadcrumbs={[{ label: 'Dashboard' }, { label: 'Documents' }]}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                disabled={isUploading}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {isUploading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 mr-2" /> Upload Document
                  </>
                )}
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
              />
            </div>
          }
        />

        {/* Filters */ }
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Input
              placeholder="Search document name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
            <div className="flex items-center gap-2 text-xs font-semibold text-text-tertiary uppercase">
              <span className="mr-2">Status:</span>
              <div className="flex gap-1">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                      filterStatus === opt.value
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400'
                        : 'border-border bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-text-tertiary uppercase">
            <span className="mr-2">Type:</span>
            <div className="flex gap-1">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterType(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    filterType === opt.value
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400'
                      : 'border-border bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents List */ }
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8">
              <Skeleton variant="rect" width="full" height="4" className="mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} variant="rect" height="120" className="w-full" />
                ))}
              </div>
            </div>
          ) : filteredDocs.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-10 w-10 text-text-tertiary" />}
              title="No documents found"
              description={
                searchTerm || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Upload your first invoice or receipt to get started.'
              }
              action={
                <Button variant="primary" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                  <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Upload Document
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-secondary border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">File</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase text-right">Size</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase text-right">Uploaded</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center text-text-tertiary">
                            <DocumentTypeIcon type={doc.document_type} className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text-primary truncate" title={escapeHtml(doc.original_filename)}>
                              {escapeHtml(doc.original_filename)}
                            </p>
                            <p className="text-xs text-text-tertiary font-mono">
                              {escapeHtml(doc.content_type)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-text-secondary capitalize">
                          {escapeHtml(doc.document_type.replace('_', ' '))}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <DocumentStatusBadge status={doc.processing_status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-mono text-text-primary">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm text-text-tertiary font-mono">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(doc.id, doc.storage_path)}
                            className="p-2 text-text-tertiary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-tertiary rounded-lg transition-colors"
                            title="Download"
                            aria-label={`Download ${escapeHtml(doc.original_filename)}`}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-2 text-text-tertiary hover:text-error-600 dark:hover:text-error-400 hover:bg-surface-tertiary rounded-lg transition-colors"
                            title="Delete"
                            aria-label={`Delete ${escapeHtml(doc.original_filename)}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
