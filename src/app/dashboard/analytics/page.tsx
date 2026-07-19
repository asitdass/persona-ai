'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, HelpCircle } from 'lucide-react';

interface AnalyticsData {
  conversations: Array<{
    id: string;
    visitorId: string;
    startedAt: string;
    endedAt: string | null;
    messageCount: number;
  }>;
  stats: {
    totalConversations: number;
    uniqueVisitors: number;
  } | null;
  recentQuestions: Array<{
    content: string;
    createdAt: string;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">
          See how visitors interact with your AI assistant.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Conversations
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data?.stats?.totalConversations || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Unique Visitors
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data?.stats?.uniqueVisitors || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Most Asked Questions
          </CardTitle>
          <CardDescription>Recent questions from visitors</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentQuestions && data.recentQuestions.length > 0 ? (
            <div className="space-y-3">
              {data.recentQuestions.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <p className="text-sm text-gray-700">&ldquo;{q.content}&rdquo;</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No conversations yet. Share your widget to start seeing analytics.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>Latest visitor interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.conversations && data.conversations.length > 0 ? (
            <div className="divide-y">
              {data.conversations.map((conv) => (
                <div key={conv.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Visitor {conv.visitorId?.slice(0, 8) || 'anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(conv.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {conv.messageCount || 0} messages
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No conversations yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
