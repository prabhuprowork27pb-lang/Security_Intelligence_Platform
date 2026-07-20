import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, Mail, ArrowLeft, KeyRound, Smartphone } from 'lucide-react';
import IntelligenceLogo from '@/components/IntelligenceLogo';
import { BRAND } from '@/lib/brand';
import { Seo } from '@/components/Seo';

const BrandMark = () => (
  <div className="flex flex-col items-center gap-2 mb-4">
    <IntelligenceLogo size={44} className="text-foreground" />
    <div className="text-center leading-tight">
      <p className="font-heading font-bold text-[15px] tracking-tight text-foreground">
        {BRAND.platformTm}
      </p>
      <p className="text-[9px] uppercase tracking-[0.32em] text-secondary font-semibold mt-0.5">
        {BRAND.shortTm} · {BRAND.shortMeaning}
      </p>
    </div>
  </div>
);

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

// Feature flag: set to true when SMS provider is configured & active
const ENABLE_MOBILE_OTP = false;

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // OTP flow state
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verifying, setVerifying] = useState(false);

  // Mobile OTP flow state (preserved for future SMS provider integration)
  const [mobile, setMobile] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpValue, setMobileOtpValue] = useState('');
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileVerifying, setMobileVerifying] = useState(false);
  const [mobileResendCountdown, setMobileResendCountdown] = useState(0);



  // WhatsApp capture interstitial
  const [showMobileCapture, setShowMobileCapture] = useState(false);
  const [mobileInput, setMobileInput] = useState('');
  const [savingMobile, setSavingMobile] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/dashboard';

  // After authentication completes, check for mobile number; if missing,
  // show the WhatsApp capture interstitial before navigating to `next`.
  const checkMobileThenNavigate = async (uid: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('mobile')
        .eq('user_id', uid)
        .maybeSingle();
      if (!profile?.mobile) {
        setShowMobileCapture(true);
        return;
      }
    } catch (e) {
      console.warn('[Auth] mobile check failed, continuing:', e);
    }
    navigate(next, { replace: true });
  };

  useEffect(() => {
    if (user && !showMobileCapture) {
      checkMobileThenNavigate(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  useEffect(() => {
    if (mobileResendCountdown <= 0) return;
    const t = setTimeout(() => setMobileResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [mobileResendCountdown]);



  const handleGoogle = async () => {
    setOauthLoading(true);
    try {
      // Preserve the intended post-login destination separately — the OAuth
      // redirect_uri must be a same-origin public URL, not a protected route.
      try { sessionStorage.setItem('sip:auth:next', next); } catch { }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        toast.error(error.message ?? 'Google sign-in failed. Please try again.');
        setOauthLoading(false);
        return;
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Google sign-in failed. Please try again.');
      setOauthLoading(false);
    }
  };



  // Mobile (Indian +91) OTP flow handlers (ready for SMS provider integration)
  const sendMobileCode = async (e164: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: { channel: 'sms' },
    });
    if (error) throw error;
  };

  const handleSendMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setMobileLoading(true);
    try {
      await sendMobileCode('+91' + mobile);
      setMobileOtpSent(true);
      setMobileResendCountdown(30);
      toast.success('OTP sent via SMS');
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not send OTP. Please try again.');
    } finally {
      setMobileLoading(false);
    }
  };

  const handleVerifyMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileOtpValue.length < 6) return;
    setMobileVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: '+91' + mobile,
        token: mobileOtpValue,
        type: 'sms',
      });
      if (error) throw error;
      toast.success('Signed in');
    } catch (err: any) {
      toast.error('Incorrect code — please check your SMS.');
      setMobileOtpValue('');
    } finally {
      setMobileVerifying(false);
    }
  };

  const handleResendMobileOtp = async () => {
    if (mobileResendCountdown > 0) return;
    try {
      await sendMobileCode('+91' + mobile);
      setMobileResendCountdown(30);
      toast.success('OTP resent');
    } catch (err: any) {
      toast.error(err?.message ?? 'Resend failed');
    }
  };

  const sendCode = async (target: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: target,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setOtpLoading(true);
    try {
      const target = email.trim().toLowerCase();
      await sendCode(target);
      setOtpSent(true);
      setOtpEmail(target);
      setResendCountdown(30);
    } catch (err: any) {
      toast.error(err.message ?? 'Could not send verification code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length < 6) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otpValue,
        type: 'email',
      });
      if (error) throw error;
      toast.success('Signed in');
      // The user effect will route forward (and check mobile).
    } catch (err: any) {
      toast.error('Incorrect code — please check your email.');
      setOtpValue('');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || !otpEmail) return;
    try {
      await sendCode(otpEmail);
      setResendCountdown(30);
      toast.success(`Verification code resent to ${otpEmail}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Resend failed');
    }
  };

  const validatePwd = (): boolean => {
    try { emailSchema.parse(email); } catch (e) { if (e instanceof z.ZodError) { toast.error(e.errors[0].message); return false; } }
    try { passwordSchema.parse(password); } catch (e) { if (e instanceof z.ZodError) { toast.error(e.errors[0].message); return false; } }
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePwd()) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes('Invalid login credentials') ? 'Invalid email or password.' : error.message);
    } else {
      toast.success('Welcome back');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePwd()) return;
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes('already registered') ? 'Email already registered. Please sign in.' : error.message);
    } else {
      toast.success('Account created — check your email to verify.');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(email); } catch (err) { if (err instanceof z.ZodError) return toast.error(err.errors[0].message); }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('Password reset email sent.'); setForgotMode(false); }
  };

  const handleSaveMobile = async () => {
    if (!user) return;
    if (mobileInput.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    setSavingMobile(true);
    try {
      await supabase.from('profiles').upsert(
        { user_id: user.id, mobile: '+91' + mobileInput } as any,
        { onConflict: 'user_id' } as any,
      );
    } catch (e) {
      console.warn('[Auth] mobile save failed:', e);
    } finally {
      setSavingMobile(false);
    }
    navigate(next, { replace: true });
  };

  // Mobile capture interstitial — shown once after first successful auth
  // when the user has no mobile on file.
  if (showMobileCapture && user) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <BrandMark />
            <CardTitle className="text-2xl">One last step</CardTitle>
            <CardDescription>
              Add your WhatsApp number so we can notify you when your Security Selfie™
              report is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <span className="inline-flex items-center px-3 rounded-md border border-input bg-muted text-sm font-medium">
                🇮🇳 +91
              </span>
              <Input
                type="tel"
                value={mobileInput}
                onChange={(e) =>
                  setMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                inputMode="numeric"
                placeholder="98xxxxxxxx"
                className="flex-1"
                autoFocus
              />
            </div>
            <Button
              className="w-full mb-2"
              onClick={handleSaveMobile}
              disabled={savingMobile || mobileInput.length < 10}
            >
              {savingMobile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save & continue'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate(next, { replace: true })}
            >
              Skip for now →
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (forgotMode) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md mb-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <BrandMark />
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>We'll send you a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Link'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setForgotMode(false)}>Back to Sign In</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-4">
      <Seo
        title="Sign in — Security Intelligence Platform™"
        description="Sign in to access your Security Selfie™ assessments and intelligence reports."
        path="/auth"
        noindex
      />
      <div className="w-full max-w-md mb-3">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BrandMark />
          <CardTitle className="text-2xl">Security Selfie</CardTitle>
          <CardDescription>Sign in to access your assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogle}
            disabled={oauthLoading}
          >
            {oauthLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting…</>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 1.7 14.97.75 12 .75 7.7.75 3.99 3.22 2.18 6.84l3.66 2.84C6.71 7 9.14 5 12 5z" /><path fill="#34A853" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.4-1.13 2.59-2.4 3.39l3.6 2.79c2.1-1.94 3.32-4.8 3.32-8.42z" /><path fill="#FBBC05" d="M5.84 14.32c-.21-.62-.33-1.27-.33-1.95s.12-1.34.33-1.95L2.18 7.58A11.21 11.21 0 0 0 .75 12.37c0 1.81.43 3.52 1.43 5.04l3.66-3.09z" /><path fill="#4285F4" d="M12 23.25c2.97 0 5.46-.98 7.28-2.66l-3.6-2.79c-1 .67-2.27 1.07-3.68 1.07-2.86 0-5.29-1.93-6.16-4.55L2.18 17.4C3.99 21.03 7.7 23.25 12 23.25z" /></svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute inset-0 -top-2 mx-auto w-fit bg-card px-2 text-xs text-muted-foreground">or</span>
          </div>

          <Tabs defaultValue="otp" className="w-full">
            <TabsList className={ENABLE_MOBILE_OTP ? "grid w-full grid-cols-3" : "grid w-full grid-cols-2"}>
              {ENABLE_MOBILE_OTP && <TabsTrigger value="mobile">Mobile OTP</TabsTrigger>}
              <TabsTrigger value="otp">Email code</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            {ENABLE_MOBILE_OTP && (
              <TabsContent value="mobile">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile-number">Mobile number</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                        +91
                      </span>
                      <Input
                        id="mobile-number"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit mobile"
                        className="rounded-l-none"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={mobileLoading}
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={handleSendMobileOtp} className="w-full" disabled={mobileLoading || mobile.length < 10}>
                    <Smartphone className="mr-2 h-4 w-4" />Send OTP
                  </Button>
                </div>
              </TabsContent>
            )}



            <TabsContent value="otp">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-email">Email *</Label>
                    <Input
                      id="otp-email"
                      type="email"
                      inputMode="email"
                      autoFocus
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={otpLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={otpLoading}>
                    {otpLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : <><Mail className="mr-2 h-4 w-4" />Send verification code</>}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    We'll email you a 6-digit code to verify your identity.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                      <KeyRound className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We sent a 6-digit code to <span className="font-semibold text-foreground">{otpEmail}</span>
                    </p>
                  </div>
                  <div className="flex justify-center py-1">
                    <InputOTP
                      maxLength={6}
                      value={otpValue}
                      onChange={(v) => setOtpValue(v.replace(/\D/g, ''))}
                      inputMode="numeric"
                      autoFocus
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button type="submit" className="w-full" disabled={verifying || otpValue.length < 6}>
                    {verifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</> : 'Verify & sign in'}
                  </Button>
                  <div className="flex justify-center">
                    {resendCountdown > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Resend in {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-xs text-secondary hover:underline font-medium"
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpValue(''); setResendCountdown(0); }}
                    className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← Use a different email
                  </button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="password">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pw-email">Email</Label>
                      <Input id="pw-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pw-password">Password</Label>
                        <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-secondary hover:underline">
                          Forgot?
                        </button>
                      </div>
                      <Input id="pw-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : 'Sign in'}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="su-email">Email</Label>
                      <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-password">Password</Label>
                      <Input id="su-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</> : 'Create account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
