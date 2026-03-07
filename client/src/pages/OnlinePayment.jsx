export default function OnlinePayment() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Online Payment</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-500">Konfigurasi gateway pembayaran online (Midtrans, Xendit, dll.) dapat ditambahkan di sini untuk menerima pembayaran tagihan secara online.</p>
      </div>
    </div>
  );
}
