'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink } from 'lucide-react';

export default function WidgetPage() {
  const [assistant, setAssistant] = useState<{
    publicKey: string;
    isPublished: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/assistant')
      .then((r) => r.json())
      .then(setAssistant);
  }, []);

  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || '';

  const embedCode = assistant
    ? `<script src="${appUrl}/widget.js" data-assistant="${assistant.publicKey}" data-url="${appUrl}"></script>`
    : '';

  function handleCopy() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Widget</h1>
        <p className="text-gray-500 mt-1">
          Embed your AI assistant on any website with a single line of code.
        </p>
      </div>

      {!assistant?.isPublished && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-md p-4">
          Your assistant is not published yet. Go to{' '}
          <a href="/dashboard/assistant" className="font-medium underline">
            AI Assistant settings
          </a>{' '}
          and enable &quot;Publish assistant&quot; to make it publicly accessible.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Embed Code</CardTitle>
          <CardDescription>
            Copy this snippet and paste it before the closing &lt;/body&gt; tag of your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
              <code>{embedCode || 'Loading...'}</code>
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopy}
              disabled={!embedCode}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your widget looks</CardDescription>
        </CardHeader>
        <CardContent>
          {assistant?.publicKey ? (
            <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <iframe
                src={`/embed/${assistant.publicKey}`}
                className="w-full h-full"
                title="Widget Preview"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading preview...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Works Everywhere</CardTitle>
          <CardDescription>Compatible with any website or framework</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['React', 'Next.js', 'Vue', 'Angular', 'HTML', 'WordPress', 'Webflow', 'Wix'].map(
              (fw) => (
                <div
                  key={fw}
                  className="bg-gray-50 rounded-md p-3 text-center text-sm font-medium text-gray-700"
                >
                  {fw}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
