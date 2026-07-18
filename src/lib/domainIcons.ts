import {
  MapPin,
  Shield,
  Lock,
  Users,
  BadgeCheck,
  Video,
  AlertTriangle,
  Brain,
  LifeBuoy,
  FileCheck,
  LucideIcon,
} from "lucide-react";

export const DOMAIN_ICONS: Record<string, LucideIcon> = {
  SITE_PROFILE: MapPin,
  GOVERNANCE: Shield,
  PERIMETER: Lock,
  VISITOR: Users,
  GUARDING: BadgeCheck,
  ESS: Video,
  INCIDENT: AlertTriangle,
  CULTURE: Brain,
  BCP: LifeBuoy,
  COMPLIANCE: FileCheck,
};

export const getDomainIcon = (domainKey: string): LucideIcon => {
  return DOMAIN_ICONS[domainKey] || Shield;
};
