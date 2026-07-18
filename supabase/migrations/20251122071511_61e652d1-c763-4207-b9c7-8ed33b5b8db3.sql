-- Add evidence and comment fields to question_responses table
ALTER TABLE public.question_responses 
ADD COLUMN assessor_comment TEXT,
ADD COLUMN evidence_note TEXT;