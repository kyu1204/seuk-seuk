-- ============================================================
-- Document Templates 기능 마이그레이션
-- Pro / Enterprise 플랜 전용: 원본 + 서명영역 레이아웃을
-- 불변 템플릿으로 저장하고 발행을 반복 생성하기 위한 스키마
-- ============================================================

-- ------------------------------------------------------------
-- 1. document_templates : 불변 원본 템플릿
-- ------------------------------------------------------------
CREATE TABLE document_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  file_url    TEXT NOT NULL,                 -- 템플릿 전용 storage 경로 ({user_id}/templates/{uuid}.{ext})
  file_type   VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'pdf')),
  page_count  INTEGER NOT NULL DEFAULT 1,
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_templates_user_id ON document_templates(user_id);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates"
  ON document_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON document_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON document_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON document_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. template_signature_areas : 레이아웃 좌표만 (서명 데이터 없음)
-- ------------------------------------------------------------
CREATE TABLE template_signature_areas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
  area_index   INTEGER NOT NULL,
  x            NUMERIC,
  y            NUMERIC,
  width        NUMERIC,
  height       NUMERIC,
  page_number  INTEGER NOT NULL DEFAULT 0,
  area_type    VARCHAR(20) NOT NULL DEFAULT 'signature' CHECK (area_type IN ('signature', 'text')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_signature_areas_template_id ON template_signature_areas(template_id);

ALTER TABLE template_signature_areas ENABLE ROW LEVEL SECURITY;

-- 소유한 템플릿의 영역만 접근 가능 (template_id → document_templates.user_id)
CREATE POLICY "Users can view their own template areas"
  ON template_signature_areas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM document_templates t
      WHERE t.id = template_signature_areas.template_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own template areas"
  ON template_signature_areas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_templates t
      WHERE t.id = template_signature_areas.template_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own template areas"
  ON template_signature_areas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM document_templates t
      WHERE t.id = template_signature_areas.template_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own template areas"
  ON template_signature_areas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM document_templates t
      WHERE t.id = template_signature_areas.template_id
        AND t.user_id = auth.uid()
    )
  );
