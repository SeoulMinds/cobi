import React, { useEffect, useState, useRef } from 'react';
import { getProducts } from '../../api';
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
        <div className="flex flex-col">
            <div className="text-sm font-bold">{fmt.format(price)} KRW</div>
            {original && original > price ? (
                <div className="text-xs text-gray-400 line-through">{fmt.format(original)} KRW</div>
            ) : null}
            {discount ? <div className="text-xs text-red-500">{discount}% off</div> : null}
        </div>
    );
}

export default function MainListPage({ onClose }: { onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(24);
    const [count, setCount] = useState(0);
    const [query, setQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const debounceRef = useRef<number | null>(null);
    const navigate = useNavigate();

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
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // debounce search
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

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-6xl bg-white rounded-lg shadow-2xl overflow-hidden ring-1 ring-black/5"
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">Products</h2>
                        <p className="text-sm text-gray-500">Browse the seeded product catalog</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search products..."
                            className="px-3 py-2 border rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button onClick={onClose} aria-label="Close" className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">
                            Close
                        </button>
                    </div>
                </div>

                <div className="p-6">
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
                            <div className={view === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'space-y-4'}>
                                {products.map((p) => (
                                    <article
                                        key={p.id}
                                        className={
                                            view === 'grid'
                                                ? 'rounded-lg overflow-hidden bg-white shadow hover:shadow-lg transition border'
                                                : 'flex gap-4 p-4 bg-white rounded-lg shadow border items-center'
                                        }
                                    >
                                        <div className={view === 'grid' ? 'aspect-[4/3] bg-gray-50 overflow-hidden flex items-center justify-center' : 'w-36 h-36 flex-shrink-0 bg-gray-50 overflow-hidden'}>
                                            {p.images && p.images.length > 0 ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={p.images[0]} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-gray-400 p-4">No image</div>
                                            )}
                                        </div>

                                        <div className={view === 'grid' ? 'p-4' : 'flex-1'}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{p.title}</h3>
                                                    <p className="text-xs text-gray-500 mt-1">{p.brand}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Price price={p.price} original={p.original_price} discount={p.discount_rate} />
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">{p.brand}</span>
                                                    {p.discount_rate ? <span className="text-xs text-red-500">{p.discount_rate}%</span> : null}
                                                </div>

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
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setView('grid')} className={`px-2 py-1 rounded ${view === 'grid' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Grid</button>
                                        <button onClick={() => setView('list')} className={`px-2 py-1 rounded ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>List</button>
                                    </div>
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
        </div>
    );
}
