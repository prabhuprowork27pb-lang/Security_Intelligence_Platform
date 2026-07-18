/// <reference types="npm:@types/react@18.3.1" />
import type * as React from 'npm:react@18.3.1'
import { template as reportReady } from './report-ready.tsx'

export interface TemplateEntry<P = any> {
  component: React.ComponentType<P>
  subject: string | ((data: P) => string)
  displayName?: string
  previewData?: P
  to?: string | ((data: P) => string)
}

export const TEMPLATES: Record<string, TemplateEntry<any>> = {
  'report-ready': reportReady,
}
