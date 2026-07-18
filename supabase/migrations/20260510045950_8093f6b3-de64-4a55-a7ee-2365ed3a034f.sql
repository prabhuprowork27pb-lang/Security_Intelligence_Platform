CREATE TABLE public.pinned_smarty_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL,
  domain_key TEXT,
  domain_name TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_pinned_smarty_assessment ON public.pinned_smarty_answers(assessment_id);

ALTER TABLE public.pinned_smarty_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage pinned answers via assessment"
ON public.pinned_smarty_answers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = pinned_smarty_answers.assessment_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = pinned_smarty_answers.assessment_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);