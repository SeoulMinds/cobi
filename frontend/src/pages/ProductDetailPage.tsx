import React, { useEffect, useState } from 'react';
import { getProduct } from '../api';

export default function ProductDetailPage({ id, onBack }: { id: string; onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProduct(id);
        setProduct(data);
      } catch (err) {
        setError((err as Error).message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!product) return <div className="p-8 text-center">Product not found</div>;

  const images = product.images || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Back</button>
          <h1 className="text-2xl font-bold">{product.title}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded shadow">
          <div>
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[0]} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="p-12 text-center text-gray-400">No image</div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">{product.brand}</h2>
            <div className="mt-4">
              <div className="text-2xl font-bold">{product.price?.toLocaleString()} KRW</div>
              {product.original_price && product.original_price > product.price ? (
                <div className="text-sm text-gray-400 line-through">{product.original_price.toLocaleString()} KRW</div>
              ) : null}
              {product.discount_rate ? <div className="text-sm text-red-500">{product.discount_rate}% off</div> : null}
            </div>

            <div className="mt-6 text-sm text-gray-700">
              <h3 className="font-semibold">Description</h3>
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>

            <div className="mt-6">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded">Add to cart</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
