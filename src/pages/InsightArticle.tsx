import { Link, useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { getInsightArticle, INSIGHT_ARTICLES } from "@/data/insightArticles";
import InsightBody from "@/components/InsightBody";
import { useHasFullAccess } from "@/hooks/useHasFullAccess";
import { BRAND } from "@/lib/brand";
import StudioInquiryDialog from "@/components/StudioInquiryDialog";
import IntelligentCommunity from "@/components/IntelligentCommunity";

const InsightArticlePage = () => {
  const { slug = "" } = useParams();
  const article = getInsightArticle(slug);
  const { hasFullAccess, isAuthenticated, loading } = useHasFullAccess();

  if (!article) {
    return (
      <div className="min-h-dvh bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground mb-3">
            Not found
          </p>
          <h1 className="font-heading text-3xl font-semibold mb-4">
            That narrative isn't available.
          </h1>
          <Button asChild>
            <Link to="/insights">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Intelligence Insights
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const related = INSIGHT_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title={`${article.title} — Intelligence Insights`}
        description={article.dek}
        path={`/insights/${article.slug}`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.dek,
          author: { "@type": "Organization", name: article.author },
          datePublished: article.published,
          articleSection: article.category,
          publisher: {
            "@type": "Organization",
            name: "Security Intelligence Platform",
          },
        }}
      />
      <SiteHeader />

      {/* Header */}
      <section className="border-b border-border/40 bg-gradient-to-b from-background via-background to-card">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-3xl">
          <Link
            to="/insights"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3 w-3" />
            Intelligence Insights
          </Link>
          <Badge variant="secondary" className="mb-4">
            {article.category}
          </Badge>
          <h1 className="font-heading font-semibold text-3xl md:text-5xl tracking-tight leading-[1.08] mb-5">
            {article.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
            {article.dek}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>{article.author}</span>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <span>{article.published}</span>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <span>{article.read}</span>
          </div>
        </div>
      </section>

      {/* Body */}
      <article className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-3xl">
        {article.isPremiumOnly ? (
          <PremiumBlock />
        ) : (
          <>
            <InsightBody source={article.teaser || ""} />

            {loading ? (
              <div className="mt-10 h-32 rounded-xl border border-dashed border-border/60 bg-muted/20 animate-pulse" />
            ) : hasFullAccess ? (
              <>
                <div className="my-8 flex items-center gap-3 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3 text-xs uppercase tracking-[0.22em] text-secondary font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  Full intelligence access · {BRAND.shortTm} subscriber
                </div>
                <InsightBody source={article.body || ""} />
              </>
            ) : (
              <Paywall isAuthenticated={isAuthenticated} />
            )}
          </>
        )}
      </article>

      <IntelligentCommunity source={`insight:${article.slug}`} />

      {/* Related */}
      <section className="container mx-auto px-4 md:px-6 py-14 md:py-20 max-w-5xl">
        <p className="text-[11px] uppercase tracking-[0.28em] text-secondary font-semibold mb-3 text-center">
          More from the field
        </p>
        <h2 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-center mb-10">
          Continue the narrative.
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {related.map((r) => (
            <Link
              key={r.slug}
              to={`/insights/${r.slug}`}
              className="group rounded-xl border border-border/60 bg-card p-6 hover:border-secondary/40 hover:shadow-md transition-all"
            >
              <span className="text-[10px] uppercase tracking-[0.18em] text-secondary font-semibold">
                {r.category}
              </span>
              <h3 className="font-heading font-semibold text-base leading-snug mt-3 mb-3">
                {r.title}
              </h3>
              <p className="text-xs text-muted-foreground/80 line-clamp-3">
                {r.dek}
              </p>
              <span className="inline-flex items-center gap-1 text-secondary font-semibold text-xs mt-4">
                Read <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

const PremiumBlock = () => {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-amber-500/30 bg-card p-8 md:p-12 text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl opacity-60" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl opacity-60" />

        <div className="flex flex-col items-center justify-center max-w-2xl mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 border border-amber-500/20 shadow-inner">
            <Lock className="h-6 w-6 animate-pulse" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.28em] text-amber-500 font-semibold mb-3">
            Premium Narrative Archive
          </span>
          <h3 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-4">
            This narrative is reserved for the Premium Version.
          </h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">
            Detailed case studies, regulatory translations, and operational playbooks are reserved for premium version subscribers of the {BRAND.primary} platform. Upgrade today to unlock the full archive of intelligence insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button asChild size="lg" className="min-h-[50px] px-8 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              <Link to="/diagnostic/start">
                Unlock Premium (Security Selfie™)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <StudioInquiryDialog
              trigger={
                <Button size="lg" variant="outline" className="min-h-[50px] px-8 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                  Request Security Studio™
                </Button>
              }
            />
          </div>

          <p className="mt-8 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/50">
            Confidential · Verified Members Only · Indian Context Focus
          </p>
        </div>
      </div>
    </div>
  );
};

const Paywall = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <div className="relative mt-10">
      {/* Soft fade over the lower edge */}
      <div className="pointer-events-none absolute -top-32 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background" />

      <div className="rounded-2xl border border-secondary/30 bg-card p-7 md:p-10">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-4 w-4 text-secondary" />
          <p className="text-[11px] uppercase tracking-[0.25em] text-secondary font-semibold">
            Full narrative — Intelligence access
          </p>
        </div>
        <h3 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight mb-3">
          Continue reading the full operational narrative.
        </h3>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl">
          The remainder of this article — including the case comparisons,
          recommended interventions and the field calibration rubric — is
          available to {BRAND.shortTm} subscribers. Run a Security Selfie™ or
          engage Security Studio™ to unlock the full Intelligence Insights
          archive.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="min-h-[48px]">
            <Link to="/diagnostic/start">
              Run a Security Selfie™
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <StudioInquiryDialog
            trigger={
              <Button size="lg" variant="outline" className="min-h-[48px]">
                Engage Security Studio™
              </Button>
            }
          />
          {!isAuthenticated && (
            <Button asChild size="lg" variant="ghost" className="min-h-[48px]">
              <Link to="/auth">Already a subscriber? Sign in</Link>
            </Button>
          )}
        </div>

        <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Privacy-conscious · Confidential · No vendor noise
        </p>
      </div>
    </div>
  );
};

export default InsightArticlePage;
