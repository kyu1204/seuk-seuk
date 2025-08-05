-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE document_status AS ENUM ('draft', 'published', 'completed', 'expired');
CREATE TYPE signature_status AS ENUM ('pending', 'signed');

-- Documents table - main documents metadata
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Storage path
    file_size INTEGER,
    mime_type VARCHAR(100),
    status document_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Signature areas table - defines where signatures should be placed
CREATE TABLE signature_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    required BOOLEAN DEFAULT true,
    signer_name VARCHAR(255),
    signer_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document shares table - manages sharing links and access
CREATE TABLE document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    short_url VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT, -- bcrypt hash if password protected
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Signatures table - stores actual signature data
CREATE TABLE signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    signature_area_id UUID REFERENCES signature_areas(id) ON DELETE CASCADE,
    signature_data TEXT NOT NULL, -- base64 signature image
    signer_name VARCHAR(255),
    signer_email VARCHAR(255),
    signer_ip INET,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    status signature_status DEFAULT 'signed'
);

-- Document versions table - tracks original and signed versions
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_type VARCHAR(20) NOT NULL, -- 'original', 'signed'
    file_path TEXT NOT NULL, -- Storage path
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- User preferences table - extends auth.users for app-specific settings
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'ko',
    theme VARCHAR(10) DEFAULT 'light',
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_signature_areas_document_id ON signature_areas(document_id);
CREATE INDEX idx_document_shares_short_url ON document_shares(short_url);
CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_signatures_document_id ON signatures(document_id);
CREATE INDEX idx_signatures_signature_area_id ON signatures(signature_area_id);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();