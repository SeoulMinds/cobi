import React from 'react';
import { useNavigate } from 'react-router-dom';
import { checkHealth, getMessages, sendMessage, MessageResponse } from '../api';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<string>('checking...');
  const navigate = useNavigate();

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const health = await checkHealth();
        setBackendHealth(`✅ ${health.status} (MongoDB: ${health.mongodb})`);
      } catch {
        setBackendHealth('❌ Backend unreachable');
      }
    };
    checkBackendHealth();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sendMessage({ text: input });
      setMessages([res, ...messages]);
      setInput('');
    } catch (err) {
      setError((err as Error).message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex flex-col">
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-indigo-600">SeoulMinds - Night Action</h1>
          <p className="text-sm text-gray-500 mt-1">Backend: {backendHealth}</p>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col h-[600px]">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">No messages yet. Send one to get started!</div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 max-w-xs">{m.user_message}</div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 max-w-xs">{m.ai_response}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="border-t p-4 bg-white">
                <div className="flex gap-2">
                  <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 px-4 py-2 border rounded" placeholder="Type a message..." />
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Send</button>
                </div>
              </form>
            </div>
          </div>

          <aside className="bg-white rounded-lg shadow-xl p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Info</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-800">Products</p>
                <p className="text-sm text-gray-600">Browse seeded products list</p>
              </div>
              <button onClick={() => navigate('/products')} className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">Products</button>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-600">HackSeoul 2025 • SeoulMinds Night Action Project</div>
      </footer>
    </div>
  );
}
