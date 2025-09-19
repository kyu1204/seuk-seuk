-- Add expires_at column to documents table
ALTER TABLE documents ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Add comment to the column
COMMENT ON COLUMN documents.expires_at IS 'Document expiration timestamp';