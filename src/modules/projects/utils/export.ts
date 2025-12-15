import type { Project } from '../types';
import { formatDate, formatCurrency } from './formatting';

/**
 * Export projects to CSV format
 */
export function exportToCSV(projects: Project[], filename: string = 'projects.csv'): void {
  const headers = [
    'ID',
    'Title',
    'Status',
    'Priority',
    'Start Date',
    'Deadline',
    'Progress %',
    'Price',
    'Currency',
    'Client',
  ];

  const rows = projects.map((p) => [
    p.id,
    p.title,
    p.status ?? '',
    p.priority ?? '',
    formatDate(p.startDate),
    formatDate(p.deadline),
    p.progressPercentage ?? 0,
    p.price ?? '',
    p.currency ?? 'USD',
    '', // Client - can be added if needed
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export projects to Excel format (using CSV with .xlsx extension)
 * For full Excel support, you'd need a library like xlsx
 */
export function exportToExcel(projects: Project[], filename: string = 'projects.xlsx'): void {
  // For now, export as CSV with .xlsx extension
  // In production, use a library like 'xlsx' for proper Excel format
  exportToCSV(projects, filename.replace('.xlsx', '.csv'));
}

/**
 * Print projects table
 */
export function printProjects(projects: Project[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Projects Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Projects Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Start Date</th>
              <th>Deadline</th>
              <th>Progress</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${projects
              .map(
                (p) => `
              <tr>
                <td>${p.id}</td>
                <td>${p.title}</td>
                <td>${p.status ?? '-'}</td>
                <td>${p.priority ?? '-'}</td>
                <td>${formatDate(p.startDate)}</td>
                <td>${formatDate(p.deadline)}</td>
                <td>${p.progressPercentage ?? 0}%</td>
                <td>${formatCurrency(p.price, p.currency)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

