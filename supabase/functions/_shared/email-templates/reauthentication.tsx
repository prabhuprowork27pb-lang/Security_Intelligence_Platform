/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your SIP™ verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={wordmark}>Security Intelligence Platform™</Text>
          <Text style={strapline}>SIP™ · Structured · Intelligent · Practicable</Text>
        </Section>
        <Heading style={h1}>Confirm your identity</Heading>
        <Text style={text}>
          Enter the verification code below to continue your secure session on Security Intelligence Platform™:
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          This code expires shortly. If you didn't request it, you can safely ignore this email.
        </Text>
        <Text style={confidential}>
          Confidential · Intended only for the named recipient · © Security Intelligence Platform™
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = { borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '28px' }
const wordmark = { fontFamily: 'Poppins, "Helvetica Neue", Arial, sans-serif', fontSize: '15px', fontWeight: 700 as const, color: '#0D162A', letterSpacing: '-0.01em', margin: 0 }
const strapline = { fontSize: '10px', color: '#1877F2', letterSpacing: '0.18em', textTransform: 'uppercase' as const, fontWeight: 600 as const, margin: '4px 0 0' }
const h1 = { fontFamily: 'Poppins, "Helvetica Neue", Arial, sans-serif', fontSize: '22px', fontWeight: 700 as const, color: '#0D162A', margin: '0 0 16px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = { fontFamily: '"SF Mono", Menlo, Consolas, monospace', fontSize: '28px', fontWeight: 700 as const, color: '#0D162A', letterSpacing: '0.24em', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '16px', textAlign: 'center' as const, margin: '0 0 28px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0 0 12px' }
const confidential = { fontSize: '11px', color: '#94a3b8', margin: 0, letterSpacing: '0.02em' }
