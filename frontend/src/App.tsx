import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-indigo-600">SeoulMinds</Link>
            <div className="space-x-3">
              <Link to="/" className="text-sm text-gray-600 hover:text-indigo-600">Dashboard</Link>
              <Link to="/products" className="text-sm text-gray-600 hover:text-indigo-600">Products</Link>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage id="" onBack={() => window.history.back()} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

