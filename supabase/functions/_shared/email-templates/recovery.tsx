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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your SIP™ credentials</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={wordmark}>Security Intelligence Platform™</Text>
          <Text style={strapline}>SIP™ · Structured · Intelligent · Practicable</Text>
        </Section>
        <Heading style={h1}>Reset your SIP™ credentials</Heading>
        <Text style={text}>
          We received a request to reset the password for your Security Intelligence Platform™ account. Use the secure link below to set a new password.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '0 0 28px' }}>
          <Button style={button} href={confirmationUrl}>
            Reset password
          </Button>
        </Section>
        <Text style={smallText}>
          If the button does not open, copy and paste this link into your browser:
        </Text>
        <Text style={linkFallback}>{confirmationUrl}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request a password reset, no action is needed — your current credentials remain unchanged.
        </Text>
        <Text style={confidential}>
          Confidential · Intended only for the named recipient · © Security Intelligence Platform™
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = { borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '28px' }
const wordmark = { fontFamily: 'Poppins, "Helvetica Neue", Arial, sans-serif', fontSize: '15px', fontWeight: 700 as const, color: '#0D162A', letterSpacing: '-0.01em', margin: 0 }
const strapline = { fontSize: '10px', color: '#1877F2', letterSpacing: '0.18em', textTransform: 'uppercase' as const, fontWeight: 600 as const, margin: '4px 0 0' }
const h1 = { fontFamily: 'Poppins, "Helvetica Neue", Arial, sans-serif', fontSize: '22px', fontWeight: 700 as const, color: '#0D162A', margin: '0 0 16px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 24px' }
const smallText = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 8px' }
const linkFallback = { fontSize: '12px', color: '#1877F2', wordBreak: 'break-all' as const, margin: '0 0 24px' }
const button = { backgroundColor: '#1877F2', color: '#ffffff', fontSize: '14px', fontWeight: 600 as const, borderRadius: '8px', padding: '13px 24px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0 0 12px' }
const confidential = { fontSize: '11px', color: '#94a3b8', margin: 0, letterSpacing: '0.02em' }
