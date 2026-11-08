import React from 'react';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  columns: Array<{
    key: string;
    header: string;
    className?: string;
    render?: (value: unknown, row: T) => React.ReactNode;
  }>;
  data: T[];
  className?: string;
}

export function DataTable<T>({ columns, data, className }: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto border border-border rounded-xl', className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-surface-secondary border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-4 py-3 font-medium text-text-tertiary uppercase tracking-tighter', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="bg-surface hover:bg-surface-secondary transition-colors">
              {columns.map((col) => {
                const value = row[col.key as keyof T];
                return (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3.5 text-text-primary', col.className)}
                  >
                    {col.render ? col.render(value, row) : String(value ?? '')}
                  </td>
                );
              })}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-text-tertiary"
              >
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
