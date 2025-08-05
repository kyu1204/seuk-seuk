-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('documents', 'documents', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    ('signed-documents', 'signed-documents', false, 52428800, ARRAY['image/png', 'application/pdf']),
    ('signatures', 'signatures', false, 5242880, ARRAY['image/png']);

-- Storage policies for documents bucket
-- Users can upload documents to their own folder
CREATE POLICY "Users can upload documents to their own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own documents
CREATE POLICY "Users can view their own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own documents
CREATE POLICY "Users can update their own documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for signed-documents bucket
-- Users can upload signed documents to their own folder
CREATE POLICY "Users can upload signed documents to their own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'signed-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own signed documents
CREATE POLICY "Users can view their own signed documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'signed-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow public access to signed documents with valid share link (handled in app logic)
CREATE POLICY "Public can view signed documents with valid share" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'signed-documents' 
        AND EXISTS (
            SELECT 1 FROM document_shares ds
            JOIN documents d ON d.id = ds.document_id
            WHERE d.user_id::text = (storage.foldername(name))[1]
            AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
        )
    );

-- Storage policies for signatures bucket
-- Anyone can upload signatures (temporary, will be cleaned up)
CREATE POLICY "Anyone can upload signatures" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'signatures');

-- Anyone can view signatures (needed for document generation)
CREATE POLICY "Anyone can view signatures" ON storage.objects
    FOR SELECT USING (bucket_id = 'signatures');

-- Only system can delete signatures (cleanup job)
CREATE POLICY "System can delete signatures" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'signatures' 
        AND auth.uid() IS NULL -- Service role only
    );

-- Create a function to clean up old signature files
CREATE OR REPLACE FUNCTION cleanup_old_signatures()
RETURNS void AS $$
BEGIN
    -- Delete signature files older than 24 hours
    DELETE FROM storage.objects
    WHERE bucket_id = 'signatures'
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to generate signed document
CREATE OR REPLACE FUNCTION generate_signed_document_version(doc_id UUID)
RETURNS UUID AS $$
DECLARE
    version_id UUID;
    doc_user_id UUID;
    signed_path TEXT;
BEGIN
    -- Get document owner
    SELECT user_id INTO doc_user_id 
    FROM documents 
    WHERE id = doc_id;
    
    IF doc_user_id IS NULL THEN
        RAISE EXCEPTION 'Document not found';
    END IF;
    
    -- Generate signed document path
    signed_path := doc_user_id::text || '/' || doc_id::text || '/signed_' || extract(epoch from now())::bigint || '.png';
    
    -- Create new document version record
    INSERT INTO document_versions (document_id, version_type, file_path, created_by)
    VALUES (doc_id, 'signed', signed_path, doc_user_id)
    RETURNING id INTO version_id;
    
    -- Update document status to completed
    UPDATE documents 
    SET status = 'completed', updated_at = NOW()
    WHERE id = doc_id;
    
    RETURN version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;