import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your financial assistant. I can help you understand your financial health, provide insights, and answer questions about managing your money better. How can I help you today?",
    },
    {
      id: 2,
      type: 'user',
      content: 'Is my EMI safe?',
    },
    {
      id: 3,
      type: 'bot',
      content: "Your EMI is 48% of your income, which is quite high and increases your financial fragility. Ideally, your EMI should be below 40% of your monthly income. Consider the following steps:\n\n1. Try to prepay some loans to reduce monthly burden\n2. Avoid taking new loans until EMI ratio improves\n3. Focus on increasing income through side hustles\n4. Build emergency fund to handle unexpected situations",
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const previousMessages = messages;
    const currentInput = inputMessage;
    setInputMessage('');
    setError(null);

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        type: 'user',
        content: currentInput,
      },
    ]);

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Please log in again to use AI assistant.');
      return;
    }

    const history = previousMessages.map((m) => ({
      role: m.type === 'bot' ? 'assistant' : 'user',
      content: m.content,
    }));

    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: currentInput,
          history,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data && data.error) || 'AI service is unavailable right now.';
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            type: 'bot',
            content: msg,
          },
        ]);
        return;
      }

      const data = await res.json();
      const reply: string =
        typeof data.reply === 'string'
          ? data.reply
          : 'Sorry, I could not generate a response right now.';

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'bot',
          content: reply,
        },
      ]);
    } catch (err) {
      console.error(err);
      const msg = 'Network error while talking to AI assistant.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'bot',
          content: msg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/30 pb-32">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Financial Assistant</h1>
              <p className="text-xs text-gray-600">Always here to help</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="p-6 space-y-4 pb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'bot' ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                {message.type === 'bot' ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                  message.type === 'bot'
                    ? 'bg-white border border-gray-200 shadow-sm'
                    : 'bg-blue-500 text-white'
                }`}
              >
                <p
                  className={`text-sm whitespace-pre-line ${
                    message.type === 'bot' ? 'text-gray-700' : 'text-white'
                  }`}
                >
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about your finances..."
                className="flex-1 h-12 rounded-xl border-gray-200 bg-gray-50"
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl disabled:opacity-60"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
            {error && (
              <p className="text-xs text-red-600 text-center mt-2">
                {error}
              </p>
            )}
            <p className="text-xs text-gray-500 text-center mt-2">
              AI-powered insights based on your financial profile
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
