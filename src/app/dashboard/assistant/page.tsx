'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface AssistantData {
  name: string;
  welcomeMessage: string;
  themeColor: string;
  personality: string;
  responseStyle: string;
  suggestedQuestions: string[];
  allowedDomains: string[];
  isPublished: boolean;
}

export default function AssistantPage() {
  const [assistant, setAssistant] = useState<AssistantData>({
    name: '',
    welcomeMessage: '',
    themeColor: '#6366f1',
    personality: 'professional and helpful',
    responseStyle: 'concise',
    suggestedQuestions: [],
    allowedDomains: [],
    isPublished: false,
  });
  const [questionsText, setQuestionsText] = useState('');
  const [domainsText, setDomainsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssistant();
  }, []);

  async function loadAssistant() {
    const res = await fetch('/api/assistant');
    if (res.ok) {
      const data = await res.json();
      if (data) {
        setAssistant(data);
        setQuestionsText((data.suggestedQuestions || []).join('\n'));
        setDomainsText((data.allowedDomains || []).join('\n'));
      }
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/assistant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assistant,
          suggestedQuestions: questionsText.split('\n').map((q) => q.trim()).filter(Boolean),
          allowedDomains: domainsText.split('\n').map((d) => d.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500 mt-1">Customize how your AI assistant behaves and appears to visitors.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md p-3">
            Assistant settings saved!
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>Name and greeting for your assistant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assistant Name</Label>
              <Input
                id="name"
                value={assistant.name}
                onChange={(e) => setAssistant({ ...assistant, name: e.target.value })}
                placeholder="e.g., Alex's AI Assistant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcome">Welcome Message</Label>
              <Textarea
                id="welcome"
                value={assistant.welcomeMessage}
                onChange={(e) => setAssistant({ ...assistant, welcomeMessage: e.target.value })}
                placeholder="Hi! I'm Alex's AI assistant. Ask me anything about Alex's work."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Visual customization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="color">Theme Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color"
                  value={assistant.themeColor}
                  onChange={(e) => setAssistant({ ...assistant, themeColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={assistant.themeColor}
                  onChange={(e) => setAssistant({ ...assistant, themeColor: e.target.value })}
                  className="w-32"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behavior</CardTitle>
            <CardDescription>How your assistant communicates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personality">Personality</Label>
              <Input
                id="personality"
                value={assistant.personality}
                onChange={(e) => setAssistant({ ...assistant, personality: e.target.value })}
                placeholder="e.g., professional and helpful"
              />
              <p className="text-xs text-gray-400">Describes how the assistant should behave</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="style">Response Style</Label>
              <select
                id="style"
                value={assistant.responseStyle}
                onChange={(e) => setAssistant({ ...assistant, responseStyle: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
              >
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
                <option value="conversational">Conversational</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested Questions</CardTitle>
            <CardDescription>Questions shown to visitors as conversation starters (one per line)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              placeholder={"Tell me about this person\nWhat projects have they built?\nWhat technologies do they use?"}
              rows={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Control where your widget can be embedded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domains">Allowed Domains (one per line, leave empty to allow all)</Label>
              <Textarea
                id="domains"
                value={domainsText}
                onChange={(e) => setDomainsText(e.target.value)}
                placeholder={"yourportfolio.com\nyourname.dev"}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={assistant.isPublished}
                onChange={(e) => setAssistant({ ...assistant, isPublished: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="published">Publish assistant (make it publicly accessible)</Label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
}
