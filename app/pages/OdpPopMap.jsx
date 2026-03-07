import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiOdpPop } from '../api';

export default function OdpPopMap() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiOdpPop()
      .then((list) => setItems(list.filter((i) => i.latitude && i.longitude)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">ODP | POP - View Map</h1>
        <Link to="/odp-pop" className="text-sky-600 hover:underline text-sm">← Kembali ke list</Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-slate-500">Tidak ada ODP/POP dengan koordinat. Isi latitude/longitude di data ODP/POP.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-slate-600 mb-2">{items.length} titik dengan koordinat. Integrasi peta (Leaflet/Google Maps) bisa ditambahkan di sini.</p>
          <ul className="space-y-1 text-sm">
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> — {item.latitude}, {item.longitude}
                {' '}
                <Link to={`/odp-pop/edit/${item.id}`} className="text-sky-600 hover:underline">Edit</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
