const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function downloadCsv(filename, rows, columns) {
  const header = columns.map((column) => cell(column.label)).join(',');
  const lines = rows.map((row) => columns.map((column) => cell(row[column.key])).join(','));
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
