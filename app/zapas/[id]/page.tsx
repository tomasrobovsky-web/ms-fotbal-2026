export default function ZapasDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Detail zápasu #{params.id}</h1>
      <p className="text-gray-400">Načítání…</p>
    </div>
  );
}
