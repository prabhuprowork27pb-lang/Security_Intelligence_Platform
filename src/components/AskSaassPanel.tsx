import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Send, ChevronDown, ChevronUp, Pin, PinOff, Lock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SmartyActionCards } from "@/components/SmartyActionCards";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

const SMARTY_FREE_LIMIT = 5;

interface Message {
  role: "user" | "assistant";
  content: string;
  isPremiumNotice?: boolean;
  pinned?: boolean;
  pinnedId?: string;
  pairedQuestion?: string;
}

interface AskSaassPanelProps {
  assessmentId: string;
  assessmentData: any;
  domainScores: any[];
  prefillQuestion?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fired when an answer is pinned/unpinned so parent can refresh the report. */
  onPinnedChange?: () => void;
}

const EXAMPLE_QUESTIONS = [
  "Why is my perimeter score low and what should I fix in the next 30 days?",
  "How do I present these results to my CEO in 5 minutes?",
  "What should I do first if my budget is limited?",
  "Which domains are most critical for regulatory or client audits?",
];

export const AskSaassPanel = ({
  assessmentId,
  assessmentData,
  domainScores,
  prefillQuestion,
  open,
  onOpenChange,
  onPinnedChange,
}: AskSaassPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [quotaReached, setQuotaReached] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isBetaTester } = useUserRole();
  const isControlled = open !== undefined;
  const isOpen = isControlled ? !!open : internalOpen;
  const setIsOpen = (val: boolean) => {
    if (isControlled) onOpenChange?.(val);
    else setInternalOpen(val);
  };

  useEffect(() => {
    if (prefillQuestion) {
      setInput(prefillQuestion);
      setIsOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillQuestion]);

  // SMARTY free-tier quota — 5 complimentary sessions per user, tracked in
  // localStorage. Admins and beta testers are exempt.
  useEffect(() => {
    if (isAdmin || isBetaTester) return;
    const uid = assessmentData?.user_id ?? "anon";
    const key = `smarty_sessions_${uid}`;
    const used = parseInt(localStorage.getItem(key) ?? "0", 10);
    if (used >= SMARTY_FREE_LIMIT) {
      setQuotaReached(true);
    } else {
      localStorage.setItem(key, String(used + 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isBetaTester, assessmentData?.user_id]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const sentQuestion = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let signatureFinding: string | null = null;
      try {
        const parsed = JSON.parse(assessmentData.remediation_plan || "{}");
        signatureFinding = parsed?.signature_finding ?? null;
      } catch { /* ignore */ }

      const { data, error } = await supabase.functions.invoke("ask-saass", {
        body: {
          question: sentQuestion,
          assessment: {
            overall_score: assessmentData.overall_score_0_100,
            maturity: assessmentData.overall_maturity_1_5,
            risk_posture: assessmentData.risk_posture,
            domain_scores: domainScores,
            executive_summary: assessmentData.executive_summary,
            remediation_plan: assessmentData.remediation_plan,
            signature_finding: signatureFinding,
            site: {
              name: assessmentData.sites?.name,
              city: assessmentData.sites?.city,
              site_type: assessmentData.sites?.site_type,
              criticality: assessmentData.sites?.criticality,
              headcount_band: assessmentData.sites?.headcount_band,
            },
          },
        },
      });

      if (error || !data?.answer) {
        throw error || new Error("No answer returned");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        pairedQuestion: sentQuestion,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "SMARTY™ AI Security Advisor is a Premium Feature available exclusively for subscribed members.",
        isPremiumNotice: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (idx: number) => {
    const msg = messages[idx];
    if (!msg || msg.role !== "assistant" || !msg.pairedQuestion) return;

    try {
      if (msg.pinned && msg.pinnedId) {
        const { error } = await (supabase as any)
          .from("pinned_smarty_answers")
          .delete()
          .eq("id", msg.pinnedId);
        if (error) throw error;
        setMessages((prev) =>
          prev.map((m, i) => (i === idx ? { ...m, pinned: false, pinnedId: undefined } : m))
        );
        toast({ title: "Removed from report", description: "This SMARTY answer is no longer pinned." });
      } else {
        // Try to detect a domain in the question
        const matchedDomain = domainScores.find((d) =>
          msg.pairedQuestion!.toLowerCase().includes(String(d.domain_name).toLowerCase())
        );
        const { data, error } = await (supabase as any)
          .from("pinned_smarty_answers")
          .insert({
            assessment_id: assessmentId,
            question: msg.pairedQuestion,
            answer: msg.content,
            domain_key: matchedDomain?.domain_key ?? null,
            domain_name: matchedDomain?.domain_name ?? null,
          })
          .select("id")
          .single();
        if (error) throw error;
        setMessages((prev) =>
          prev.map((m, i) => (i === idx ? { ...m, pinned: true, pinnedId: data?.id } : m))
        );
        toast({
          title: "Pinned to report",
          description: "This SMARTY answer will appear in this assessment's report and PDF.",
        });
      }
      onPinnedChange?.();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Could not update pin", description: e?.message ?? "Please try again.", variant: "destructive" });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="sticky top-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4">
            <div className="text-left">
              <div className="font-semibold">SMARTY</div>
              <div className="text-xs text-muted-foreground font-normal">Your Security Advisor</div>
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Get practical security advice from a senior consultant. Pin answers to include them in this assessment's report.
            </p>
            <ScrollArea className="h-[28rem] mb-4 border rounded p-3">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center py-4">Try asking:</p>
                  <div className="space-y-2">
                    {EXAMPLE_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(q)}
                        className="w-full text-left text-xs p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx}>
                      {msg.isPremiumNotice ? (
                        <div className="mr-6 my-2 rounded-xl border border-amber-500/40 bg-amber-500/[0.08] p-4 space-y-2.5 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-amber-500/20 text-amber-500">
                              <Lock className="h-4 w-4" />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                              🔒 SMARTY™ Premium Feature
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-foreground leading-snug">
                            Interactive AI Security Advisor is reserved exclusively for subscribed members.
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Upgrade your organization plan or request a Security Studio™ engagement to unlock full AI consulting analysis.
                          </p>
                        </div>
                      ) : (
                        <div
                          className={`text-sm ${msg.role === "user"
                              ? "bg-primary text-primary-foreground p-2 rounded ml-8"
                              : "bg-muted p-2 rounded mr-8"
                            }`}
                        >
                          {msg.content}
                        </div>
                      )}
                      {msg.role === "assistant" && !msg.isPremiumNotice && msg.pairedQuestion && (
                        <>
                          <div className="mr-8">
                            <SmartyActionCards answer={msg.content} />
                          </div>
                          <div className="mr-8 mt-1 flex justify-end">
                            <Button
                              size="sm"
                              variant={msg.pinned ? "default" : "ghost"}
                              className="h-7 px-2 text-xs"
                              onClick={() => togglePin(idx)}
                            >
                              {msg.pinned ? (
                                <>
                                  <PinOff className="h-3 w-3 mr-1" /> Unpin from report
                                </>
                              ) : (
                                <>
                                  <Pin className="h-3 w-3 mr-1" /> Pin to report
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {loading && <div className="bg-muted p-2 rounded mr-8 text-sm">Thinking...</div>}
                </div>
              )}
            </ScrollArea>
            {quotaReached ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-center space-y-2">
                <div className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <Lock className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  You've used your 5 complimentary SMARTY sessions
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  SMARTY Premium is launching soon. You'll be the first to know when it's available.
                </p>
                <Button size="sm" onClick={() => (window.location.href = "/contact")}>
                  Get early access →
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="What should I prioritise first?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={loading}
                />
                <Button onClick={handleSend} disabled={loading} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
