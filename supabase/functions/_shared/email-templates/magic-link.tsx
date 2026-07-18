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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  token?: string
}

export const MagicLinkEmail = ({ confirmationUrl, token }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your sign-in code · Security Intelligence Platform™</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={wordmark}>Security Intelligence Platform™</Text>
          <Text style={strapline}>SIP™ · Structured · Intelligent · Practicable</Text>
        </Section>
        <Heading style={h1}>Verify your email to continue</Heading>
        <Text style={text}>
          Please enter the {token ? `${token.length}-digit` : ''} code below on the Security Selfie™ verification screen. The code expires in 10 minutes and can only be used once.
        </Text>
        {token ? (
          <Section style={{ textAlign: 'center' as const, margin: '0 0 28px' }}>
            <Text style={otpLabel}>Your verification code</Text>
            <Text style={otpCode}>{token}</Text>
          </Section>
        ) : null}
        <Hr style={hr} />
        <Text style={smallText}>
          Prefer one-click access? Use the link below instead — it signs you in straight away.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
          <Button style={button} href={confirmationUrl}>
            Sign in with one click
          </Button>
        </Section>
        <Text style={footer}>
          You're receiving this because a sign-in was requested for your SIP™ account. If this wasn't you, please ignore this email — no action is needed.
        </Text>
        <Text style={footer}>
          Can't find this email next time? Please also check your <strong>Spam</strong> or <strong>Junk</strong> folder, and add notifications from this domain to your safe-senders list.
        </Text>
        <Text style={confidential}>
          Confidential · Intended only for the named recipient · © Security Intelligence Platform™
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = { borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '28px' }
const wordmark = { fontFamily: 'Poppins, "Helvetica Neue", Arial, sans-serif', fontSize: '15px', fontWeight: 700 as const, color: '#0D162A', letterSpacing: '-0.01em', margin: 0 }
const strapline = { fontSize: '10px', color: '#1877F2', letterSpacing: '0.18em', textTransform: 'uppercase' as const, fontWeight: 600 as const, margin: '4px 0 0' }
const h1 = { fontFamily: 'Poppins, "Helvetica Neue", Arial, sans-serif', fontSize: '22px', fontWeight: 700 as const, color: '#0D162A', margin: '0 0 16px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 24px' }
const smallText = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 12px' }
const otpLabel = { fontSize: '11px', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.18em', fontWeight: 600 as const, margin: '0 0 8px' }
const otpCode = { fontFamily: '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace', fontSize: '36px', fontWeight: 700 as const, color: '#0D162A', letterSpacing: '0.32em', margin: '0 0 4px', padding: '14px 18px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'inline-block' }
const button = { backgroundColor: '#1877F2', color: '#ffffff', fontSize: '14px', fontWeight: 600 as const, borderRadius: '8px', padding: '13px 24px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0 0 12px' }
const confidential = { fontSize: '11px', color: '#94a3b8', margin: 0, letterSpacing: '0.02em' }
