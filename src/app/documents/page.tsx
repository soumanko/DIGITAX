'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { escapeHtml } from '@/lib/security/xss-sanitizer';
import { useToast } from '@/components/ui/toast';
import { Document } from '@/types';
import {
  UploadCloud,
  FileText,
  Download,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  File,
} from 'lucide-react';

function DocumentStatusBadge({ status }: { status: string }) {
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

function DocumentTypeIcon({ type, className }: { type: string; className?: string }) {
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
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
    const matchesSearch = doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.processing_status === filterStatus;
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  async function handleDownload(docId: string) {
    try {
      const res = await fetch(`/api/documents/${docId}/signed-url?download=true`);
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
      const res = await fetch(`/api/documents?id=${docId}`, { method: 'DELETE' });
      if (res.ok) {
        loadDocuments();
        showToast({ type: 'success', title: 'Document deleted' });
      } else {
        showToast({ type: 'error', title: 'Delete failed', description: 'The document could not be deleted. Please try again.' });
      }
    } catch {
      showToast({ type: 'error', title: 'Delete failed', description: 'Network error deleting document.' });
    }
  }

  const ALLOWED_UPLOAD_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

  async function handleUpload(file: File) {
    // Client-side MIME + size validation (mirrors server rules)
    if (!ALLOWED_UPLOAD_MIME.includes(file.type)) {
      showToast({ type: 'error', title: 'Unsupported file type', description: 'Allowed: PDF, JPEG, PNG, WEBP, HEIC, HEIF (max 10 MB).' });
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      showToast({ type: 'error', title: 'File too large', description: 'Documents must be 10 MB or smaller.' });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'other');
      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({ type: 'error', title: 'Upload failed', description: data.error || `The server rejected the upload (HTTP ${res.status}).` });
        return;
      }
      showToast({ type: 'success', title: 'Document uploaded', description: 'Stored securely in your private business vault.' });
      await loadDocuments();
    } catch {
      showToast({ type: 'error', title: 'Upload failed', description: 'Network error uploading document.' });
    } finally {
      setIsUploading(false);
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
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2 rounded-lg border border-border bg-surface text-sm"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className="p-2 rounded-lg border border-border bg-surface text-sm"
                >
                  <GridIcon className="h-4 w-4" />
                </button>
              </div>
              <Button variant="primary" disabled={isUploading} onClick={() => document.getElementById('file-upload')?.click()}>
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Upload Document
                  </>
                )}
              </Button>
              <input id="file-upload" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); e.target.value = ''; }} />
            </div>
          }
        />

        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Input placeholder="Search document name…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64" />
            <div className="flex items-center gap-2 text-xs font-semibold text-text-tertiary uppercase">
              <span className="mr-2">Status:</span>
              <div className="flex gap-1">
                {statusOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setFilterStatus(opt.value)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${filterStatus === opt.value ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400' : 'border-border bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-text-tertiary uppercase">
              <span className="mr-2">Type:</span>
              <div className="flex gap-1">
                {typeOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setFilterType(opt.value)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${filterType === opt.value ? 'bg-primary-600 border-primary-600 text-white' : 'border-border bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'}`}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>

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
              <EmptyState icon={<FolderIcon className="h-12 w-12 text-text-tertiary" />} title="No documents found" description={searchTerm || filterStatus !== 'all' || filterType !== 'all' ? 'Try adjusting your filters or search terms.' : 'Upload your first invoice or receipt to get started.'} action={<Button variant="primary" size="sm" onClick={() => document.getElementById('file-upload')?.click()}> <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Upload Document</Button>} />
            ) : viewMode === 'list' ? (
              <ListView documents={filteredDocs} onDownload={handleDownload} onDelete={handleDelete} />
            ) : (
              <GridView documents={filteredDocs} onDownload={handleDownload} onDelete={handleDelete} />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ListView({ documents, onDownload, onDelete }: { documents: Document[]; onDownload: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
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
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-surface-secondary transition-colors group">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center text-text-tertiary"><DocumentTypeIcon type={doc.document_type} className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary truncate" title={escapeHtml(doc.original_filename)}>{escapeHtml(doc.original_filename)}</p>
                    <p className="text-xs text-text-tertiary font-mono">{escapeHtml(doc.content_type)}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4"><span className="text-xs text-text-secondary capitalize">{escapeHtml(doc.document_type.replace('_', ' '))}</span></td>
              <td className="px-4 py-4"><DocumentStatusBadge status={doc.processing_status} /></td>
              <td className="px-4 py-4 text-right"><span className="text-sm font-mono text-text-primary">{(doc.file_size / 1024).toFixed(1)} KB</span></td>
              <td className="px-4 py-4 text-right"><span className="text-sm text-text-tertiary font-mono">{doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN') : '—'}</span></td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onDownload(doc.id)} className="p-2 text-text-tertiary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-tertiary rounded-lg transition-colors" title="Download"><Download className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(doc.id)} className="p-2 text-text-tertiary hover:text-error-600 dark:hover:text-error-400 hover:bg-surface-tertiary rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GridView({ documents, onDownload, onDelete }: { documents: Document[]; onDownload: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">{documents.map((doc) => <DocumentCard key={doc.id} doc={doc} onDownload={onDownload} onDelete={onDelete} />)}</div>
  );
}

function DocumentCard({ doc, onDownload, onDelete }: { doc: Document; onDownload: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center text-text-tertiary"><DocumentTypeIcon type={doc.document_type} className="h-5 w-5" /></div>
        <button onClick={() => onDelete(doc.id)} className="p-1.5 text-text-tertiary hover:text-error-600 dark:hover:text-error-400 hover:bg-surface-tertiary rounded-lg transition-colors" aria-label="Delete document"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <div className="flex-1 mb-3">
        <p className="text-sm font-medium text-text-primary truncate" title={escapeHtml(doc.original_filename)}>{escapeHtml(doc.original_filename)}</p>
        <p className="text-xs text-text-tertiary font-mono mt-1">{escapeHtml(doc.content_type)}</p>
        <p className="text-xs text-text-tertiary mt-2">{`${(doc.file_size / 1024).toFixed(1)} KB`}</p>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <DocumentStatusBadge status={doc.processing_status} />
        <button onClick={() => onDownload(doc.id)} className="p-1.5 text-text-tertiary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-tertiary rounded-lg transition-colors" title="Download"><Download className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

function ListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function GridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" ry="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" ry="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" ry="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" ry="1" />
    </svg>
  );
}

function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 2h11a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 4v6h6" />
      <path d="M4 1c8.284 0 15 6.716 15 15" />
    </svg>
  );
}