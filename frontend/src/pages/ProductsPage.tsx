import React, { useEffect, useState, useRef } from 'react';
import { getProducts } from '../api';
import { useNavigate } from 'react-router-dom';

export interface ProductItem {
  id: string;
  product_id?: string;
  title?: string;
  brand?: string;
  price?: number;
  original_price?: number;
  discount_rate?: number;
  images?: string[];
  is_soldout?: boolean;
}

function Price({ price, original, discount }: { price?: number; original?: number; discount?: number }) {
  if (!price) return <div className="text-sm font-bold">-</div>;
  const fmt = new Intl.NumberFormat('ko-KR');
  return (
    <div className="flex flex-col items-end">
      <div className="text-sm font-bold">{fmt.format(price)} KRW</div>
      {original && original > price ? (
        <div className="text-xs text-gray-400 line-through">{fmt.format(original)} KRW</div>
      ) : null}
      {discount ? <div className="text-xs text-red-500">{discount}% off</div> : null}
    </div>
  );
}

export default function ProductsPage({ onBack }: { onBack?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<number | null>(null);

  const loadProducts = async (p = page, q = query) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(p, limit, q || undefined);
      setProducts(data.items || []);
      setCount(data.count || 0);
    } catch (err) {
      setError((err as Error).message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1, '');
    // close on ESC
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onBack) onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // @ts-ignore
    debounceRef.current = window.setTimeout(() => {
      setPage(1);
      loadProducts(1, query);
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    loadProducts(page, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil((count || products.length) / limit));
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={onBack} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Back</button>
            <h1 className="text-2xl font-bold ml-4 inline">Products</h1>
            <p className="text-sm text-gray-500">Browse seeded product catalog</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="px-3 py-2 border rounded-md text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="h-44 bg-gray-100" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No products available</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <article key={p.id} className="rounded-lg overflow-hidden bg-white shadow hover:shadow-lg transition border">
                  <div className="aspect-[4/3] bg-gray-50 overflow-hidden flex items-center justify-center">
                    {p.images && p.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-400">No image</div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{p.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{p.brand}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <Price price={p.price} original={p.original_price} discount={p.discount_rate} />
                      <div>
                        {p.is_soldout ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded">Sold</span>
                        ) : (
                          <button onClick={() => navigate(`/products/${p.id}`)} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded">View</button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">Showing {(page - 1) * limit + 1} - {Math.min(page * limit, count || products.length)} of {count || products.length}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  Prev
                </button>
                <div className="text-sm">Page {page} / {totalPages}</div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
