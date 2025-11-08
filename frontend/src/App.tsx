import { useState, useEffect } from 'react';
import { sendMessage, getMessages, checkHealth, MessageResponse } from './api';
import ChatPanel from './components/chat/ChatPanel';

interface HealthResponse {
  status: string;
  mongodb: string;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-indigo-600">SeoulMinds - Night Action</h1>
          <p className="text-sm text-gray-500 mt-1">Backend: {backendHealth}</p>
        </div>
      </header>

      {/* Main Content */}
      <ChatPanel />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <p>No messages yet. Send one to get started!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="space-y-2">
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 max-w-xs">
                          {msg.user_message}
                        </div>
                      </div>
                      {/* AI Response */}
                      <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 max-w-xs">
                          {msg.ai_response}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 text-center">{msg.model}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2">
                  {error}
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="border-t p-4 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
