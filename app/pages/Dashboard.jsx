import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { apiDashboard } from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const formatRupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Memuat dashboard...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;
  if (!data) return null;

  const { stats, revenueByMonth, customerByType, billsByStatus, recentPayments, packagesCount, vouchersTotal, vouchersUsed } = data;

  const revenueChart = {
    labels: revenueByMonth?.map((d) => d.label) || [],
    datasets: [
      {
        label: 'Pendapatan',
        data: revenueByMonth?.map((d) => d.value) || [],
        backgroundColor: 'rgba(14, 165, 233, 0.5)',
        borderColor: 'rgb(14, 165, 233)',
        borderWidth: 1,
      },
    ],
  };

  const customerChart = {
    labels: ['Hotspot', 'PPPoE'],
    datasets: [
      {
        data: [customerByType?.hotspot || 0, customerByType?.pppoe || 0],
        backgroundColor: ['#0ea5e9', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

  const billsChart = {
    labels: ['Lunas', 'Belum Lunas'],
    datasets: [
      {
        data: [billsByStatus?.paid || 0, billsByStatus?.unpaid || 0],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  const cards = [
    { label: 'Router Aktif', value: stats?.routers ?? 0, icon: '📡' },
    { label: 'Total Pelanggan', value: stats?.customers ?? 0, icon: '👥' },
    { label: 'Pelanggan Aktif', value: stats?.active ?? 0, icon: '🟢' },
    { label: 'Paket', value: packagesCount ?? 0, icon: '📦' },
    { label: 'Tagihan Belum Lunas', value: stats?.unpaid ?? 0, icon: '📄', warn: true },
    { label: 'Total Piutang', value: formatRupiah(stats?.totalUnpaid), icon: '💰', warn: true },
    { label: 'Voucher', value: `${vouchersUsed ?? 0} / ${vouchersTotal ?? 0}`, icon: '🎫' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Ringkasan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className={`rounded-xl border bg-white p-4 shadow-sm ${c.warn ? 'border-amber-200' : 'border-slate-200'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <div className={`text-xl font-bold ${c.warn ? 'text-amber-600' : 'text-sky-600'}`}>
                    {c.value}
                  </div>
                  <div className="text-xs text-slate-500">{c.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Pendapatan 12 Bulan Terakhir</h3>
          <div className="h-64">
            <Bar
              data={revenueChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { callback: (v) => (v >= 1e6 ? v / 1e6 + 'jt' : v) },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Pelanggan per Tipe</h3>
          <div className="h-64 flex justify-center">
            <Doughnut
              data={customerChart}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Status Tagihan</h3>
          <div className="h-64 flex justify-center">
            <Doughnut
              data={billsChart}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Pembayaran Terbaru</h3>
          {recentPayments?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-2">Tanggal</th>
                    <th className="py-2 pr-2">Pelanggan</th>
                    <th className="py-2 pr-2">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.slice(0, 5).map((p, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 pr-2">{String(p.paid_at || '').slice(0, 16).replace('T', ' ')}</td>
                      <td className="py-2 pr-2">{p.customer_name || '-'}</td>
                      <td className="py-2 pr-2">{formatRupiah(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Belum ada pembayaran.</p>
          )}
        </div>
      </div>
    </div>
  );
}
