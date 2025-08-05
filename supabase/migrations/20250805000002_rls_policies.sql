-- Enable Row Level Security on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Documents policies
-- Users can view, insert, update, delete their own documents
CREATE POLICY "Users can manage their own documents" ON documents
    FOR ALL USING (auth.uid() = user_id);

-- Signature areas policies
-- Users can manage signature areas for their own documents
CREATE POLICY "Users can manage signature areas for their documents" ON signature_areas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = signature_areas.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Document shares policies
-- Users can manage shares for their own documents
CREATE POLICY "Users can manage shares for their documents" ON document_shares
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_shares.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Public can view valid shares (for accessing shared documents)
CREATE POLICY "Public can view valid shares" ON document_shares
    FOR SELECT USING (
        expires_at IS NULL OR expires_at > NOW()
    );

-- Signatures policies
-- Users can view signatures for their own documents
CREATE POLICY "Users can view signatures for their documents" ON signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = signatures.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- Anyone can insert signatures for shared documents (with valid share link)
-- This will be handled in application logic with additional validation
CREATE POLICY "Anyone can insert signatures for shared documents" ON signatures
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM document_shares ds
            JOIN documents d ON d.id = ds.document_id
            WHERE ds.document_id = signatures.document_id
            AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
            AND d.status = 'published'
        )
    );

-- Document versions policies
-- Users can manage versions for their own documents
CREATE POLICY "Users can manage versions for their documents" ON document_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_versions.document_id 
            AND documents.user_id = auth.uid()
        )
    );

-- User preferences policies
-- Users can manage their own preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create a function to automatically create user preferences on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user preferences when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create helper function to check if user can access a document via share
CREATE OR REPLACE FUNCTION can_access_shared_document(doc_id UUID, share_url TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- If user owns the document, they can access it
    IF EXISTS (
        SELECT 1 FROM documents 
        WHERE id = doc_id AND user_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- If valid share URL is provided, check if document can be accessed
    IF share_url IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM document_shares ds
            JOIN documents d ON d.id = ds.document_id
            WHERE ds.short_url = share_url
            AND ds.document_id = doc_id
            AND d.status = 'published'
            AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
            AND (ds.max_uses IS NULL OR ds.used_count < ds.max_uses)
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;