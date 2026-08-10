import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T | ((row: T) => string);
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({ columns, data, keyField, emptyMessage = 'No data found', className = '' }: DataTableProps<T>) {
  const getKey = (row: T, idx: number): string => {
    if (typeof keyField === 'function') return keyField(row);
    return String(row[keyField] ?? idx);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-eyebrow font-semibold text-text-muted uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-body text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={getKey(row, idx)} className="border-b border-border/50 hover:bg-surface-low transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-body ${col.className || ''}`}>
                    {col.render(row, idx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
