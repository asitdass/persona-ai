'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Trash2, RefreshCw } from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  sourceType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  uploadedAt: string;
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadDocuments = useCallback(async () => {
    const res = await fetch('/api/documents');
    if (res.ok) {
      setDocuments(await res.json());
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    const interval = setInterval(loadDocuments, 5000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      await fetch('/api/documents', { method: 'POST', body: formData });
    }
    setUploading(false);
    loadDocuments();
  }, [loadDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  async function handleDelete(id: string) {
    await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
    loadDocuments();
  }

  async function handleRetry(id: string) {
    await fetch(`/api/documents/${id}/process`, { method: 'POST' });
    loadDocuments();
  }

  const statusBadge = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'processing':
        return <Badge variant="default">Processing...</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="text-gray-500 mt-1">
          Upload documents that represent your professional work. Your AI assistant will use these to answer questions.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
            {uploading ? (
              <p className="text-sm text-gray-600">Uploading...</p>
            ) : isDragActive ? (
              <p className="text-sm text-indigo-600">Drop files here...</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 font-medium">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports PDF, DOCX, Markdown, TXT (max 10MB)
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>{documents.length} document(s) in your knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                      <p className="text-xs text-gray-500">
                        {doc.sourceType} &middot; {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                      {doc.errorMessage && (
                        <p className="text-xs text-red-500 mt-0.5">{doc.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(doc.status)}
                    {doc.status === 'failed' && (
                      <Button variant="ghost" size="icon" onClick={() => handleRetry(doc.id)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
