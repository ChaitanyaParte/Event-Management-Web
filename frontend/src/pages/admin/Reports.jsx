import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import PageTitle from '../../components/PageTitle';
import { Badge, Button, Card, Table, Td, Th } from '../../components/ui';
import { useRoleApi } from '../../hooks/useRoleApi';
import { formatDate } from '../../lib/api';
import { downloadCsv } from '../../lib/csv';

const percent = (value) => (value == null ? '0%' : `${value}%`);

const reports = [
  {
    key: 'events',
    title: 'Event report',
    file: 'event-report.csv',
    columns: [
      { key: 'title', label: 'Event' },
      { key: 'category_name', label: 'Category' },
      { key: 'organizer_name', label: 'Organizer' },
      { key: 'total_registrations', label: 'Registrations' },
      { key: 'attended_count', label: 'Attended' },
      { key: 'attendance_percentage', label: 'Attendance %', render: (row) => percent(row.attendance_percentage) },
      { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ],
  },
  {
    key: 'students',
    title: 'Student report',
    file: 'student-report.csv',
    columns: [
      { key: 'full_name', label: 'Student' },
      { key: 'roll_number', label: 'Roll number' },
      { key: 'department', label: 'Department' },
      { key: 'events_registered', label: 'Registered' },
      { key: 'events_attended', label: 'Attended' },
      { key: 'certificates_earned', label: 'Certificates' },
    ],
  },
  {
    key: 'organizers',
    title: 'Organizer report',
    file: 'organizer-report.csv',
    columns: [
      { key: 'full_name', label: 'Organizer' },
      { key: 'email', label: 'Email' },
      { key: 'events_created', label: 'Events' },
      { key: 'total_registrations', label: 'Registrations' },
      { key: 'average_attendance_percentage', label: 'Attendance %', render: (row) => percent(row.average_attendance_percentage) },
      { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ],
  },
  {
    key: 'categories',
    title: 'Category report',
    file: 'category-report.csv',
    columns: [
      { key: 'category_name', label: 'Category' },
      { key: 'events_count', label: 'Events' },
      { key: 'total_registrations', label: 'Registrations' },
      { key: 'attended', label: 'Attended' },
      { key: 'attendance_percentage', label: 'Attendance %', render: (row) => percent(row.attendance_percentage) },
    ],
  },
];

export default function Reports() {
  const call = useRoleApi('admin');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all(reports.map((report) => call(`/admin/reports/${report.key}`)))
      .then((results) => setData(Object.fromEntries(reports.map((report, index) => [report.key, results[index]]))))
      .catch((err) => setError(err.message));
  }, [call]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-zinc-500">Loading reports...</p>;

  const cellValue = (column, row) => (column.render ? column.render(row) : (column.key === 'event_date' ? formatDate(row[column.key]) : row[column.key]));

  return (
    <>
      <PageTitle title="Reports" subtitle="Analytics across events, students, organizers and categories." />
      <div className="space-y-6">
        {reports.map((report) => (
          <Card key={report.key}>
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="text-sm font-semibold">{report.title}</h2>
              <Button size="sm" variant="outline" onClick={() => downloadCsv(report.file, data[report.key], report.columns)} disabled={data[report.key].length === 0}>
                <Download size={14} /> Export CSV
              </Button>
            </div>
            {data[report.key].length === 0 ? (
              <p className="p-6 text-center text-sm text-zinc-500">No data yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>{report.columns.map((column) => <Th key={column.key}>{column.label}</Th>)}</tr>
                </thead>
                <tbody>
                  {data[report.key].map((row, index) => (
                    <tr key={index}>
                      {report.columns.map((column) => <Td key={column.key}>{cellValue(column, row)}</Td>)}
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
