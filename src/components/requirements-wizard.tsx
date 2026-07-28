import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronLeft, ChevronRight, Send, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export type SystemType =
  | "erp"
  | "crm"
  | "hrm"
  | "pos"
  | "accounting"
  | "inventory"
  | "project_management"
  | "help_desk"
  | "other";

export type Industry =
  | "retail"
  | "healthcare"
  | "manufacturing"
  | "education"
  | "hospitality"
  | "construction"
  | "agriculture"
  | "professional_services";

export type UserCount = "1-10" | "11-25" | "26-50" | "51-100" | "100+";
export type Deployment = "cloud" | "on_premise" | "hybrid" | "no_preference";
export type Budget = "under_100" | "100_500" | "500_2000" | "over_2000" | "not_sure";
export type Currency = "USD" | "KES";
export type Timeline = "immediately" | "within_1_month" | "within_3_months" | "researching";
export type Growth = "stable" | "slow" | "fast" | "rapid";
export type Priority =
  | "lowest_cost"
  | "ease_of_use"
  | "most_features"
  | "best_support"
  | "scalability"
  | "security";

export type EssentialFeature =
  | "reporting"
  | "inventory"
  | "sales"
  | "accounting"
  | "payroll"
  | "hr"
  | "crm"
  | "analytics"
  | "api_access";

export type Integration =
  | "ms365"
  | "google_workspace"
  | "payment_gateway"
  | "shopify"
  | "apis"
  | "none";

export type Category = "website" | "workflows" | "ecommerce" | "mobile_app" | "saas" | "custom";

export interface RequirementsProfile {
  systemType: SystemType;
  systemTypeOther: string | null;
  industry: Industry;
  userCount: UserCount;
  deployment: Deployment;
  budget: Budget;
  currency: Currency;
  categories: Category[];
  essentialFeatures: EssentialFeature[];
  integrations: Integration[];
  timeline: Timeline;
  growth: Growth;
  priority: Priority;
  metadata: {
    startedAt: string;
    completedAt: string | null;
    durationSeconds: number | null;
    sessionId: string;
    completionStatus: "complete" | "abandoned";
    lastStepReached: number;
  };
}

interface RequirementsWizardProps {
  onComplete?: (profile: RequirementsProfile) => void;
}

const TOTAL_STEPS = 11;

const LABELS: Record<string, string> = {
  erp: "ERP",
  crm: "CRM",
  hrm: "HRM",
  pos: "POS",
  accounting: "Accounting",
  inventory: "Inventory Management",
  project_management: "Project Management",
  help_desk: "Help Desk",
  other: "Other",
  retail: "Retail",
  healthcare: "Healthcare",
  manufacturing: "Manufacturing",
  education: "Education",
  hospitality: "Hospitality",
  construction: "Construction",
  agriculture: "Agriculture",
  professional_services: "Professional Services",
  "1-10": "1–10 users",
  "11-25": "11–25 users",
  "26-50": "26–50 users",
  "51-100": "51–100 users",
  "100+": "100+ users",
  cloud: "Cloud",
  on_premise: "On-Premise",
  hybrid: "Hybrid",
  no_preference: "No Preference",
  under_100: "Under $100/mo",
  "100_500": "$100–500/mo",
  "500_2000": "$500–2,000/mo",
  over_2000: "Over $2,000/mo",
  not_sure: "Not Sure",
  usd: "USD",
  kes: "KES",
  immediately: "Immediately",
  within_1_month: "Within 1 Month",
  within_3_months: "Within 3 Months",
  researching: "Just Researching",
  stable: "Stable",
  slow: "Slow Growth",
  fast: "Fast Growth",
  rapid: "Rapid Expansion",
  lowest_cost: "Lowest Cost",
  ease_of_use: "Ease of Use",
  most_features: "Most Features",
  best_support: "Best Support",
  scalability: "Scalability",
  security: "Security",
  reporting: "Reporting",
  sales: "Sales",
  payroll: "Payroll",
  hr: "HR",
  analytics: "Analytics",
  api_access: "API Access",
  ms365: "Microsoft 365",
  google_workspace: "Google Workspace",
  payment_gateway: "Payment Gateway",
  shopify: "Shopify",
  apis: "APIs",
  none: "None",
  website: "Website",
  workflows: "Workflows & Automation",
  ecommerce: "E-Commerce",
  mobile_app: "Mobile App",
  saas: "SaaS Platform",
  custom: "Custom Software",
};

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function RequirementsWizard({ onComplete }: RequirementsWizardProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<RequirementsProfile>>({});
  const [otherText, setOtherText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [profile, setProfile] = useState<RequirementsProfile | null>(null);
  const startTime = useMemo(() => Date.now(), []);

  const update = (patch: Partial<RequirementsProfile>) => {
    setAnswers((prev) => ({ ...prev, ...patch }));
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1:
        if (!answers.systemType) return false;
        if (answers.systemType === "other")
          return otherText.trim().length >= 1 && otherText.trim().length <= 60;
        return true;
      case 2:
        return !!answers.industry;
      case 3:
        return !!answers.userCount;
      case 4:
        return !!answers.deployment;
      case 5:
        return !!answers.budget;
      case 6:
        return (answers.categories?.length ?? 0) >= 1;
      case 7:
        return (answers.essentialFeatures?.length ?? 0) >= 1;
      case 8:
        return !!answers.integrations && answers.integrations.length >= 1;
      case 9:
        return !!answers.timeline;
      case 10:
        return !!answers.growth;
      case 11:
        return !!answers.priority;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canNext()) return;
    if (step === TOTAL_STEPS) {
      localStorage.removeItem("needs_assessment");
      const completedAt = new Date().toISOString();
      const finalProfile: RequirementsProfile = {
        systemType: answers.systemType!,
        systemTypeOther: answers.systemType === "other" ? otherText.trim() : null,
        industry: answers.industry!,
        userCount: answers.userCount!,
        deployment: answers.deployment!,
        budget: answers.budget!,
        currency: answers.currency ?? "USD",
        categories: answers.categories ?? [],
        essentialFeatures: answers.essentialFeatures ?? [],
        integrations: answers.integrations ?? [],
        timeline: answers.timeline!,
        growth: answers.growth!,
        priority: answers.priority!,
        metadata: {
          startedAt: new Date(startTime).toISOString(),
          completedAt,
          durationSeconds: Math.round((Date.now() - startTime) / 1000),
          sessionId: generateSessionId(),
          completionStatus: "complete",
          lastStepReached: TOTAL_STEPS,
        },
      };
      setProfile(finalProfile);
      setSubmitted(true);
      onComplete?.(finalProfile);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleEditStep = (target: number) => {
    setStep(target);
  };

  const progress = (step / TOTAL_STEPS) * 100;

  if (submitted && profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Requirements Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryRow
                label="System Type"
                value={
                  LABELS[profile.systemType] +
                  (profile.systemTypeOther ? ` (${profile.systemTypeOther})` : "")
                }
                onEdit={() => handleEditStep(1)}
              />
              <SummaryRow
                label="Industry"
                value={LABELS[profile.industry]}
                onEdit={() => handleEditStep(2)}
              />
              <SummaryRow
                label="Users"
                value={LABELS[profile.userCount]}
                onEdit={() => handleEditStep(3)}
              />
              <SummaryRow
                label="Deployment"
                value={LABELS[profile.deployment]}
                onEdit={() => handleEditStep(4)}
              />
              <SummaryRow
                label="Budget"
                value={`${LABELS[profile.budget]} (${profile.currency})`}
                onEdit={() => handleEditStep(5)}
              />
              <SummaryRow
                label="Categories"
                value={profile.categories.map((c) => LABELS[c]).join(", ")}
                onEdit={() => handleEditStep(6)}
              />
              <SummaryRow
                label="Essential Features"
                value={profile.essentialFeatures.map((f) => LABELS[f]).join(", ")}
                onEdit={() => handleEditStep(7)}
              />
              <SummaryRow
                label="Integrations"
                value={profile.integrations.map((i) => LABELS[i]).join(", ")}
                onEdit={() => handleEditStep(8)}
              />
              <SummaryRow
                label="Timeline"
                value={LABELS[profile.timeline]}
                onEdit={() => handleEditStep(9)}
              />
              <SummaryRow
                label="Growth"
                value={LABELS[profile.growth]}
                onEdit={() => handleEditStep(10)}
              />
              <SummaryRow
                label="Priority"
                value={LABELS[profile.priority]}
                onEdit={() => handleEditStep(11)}
              />
            </div>

            <Separator />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setStep(1);
                }}
              >
                Edit Answers
              </Button>
              <Button
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                Continue to Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle(step)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <Step1
              value={answers.systemType}
              otherText={otherText}
              onOtherTextChange={setOtherText}
              onChange={(v) => update({ systemType: v })}
            />
          )}
          {step === 2 && (
            <Step2 value={answers.industry} onChange={(v) => update({ industry: v })} />
          )}
          {step === 3 && (
            <Step3 value={answers.userCount} onChange={(v) => update({ userCount: v })} />
          )}
          {step === 4 && (
            <Step4 value={answers.deployment} onChange={(v) => update({ deployment: v })} />
          )}
          {step === 5 && (
            <Step5
              value={answers.budget}
              currency={answers.currency}
              onCurrencyChange={(c) => update({ currency: c })}
              onChange={(v) => update({ budget: v })}
            />
          )}
          {step === 6 && (
            <Step6Categories
              value={answers.categories ?? []}
              onChange={(v) => update({ categories: v })}
            />
          )}
          {step === 7 && (
            <Step6
              value={answers.essentialFeatures ?? []}
              onChange={(v) => update({ essentialFeatures: v })}
            />
          )}
          {step === 8 && (
            <Step7
              value={answers.integrations ?? []}
              onChange={(v) => update({ integrations: v })}
            />
          )}
          {step === 9 && (
            <Step8 value={answers.timeline} onChange={(v) => update({ timeline: v })} />
          )}
          {step === 10 && <Step9 value={answers.growth} onChange={(v) => update({ growth: v })} />}
          {step === 11 && (
            <Step10 value={answers.priority} onChange={(v) => update({ priority: v })} />
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              {step > 1 && (
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <Button onClick={handleNext} disabled={!canNext()}>
              {step === TOTAL_STEPS ? (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border p-3">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit} className="shrink-0">
        Edit
      </Button>
    </div>
  );
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return "What type of system are you looking for?";
    case 2:
      return "What industry is your business in?";
    case 3:
      return "How many users will need access?";
    case 4:
      return "What deployment do you prefer?";
    case 5:
      return "What is your estimated budget?";
    case 6:
      return "Which categories are you interested in?";
    case 7:
      return "Which features are essential?";
    case 8:
      return "Do you need integrations?";
    case 9:
      return "When do you plan to implement?";
    case 10:
      return "How do you expect your business to grow?";
    case 11:
      return "What is your highest priority?";
    default:
      return "";
  }
}

const SYSTEM_TYPES: { value: SystemType | "other"; label: string }[] = [
  { value: "erp", label: "ERP" },
  { value: "crm", label: "CRM" },
  { value: "hrm", label: "HRM" },
  { value: "pos", label: "POS" },
  { value: "accounting", label: "Accounting" },
  { value: "inventory", label: "Inventory Management" },
  { value: "project_management", label: "Project Management" },
  { value: "help_desk", label: "Help Desk" },
  { value: "other", label: "Other" },
];

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: "retail", label: "Retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "education", label: "Education" },
  { value: "hospitality", label: "Hospitality" },
  { value: "construction", label: "Construction" },
  { value: "agriculture", label: "Agriculture" },
  { value: "professional_services", label: "Professional Services" },
];

const USER_COUNTS: { value: UserCount; label: string }[] = [
  { value: "1-10", label: "1–10" },
  { value: "11-25", label: "11–25" },
  { value: "26-50", label: "26–50" },
  { value: "51-100", label: "51–100" },
  { value: "100+", label: "100+" },
];

const DEPLOYMENTS: { value: Deployment; label: string }[] = [
  { value: "cloud", label: "Cloud" },
  { value: "on_premise", label: "On-Premise" },
  { value: "hybrid", label: "Hybrid" },
  { value: "no_preference", label: "No Preference" },
];

const BUDGETS_USD: { value: Budget; label: string }[] = [
  { value: "under_100", label: "Under $100/mo" },
  { value: "100_500", label: "$100–500/mo" },
  { value: "500_2000", label: "$500–2,000/mo" },
  { value: "over_2000", label: "Over $2,000/mo" },
  { value: "not_sure", label: "Not Sure" },
];

const BUDGETS_KES: { value: Budget; label: string }[] = [
  { value: "under_100", label: "Under KES 13,000/mo" },
  { value: "100_500", label: "KES 13,000–65,000/mo" },
  { value: "500_2000", label: "KES 65,000–260,000/mo" },
  { value: "over_2000", label: "Over KES 260,000/mo" },
  { value: "not_sure", label: "Not Sure" },
];

const ESSENTIAL_FEATURES: { value: EssentialFeature; label: string }[] = [
  { value: "reporting", label: "Reporting" },
  { value: "inventory", label: "Inventory" },
  { value: "sales", label: "Sales" },
  { value: "accounting", label: "Accounting" },
  { value: "payroll", label: "Payroll" },
  { value: "hr", label: "HR" },
  { value: "crm", label: "CRM" },
  { value: "analytics", label: "Analytics" },
  { value: "api_access", label: "API Access" },
];

const INTEGRATIONS: { value: Integration; label: string }[] = [
  { value: "ms365", label: "Microsoft 365" },
  { value: "google_workspace", label: "Google Workspace" },
  { value: "payment_gateway", label: "Payment Gateway" },
  { value: "shopify", label: "Shopify" },
  { value: "apis", label: "APIs" },
  { value: "none", label: "None" },
];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "workflows", label: "Workflows & Automation" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "mobile_app", label: "Mobile App" },
  { value: "saas", label: "SaaS Platform" },
  { value: "custom", label: "Custom Software" },
];

const TIMELINES: { value: Timeline; label: string }[] = [
  { value: "immediately", label: "Immediately" },
  { value: "within_1_month", label: "Within 1 Month" },
  { value: "within_3_months", label: "Within 3 Months" },
  { value: "researching", label: "Just Researching" },
];

const GROWTHS: { value: Growth; label: string }[] = [
  { value: "stable", label: "Stable" },
  { value: "slow", label: "Slow Growth" },
  { value: "fast", label: "Fast Growth" },
  { value: "rapid", label: "Rapid Expansion" },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "lowest_cost", label: "Lowest Cost" },
  { value: "ease_of_use", label: "Ease of Use" },
  { value: "most_features", label: "Most Features" },
  { value: "best_support", label: "Best Support" },
  { value: "scalability", label: "Scalability" },
  { value: "security", label: "Security" },
];

function SelectionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <div className={`grid gap-3 sm:grid-cols-${columns}`}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-input hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {selected && <Check className="mr-2 h-4 w-4" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SelectionButtons<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-input hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ChipMultiSelect<T extends string>({
  options,
  value,
  onChange,
  exclusive,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  exclusive?: T;
}) {
  const toggle = (item: T) => {
    if (exclusive && item === exclusive) {
      onChange([exclusive]);
      return;
    }
    if (exclusive && value.includes(exclusive)) {
      onChange(value.filter((v) => v !== exclusive));
    }
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-input hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Step1({
  value,
  otherText,
  onOtherTextChange,
  onChange,
}: {
  value: SystemType | undefined;
  otherText: string;
  onOtherTextChange: (v: string) => void;
  onChange: (v: SystemType) => void;
}) {
  return (
    <div className="space-y-4">
      <SelectionGrid options={SYSTEM_TYPES} value={value} onChange={onChange} columns={2} />
      {value === "other" && (
        <div className="space-y-2">
          <Label htmlFor="other-type">Please specify</Label>
          <Input
            id="other-type"
            value={otherText}
            onChange={(e) => onOtherTextChange(e.target.value)}
            placeholder="e.g., Fleet Management"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">{otherText.length}/60 characters</p>
        </div>
      )}
    </div>
  );
}

function Step2({
  value,
  onChange,
}: {
  value: Industry | undefined;
  onChange: (v: Industry) => void;
}) {
  return <SelectionGrid options={INDUSTRIES} value={value} onChange={onChange} columns={2} />;
}

function Step3({
  value,
  onChange,
}: {
  value: UserCount | undefined;
  onChange: (v: UserCount) => void;
}) {
  return <SelectionButtons options={USER_COUNTS} value={value} onChange={onChange} />;
}

function Step4({
  value,
  onChange,
}: {
  value: Deployment | undefined;
  onChange: (v: Deployment) => void;
}) {
  return <SelectionGrid options={DEPLOYMENTS} value={value} onChange={onChange} columns={2} />;
}

function Step5({
  value,
  currency,
  onCurrencyChange,
  onChange,
}: {
  value: Budget | undefined;
  currency: Currency | undefined;
  onCurrencyChange: (v: Currency) => void;
  onChange: (v: Budget) => void;
}) {
  const budgets = currency === "KES" ? BUDGETS_KES : BUDGETS_USD;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Currency:</span>
        <div className="flex gap-2">
          {[
            { value: "USD", label: "USD" },
            { value: "KES", label: "KES" },
          ].map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onCurrencyChange(c.value as Currency)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                currency === c.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <SelectionButtons options={budgets} value={value} onChange={onChange} />
    </div>
  );
}

function Step6Categories({
  value,
  onChange,
}: {
  value: Category[];
  onChange: (v: Category[]) => void;
}) {
  return (
    <div className="space-y-2">
      <ChipMultiSelect options={CATEGORIES} value={value} onChange={onChange} />
      <p className="text-xs text-muted-foreground">Select all that apply</p>
    </div>
  );
}

function Step6({
  value,
  onChange,
}: {
  value: EssentialFeature[];
  onChange: (v: EssentialFeature[]) => void;
}) {
  return (
    <div className="space-y-2">
      <ChipMultiSelect options={ESSENTIAL_FEATURES} value={value} onChange={onChange} />
      <p className="text-xs text-muted-foreground">Select at least one feature</p>
    </div>
  );
}

function Step7({
  value,
  onChange,
}: {
  value: Integration[];
  onChange: (v: Integration[]) => void;
}) {
  return (
    <div className="space-y-2">
      <ChipMultiSelect options={INTEGRATIONS} value={value} onChange={onChange} exclusive="none" />
      <p className="text-xs text-muted-foreground">
        Select all that apply. Choose None if not required.
      </p>
    </div>
  );
}

function Step8({
  value,
  onChange,
}: {
  value: Timeline | undefined;
  onChange: (v: Timeline) => void;
}) {
  return <SelectionButtons options={TIMELINES} value={value} onChange={onChange} />;
}

function Step9({ value, onChange }: { value: Growth | undefined; onChange: (v: Growth) => void }) {
  return <SelectionGrid options={GROWTHS} value={value} onChange={onChange} columns={2} />;
}

function Step10({
  value,
  onChange,
}: {
  value: Priority | undefined;
  onChange: (v: Priority) => void;
}) {
  return <SelectionGrid options={PRIORITIES} value={value} onChange={onChange} columns={2} />;
}
