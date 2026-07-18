import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, CalendarCheck, Building2 } from "lucide-react";
import { FREE_ASSESSMENT_LIMIT } from "@/config/launchMode";

/**
 * Consultative (non-paywall) experience shown when a user has used all of
 * their complimentary Security Selfie™ assessments.
 */
const QuotaReachedCard = () => {
  return (
    <Card className="border-secondary/30 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-heading">Complimentary access fully used</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          You have used all {FREE_ASSESSMENT_LIMIT} complimentary Security Selfie™ assessments.
          To evaluate additional sites, facilities or business units, connect with
          Security Studio™ for expert-led support.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild size="lg">
          <Link to="/studio">
            <Phone className="mr-2 h-4 w-4" />
            Contact Security Studio™
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/contact">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Schedule Consultation
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link to="/contact">
            <Building2 className="mr-2 h-4 w-4" />
            Request Enterprise Access
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuotaReachedCard;
