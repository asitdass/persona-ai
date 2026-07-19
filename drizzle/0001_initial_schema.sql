-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  headline TEXT,
  about TEXT,
  skills JSONB DEFAULT '[]',
  contact_links JSONB DEFAULT '{}',
  portfolio_url TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Assistants table
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'AI Assistant',
  welcome_message TEXT DEFAULT 'Hi! Ask me anything.',
  theme_color TEXT DEFAULT '#6366f1',
  avatar_url TEXT,
  personality TEXT DEFAULT 'professional and helpful',
  response_style TEXT DEFAULT 'concise',
  suggested_questions JSONB DEFAULT '[]',
  public_key TEXT NOT NULL UNIQUE,
  allowed_domains JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  source_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Document chunks with vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
  ON document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS document_chunks_profile_idx 
  ON document_chunks (profile_id);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  visitor_id TEXT,
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMP,
  message_count INTEGER DEFAULT 0
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Contact requests table
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY profiles_select ON profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (user_id = auth.uid());

-- Assistants: access via profile ownership
CREATE POLICY assistants_select ON assistants FOR SELECT 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY assistants_insert ON assistants FOR INSERT 
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY assistants_update ON assistants FOR UPDATE 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Documents: access via profile ownership
CREATE POLICY documents_select ON documents FOR SELECT 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY documents_insert ON documents FOR INSERT 
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY documents_update ON documents FOR UPDATE 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY documents_delete ON documents FOR DELETE 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Document chunks: access via profile ownership
CREATE POLICY document_chunks_select ON document_chunks FOR SELECT 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Conversations: access via assistant ownership
CREATE POLICY conversations_select ON conversations FOR SELECT 
  USING (assistant_id IN (
    SELECT a.id FROM assistants a 
    JOIN profiles p ON a.profile_id = p.id 
    WHERE p.user_id = auth.uid()
  ));

-- Messages: access via conversation ownership
CREATE POLICY messages_select ON messages FOR SELECT 
  USING (conversation_id IN (
    SELECT c.id FROM conversations c 
    JOIN assistants a ON c.assistant_id = a.id 
    JOIN profiles p ON a.profile_id = p.id 
    WHERE p.user_id = auth.uid()
  ));

-- Contact requests: access via assistant ownership
CREATE POLICY contact_requests_select ON contact_requests FOR SELECT 
  USING (assistant_id IN (
    SELECT a.id FROM assistants a 
    JOIN profiles p ON a.profile_id = p.id 
    WHERE p.user_id = auth.uid()
  ));
