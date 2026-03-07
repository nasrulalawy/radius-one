export default function NeighborList() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Neighbor List</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-500">Daftar tetangga (neighbor) dari router. Integrasi dengan MikroTik wireless neighbor list dapat ditambahkan.</p>
        <p className="mt-2 text-sm text-slate-500">Daftar router terdaftar bisa dipakai untuk mengambil neighbor list per perangkat.</p>
      </div>
    </div>
  );
}
