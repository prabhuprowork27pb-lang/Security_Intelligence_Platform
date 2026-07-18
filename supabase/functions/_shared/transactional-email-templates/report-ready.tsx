/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ReportReadyProps {
  recipientName?: string
  siteName?: string
}

const COMMAND_CENTRE_URL = 'https://securityintelplatform.com/reports'

const Email = ({ recipientName, siteName }: ReportReadyProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Security Intelligence Report is ready in your Command Centre</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={wordmark}>Security Intelligence Platform™</Text>
          <Text style={strapline}>SIP™ · Structured · Intelligent · Practicable</Text>
        </Section>
        <Heading style={h1}>Your Security Intelligence Report is ready</Heading>
        <Text style={text}>
          {recipientName ? `Hi ${recipientName},` : 'Hello,'}
        </Text>
        <Text style={text}>
          The reviewed Security Intelligence Report for{' '}
          <strong>{siteName ?? 'your site'}</strong> has been validated by our
          specialist review panel and is now available in your SIP Command
          Centre.
        </Text>
        <Text style={text}>
          For your security, reports are not attached to email. Please sign in
          to review and download your report.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '8px 0 28px' }}>
          <Button style={button} href={COMMAND_CENTRE_URL}>
            Sign in to your Command Centre
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Confidential · Intended only for the named recipient · © Security
          Intelligence Platform™
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your Security Intelligence Report is ready',
  displayName: 'Security Intelligence Report ready',
  previewData: {
    recipientName: 'Priya',
    siteName: 'Bengaluru — Tech Park 1',
  },
} satisfies TemplateEntry<ReportReadyProps>

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = {
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '16px',
  marginBottom: '28px',
}
const wordmark = {
  fontFamily: 'Poppins, "Helvetica Neue", Arial, sans-serif',
  fontSize: '15px',
  fontWeight: 700 as const,
  color: '#0D162A',
  letterSpacing: '-0.01em',
  margin: 0,
}
const strapline = {
  fontSize: '10px',
  color: '#1877F2',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  fontWeight: 600 as const,
  margin: '4px 0 0',
}
const h1 = {
  fontFamily: 'Poppins, "Helvetica Neue", Arial, sans-serif',
  fontSize: '22px',
  fontWeight: 700 as const,
  color: '#0D162A',
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#1877F2',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600 as const,
  borderRadius: '8px',
  padding: '13px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0 0 12px' }
