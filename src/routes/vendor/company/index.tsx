import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Calendar,
  MoreHorizontal,
  Pencil,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { Icon } from "@iconify/react";

export const Route = createFileRoute("/vendor/company/")({
  component: VendorCompanyPage,
});

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

type SocialLinks = {
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  github?: string;
};

type Vendor = {
  id: string;
  company_name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  social_links: SocialLinks;
  verification_status: string;
  company_size?: string | null;
  founded_date?: string | null;
  industry?: string | null;
  location?: string | null;
  location_label?: string | null;
};

type Technology = {
  id: string;
  name: string;
  color: string;
};

const techIconMap: Record<string, string> = {
  postgresql: "simple-icons:postgresql",
  postgres: "simple-icons:postgresql",
  mysql: "simple-icons:mysql",
  mongodb: "simple-icons:mongodb",
  redis: "simple-icons:redis",
  docker: "simple-icons:docker",
  kubernetes: "simple-icons:kubernetes",
  aws: "simple-icons:amazonaws",
  amazonaws: "simple-icons:amazonaws",
  azure: "simple-icons:microsoftazure",
  gcp: "simple-icons:googlecloud",
  googlecloud: "simple-icons:googlecloud",
  react: "simple-icons:react",
  vue: "simple-icons:vuedotjs",
  angular: "simple-icons:angular",
  nodejs: "simple-icons:nodedotjs",
  node: "simple-icons:nodedotjs",
  python: "simple-icons:python",
  java: "simple-icons:openjdk",
  go: "simple-icons:go",
  golang: "simple-icons:go",
  rust: "simple-icons:rust",
  typescript: "simple-icons:typescript",
  javascript: "simple-icons:javascript",
  graphql: "simple-icons:graphql",
  rest: "mdi:api",
  api: "mdi:api",
  linux: "simple-icons:linux",
  windows: "mdi:microsoft-windows",
  macos: "simple-icons:apple",
  git: "simple-icons:git",
  github: "simple-icons:github",
  gitlab: "simple-icons:gitlab",
  jenkins: "simple-icons:jenkins",
  circleci: "simple-icons:circleci",
  travis: "simple-icons:travisci",
  terraform: "simple-icons:terraform",
  ansible: "simple-icons:ansible",
  prometheus: "simple-icons:prometheus",
  grafana: "simple-icons:grafana",
  elasticsearch: "simple-icons:elasticsearch",
  kafka: "simple-icons:apachekafka",
  rabbitmq: "simple-icons:rabbitmq",
  nginx: "simple-icons:nginx",
  apache: "simple-icons:apache",
  flutter: "simple-icons:flutter",
  reactnative: "simple-icons:react",
  ios: "simple-icons:apple",
  android: "simple-icons:android",
  tensorflow: "simple-icons:tensorflow",
  pytorch: "simple-icons:pytorch",
  ai: "mdi:brain",
  ml: "mdi:brain",
  machinelearning: "mdi:brain",
  blockchain: "mdi:link-variant",
  ethereum: "simple-icons:ethereum",
  web3: "mdi:web",
  security: "mdi:shield-lock",
  encryption: "mdi:lock",
  firebase: "simple-icons:firebase",
  supabase: "simple-icons:supabase",
  vercel: "simple-icons:vercel",
  netlify: "simple-icons:netlify",
  cloudflare: "simple-icons:cloudflare",
  sentry: "simple-icons:sentry",
  datadog: "simple-icons:datadog",
  newrelic: "simple-icons:newrelic",
  splunk: "simple-icons:splunk",
  elastic: "simple-icons:elasticsearch",
  logstash: "simple-icons:logstash",
  kibana: "simple-icons:kibana",
};

function getTechIconName(name: string): string | null {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return techIconMap[normalized] ?? null;
}

type TechCatalogItem = { key: string; label: string; icon: string; color: string };

const TECH_CATALOG: TechCatalogItem[] = [
  { key: "postgresql", label: "PostgreSQL", icon: "simple-icons:postgresql", color: "#336791" },
  { key: "mysql", label: "MySQL", icon: "simple-icons:mysql", color: "#4479a1" },
  { key: "mongodb", label: "MongoDB", icon: "simple-icons:mongodb", color: "#13aa52" },
  { key: "redis", label: "Redis", icon: "simple-icons:redis", color: "#d82c20" },
  { key: "docker", label: "Docker", icon: "simple-icons:docker", color: "#2496ed" },
  { key: "kubernetes", label: "Kubernetes", icon: "simple-icons:kubernetes", color: "#326ce5" },
  { key: "aws", label: "AWS", icon: "simple-icons:amazonaws", color: "#ff9900" },
  { key: "azure", label: "Azure", icon: "simple-icons:microsoftazure", color: "#0078d4" },
  { key: "gcp", label: "Google Cloud", icon: "simple-icons:googlecloud", color: "#ea4335" },
  { key: "react", label: "React", icon: "simple-icons:react", color: "#61dafb" },
  { key: "vue", label: "Vue", icon: "simple-icons:vuedotjs", color: "#42b883" },
  { key: "angular", label: "Angular", icon: "simple-icons:angular", color: "#dd0031" },
  { key: "nodejs", label: "Node.js", icon: "simple-icons:nodedotjs", color: "#3c873a" },
  { key: "python", label: "Python", icon: "simple-icons:python", color: "#3776ab" },
  { key: "java", label: "Java", icon: "simple-icons:openjdk", color: "#f89820" },
  { key: "go", label: "Go", icon: "simple-icons:go", color: "#00add8" },
  { key: "rust", label: "Rust", icon: "simple-icons:rust", color: "#dea584" },
  { key: "typescript", label: "TypeScript", icon: "simple-icons:typescript", color: "#3178c6" },
  { key: "javascript", label: "JavaScript", icon: "simple-icons:javascript", color: "#f7df1e" },
  { key: "graphql", label: "GraphQL", icon: "simple-icons:graphql", color: "#e10098" },
  { key: "linux", label: "Linux", icon: "simple-icons:linux", color: "#1793d1" },
  { key: "git", label: "Git", icon: "simple-icons:git", color: "#f05032" },
  { key: "github", label: "GitHub", icon: "simple-icons:github", color: "#24292e" },
  { key: "gitlab", label: "GitLab", icon: "simple-icons:gitlab", color: "#fc6d26" },
  { key: "terraform", label: "Terraform", icon: "simple-icons:terraform", color: "#7b42bc" },
  { key: "ansible", label: "Ansible", icon: "simple-icons:ansible", color: "#ee0000" },
  { key: "prometheus", label: "Prometheus", icon: "simple-icons:prometheus", color: "#e6522c" },
  { key: "grafana", label: "Grafana", icon: "simple-icons:grafana", color: "#f46800" },
  {
    key: "elasticsearch",
    label: "Elasticsearch",
    icon: "simple-icons:elasticsearch",
    color: "#fec514",
  },
  { key: "kafka", label: "Kafka", icon: "simple-icons:apachekafka", color: "#231f20" },
  { key: "nginx", label: "Nginx", icon: "simple-icons:nginx", color: "#009639" },
  { key: "apache", label: "Apache", icon: "simple-icons:apache", color: "#d22128" },
  { key: "flutter", label: "Flutter", icon: "simple-icons:flutter", color: "#02569b" },
  { key: "reactnative", label: "React Native", icon: "simple-icons:react", color: "#61dafb" },
  { key: "ios", label: "iOS", icon: "simple-icons:apple", color: "#555555" },
  { key: "android", label: "Android", icon: "simple-icons:android", color: "#3ddc84" },
  { key: "tensorflow", label: "TensorFlow", icon: "simple-icons:tensorflow", color: "#ff6f00" },
  { key: "pytorch", label: "PyTorch", icon: "simple-icons:pytorch", color: "#ee4c2c" },
  { key: "ai", label: "AI", icon: "mdi:brain", color: "#6b7280" },
  { key: "security", label: "Security", icon: "mdi:shield-lock", color: "#6b7280" },
  { key: "firebase", label: "Firebase", icon: "simple-icons:firebase", color: "#ffca28" },
  { key: "supabase", label: "Supabase", icon: "simple-icons:supabase", color: "#3ecf8e" },
  { key: "vercel", label: "Vercel", icon: "simple-icons:vercel", color: "#000000" },
  { key: "cloudflare", label: "Cloudflare", icon: "simple-icons:cloudflare", color: "#f38020" },
  { key: "sentry", label: "Sentry", icon: "simple-icons:sentry", color: "#362d59" },
  { key: "datadog", label: "Datadog", icon: "simple-icons:datadog", color: "#632ca6" },
  { key: "splunk", label: "Splunk", icon: "simple-icons:splunk", color: "#000000" },
];

type Contact = {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar_url: string | null;
};

type ApiResponse = {
  vendor: Vendor | null;
  technologies: Technology[];
  contacts: Contact[];
};

function VendorCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [github, setGithub] = useState("");
  const [logoFileError, setLogoFileError] = useState("");
  const [verified, setVerified] = useState(false);
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [foundedDate, setFoundedDate] = useState("");
  const [location, setLocation] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactAvatarUrl, setContactAvatarUrl] = useState("");
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState("");

  const [techSheetOpen, setTechSheetOpen] = useState(false);
  const [techSaving, setTechSaving] = useState(false);
  const [techError, setTechError] = useState("");
  const [techSearch, setTechSearch] = useState("");

  const handleAddTechnology = async (item: TechCatalogItem) => {
    setTechError("");
    setTechSaving(true);
    try {
      const res = await fetch("/api/vendor/technologies", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: item.label, color: item.color }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTechError(data.error ?? "Failed to add technology");
        return;
      }
      const saved = data.technology as Technology;
      setTechnologies((prev) => (prev.some((t) => t.id === saved.id) ? prev : [...prev, saved]));
    } catch {
      setTechError("Failed to add technology");
    } finally {
      setTechSaving(false);
    }
  };

  const handleDeleteTechnology = async (tech: Technology) => {
    try {
      const res = await fetch(`/api/vendor/technologies?id=${encodeURIComponent(tech.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to remove technology");
        return;
      }
      setTechnologies((prev) => prev.filter((t) => t.id !== tech.id));
    } catch {
      setError("Failed to remove technology");
    }
  };

  const openAddContact = () => {
    setEditingContact(null);
    setContactName("");
    setContactRole("");
    setContactEmail("");
    setContactAvatarUrl("");
    setContactError("");
    setContactSheetOpen(true);
  };

  const openEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactName(contact.name);
    setContactRole(contact.role);
    setContactEmail(contact.email);
    setContactAvatarUrl(contact.avatar_url ?? "");
    setContactError("");
    setContactSheetOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSaving(true);
    setContactError("");
    try {
      const payload = {
        name: contactName.trim(),
        role: contactRole.trim(),
        email: contactEmail.trim(),
        avatar_url: contactAvatarUrl.trim() || null,
      };
      if (!payload.name || !payload.role || !payload.email) {
        setContactError("Name, role, and email are required.");
        return;
      }
      const url = editingContact
        ? `/api/vendor/contacts/${editingContact.id}`
        : "/api/vendor/contacts";
      const res = await fetch(url, {
        method: editingContact ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setContactError(data.error ?? "Failed to save contact");
        return;
      }
      const saved = data.contact as Contact;
      setContacts((prev) =>
        editingContact ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved],
      );
      setContactSheetOpen(false);
    } catch {
      setContactError("Failed to save contact");
    } finally {
      setContactSaving(false);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (!confirm(`Delete ${contact.name}?`)) return;
    try {
      const res = await fetch(`/api/vendor/contacts/${contact.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete contact");
        return;
      }
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    } catch {
      setError("Failed to delete contact");
    }
  };
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/vendors", { credentials: "include" });
        const raw = await res.json();
        if (!res.ok) {
          if (!cancelled) {
            const msg = (raw as { error?: string }).error ?? `Server error (${res.status})`;
            setError(msg);
            console.error("[vendor.company] API error:", res.status, raw);
          }
          return;
        }
        const data = raw as ApiResponse;
        const vendor = data.vendor;
        if (!vendor) {
          if (!cancelled) {
            setIsNew(true);
            setTechnologies([]);
            setContacts([]);
            console.log("[vendor.company] No vendor profile found for user");
          }
          return;
        }
        if (cancelled) return;
        setIsNew(false);
        setCompanyName(vendor.company_name ?? "");
        setLogoUrl(vendor.logo_url ?? "");
        setWebsite(vendor.website ?? "");
        setDescription(vendor.description ?? "");
        const socials = vendor.social_links ?? {};
        setLinkedin(socials.linkedin ?? "");
        setTwitter(socials.twitter ?? "");
        setYoutube(socials.youtube ?? "");
        setGithub(socials.github ?? "");
        setVerified(vendor.verification_status === "verified");
        setIndustry(vendor.industry ?? "");
        setCompanySize(vendor.company_size ?? "");
        setFoundedDate(vendor.founded_date ?? "");
        setLocation(vendor.location ?? "");
        setLocationLabel(vendor.location_label ?? "");
        setTechnologies(data.technologies ?? []);
        setContacts(data.contacts ?? []);
        console.log(
          "[vendor.company] Loaded vendor:",
          vendor.company_name,
          "techs:",
          data.technologies?.length,
          "contacts:",
          data.contacts?.length,
        );
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load vendor profile";
          setError(msg);
          console.error("[vendor.company] Fetch error:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoFileError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") {
      setLogoFileError("Logo must be a PNG image.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoFileError("Logo must be 2 MB or smaller.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.onerror = () => setLogoFileError("Failed to read logo file.");
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const socialLinks = {
        linkedin: linkedin || undefined,
        twitter: twitter || undefined,
        youtube: youtube || undefined,
        github: github || undefined,
      };
      const payload = isNew
        ? {
            company_name: companyName,
            logo_url: logoUrl || null,
            website: website || null,
            description: description || null,
            industry: industry || null,
            company_size: companySize || null,
            founded_date: foundedDate || null,
            location: location || null,
            location_label: locationLabel || null,
          }
        : {
            company_name: companyName,
            logo_url: logoUrl || null,
            website: website || null,
            description: description || null,
            industry: industry || null,
            company_size: companySize || null,
            founded_date: foundedDate || null,
            location: location || null,
            location_label: locationLabel || null,
            social_links: socialLinks,
          };
      const res = await fetch("/api/vendors", {
        method: isNew ? "POST" : "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      const wasNew = isNew;
      if (isNew) setIsNew(false);
      setSuccess(wasNew ? "Company profile created." : "Company profile saved.");
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading company profile…</p>;
  }

  const isUploadedLogo = logoUrl.startsWith("data:image/png");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Company profile</h1>
        {verified && (
          <Badge variant="secondary" className="gap-1">
            <Building2 className="h-3 w-3" /> Verified
          </Badge>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {isNew ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-lg border border-border bg-secondary/50 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-muted-foreground">
                  No company profile yet
                </h2>
                <p className="text-sm text-muted-foreground">
                  Create your company profile to get discovered by buyers.
                </p>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="default" size="sm" className="mt-2 gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Set up company profile
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Create Company Profile</SheetTitle>
                      <SheetDescription>
                        Enter your company information to get started.
                      </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Company name</Label>
                        <Input
                          id="company_name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="logo_url">Logo URL</Label>
                        <Input
                          id="logo_url"
                          value={isUploadedLogo ? "" : logoUrl}
                          onChange={(e) => {
                            setLogoUrl(e.target.value);
                            setLogoFileError("");
                            if (logoFileInputRef.current) logoFileInputRef.current.value = "";
                          }}
                          placeholder={
                            isUploadedLogo ? "PNG uploaded — enter a URL to replace" : "https://…"
                          }
                        />
                        <div>
                          <Label htmlFor="logo_file" className="text-xs text-muted-foreground">
                            Or upload PNG
                          </Label>
                          <Input
                            ref={logoFileInputRef}
                            id="logo_file"
                            type="file"
                            accept="image/png"
                            onChange={handleLogoFileChange}
                            className="mt-1.5"
                          />
                          {logoFileError && (
                            <p className="text-sm text-red-600 mt-1">{logoFileError}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://…"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="e.g., Technology, Healthcare, Finance"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company_size">Company size</Label>
                        <Input
                          id="company_size"
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value)}
                          placeholder="e.g., 1-10, 11-50, 51-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="founded_date">Founded date</Label>
                        <Input
                          id="founded_date"
                          type="number"
                          value={foundedDate}
                          onChange={(e) => setFoundedDate(e.target.value)}
                          placeholder="e.g., 1998"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Exact location</Label>
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g., 123 Market St, San Francisco, CA"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location_label">Display name (city or area)</Label>
                        <Input
                          id="location_label"
                          value={locationLabel}
                          onChange={(e) => setLocationLabel(e.target.value)}
                          placeholder="e.g., San Francisco, CA"
                        />
                      </div>
                      <SheetFooter className="px-0">
                        <Button type="submit" disabled={saving} className="w-full">
                          {saving ? "Saving…" : "Create profile"}
                        </Button>
                      </SheetFooter>
                    </form>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 shrink-0 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Company logo"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold">{companyName || "Company name"}</h2>
                        <Badge variant="secondary" className="gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Active
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        {location || locationLabel ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              location || locationLabel,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            {locationLabel || location}
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            No location
                          </span>
                        )}
                        {website ? (
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary hover:underline"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            {website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" />
                            No website
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {description && (
                    <div className="space-y-1">
                      <p
                        className={`text-sm text-muted-foreground leading-relaxed ${
                          showMore ? "" : "line-clamp-2"
                        }`}
                      >
                        {description}
                      </p>
                      {description.length > 120 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMore(!showMore)}
                          className="h-auto p-0 text-xs font-medium text-primary hover:bg-transparent"
                        >
                          {showMore ? "Show Less" : "Show More"}
                          {showMore ? (
                            <ChevronUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ChevronDown className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex lg:flex-col gap-2 lg:items-end">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="default" size="sm" className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Company
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Edit Company Profile</SheetTitle>
                        <SheetDescription>Update your company information below.</SheetDescription>
                      </SheetHeader>
                      <form onSubmit={handleSave} className="mt-6 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name">Company name</Label>
                          <Input
                            id="company_name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="logo_url">Logo URL</Label>
                          <Input
                            id="logo_url"
                            value={isUploadedLogo ? "" : logoUrl}
                            onChange={(e) => {
                              setLogoUrl(e.target.value);
                              setLogoFileError("");
                              if (logoFileInputRef.current) logoFileInputRef.current.value = "";
                            }}
                            placeholder={
                              isUploadedLogo ? "PNG uploaded — enter a URL to replace" : "https://…"
                            }
                          />
                          <div>
                            <Label htmlFor="logo_file" className="text-xs text-muted-foreground">
                              Or upload PNG
                            </Label>
                            <Input
                              ref={logoFileInputRef}
                              id="logo_file"
                              type="file"
                              accept="image/png"
                              onChange={handleLogoFileChange}
                              className="mt-1.5"
                            />
                            {logoFileError && (
                              <p className="text-sm text-red-600 mt-1">{logoFileError}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://…"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry</Label>
                          <Input
                            id="industry"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="e.g., Technology, Healthcare, Finance"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company_size">Company size</Label>
                          <Input
                            id="company_size"
                            value={companySize}
                            onChange={(e) => setCompanySize(e.target.value)}
                            placeholder="e.g., 1-10, 11-50, 51-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="founded_date">Founded date</Label>
                          <Input
                            id="founded_date"
                            type="number"
                            value={foundedDate}
                            onChange={(e) => setFoundedDate(e.target.value)}
                            placeholder="e.g., 1998"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Exact location</Label>
                          <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g., 123 Market St, San Francisco, CA"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location_label">Display name (city or area)</Label>
                          <Input
                            id="location_label"
                            value={locationLabel}
                            onChange={(e) => setLocationLabel(e.target.value)}
                            placeholder="e.g., San Francisco, CA"
                          />
                          <p className="text-xs text-muted-foreground">
                            Shown publicly; the link opens the exact location above.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="twitter">X (Twitter)</Label>
                          <Input
                            id="twitter"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtube">YouTube</Label>
                          <Input
                            id="youtube"
                            value={youtube}
                            onChange={(e) => setYoutube(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="github">GitHub</Label>
                          <Input
                            id="github"
                            value={github}
                            onChange={(e) => setGithub(e.target.value)}
                          />
                        </div>
                        <SheetFooter className="px-0">
                          <Button type="submit" disabled={saving} className="w-full">
                            {saving ? "Saving…" : isNew ? "Create profile" : "Save changes"}
                          </Button>
                        </SheetFooter>
                      </form>
                    </SheetContent>
                  </Sheet>

                  <Sheet
                    open={techSheetOpen}
                    onOpenChange={(open) => {
                      setTechSheetOpen(open);
                      if (!open) setTechSearch("");
                    }}
                  >
                    <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Edit technologies</SheetTitle>
                        <SheetDescription>
                          Select the technologies your company uses.
                        </SheetDescription>
                      </SheetHeader>
                      {techError && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          {techError}
                        </div>
                      )}
                      <div className="mt-6 space-y-3">
                        {technologies.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No technologies selected yet.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {technologies.map((tech) => {
                              const iconName = getTechIconName(tech.name);
                              return (
                                <Badge
                                  key={tech.id}
                                  variant="secondary"
                                  className="text-white border-none flex items-center gap-1.5 pr-1"
                                  style={{ backgroundColor: tech.color }}
                                >
                                  {iconName && <Icon icon={iconName} className="h-3 w-3" />}
                                  {tech.name}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTechnology(tech)}
                                    className="ml-0.5 rounded-full hover:bg-black/20 p-0.5"
                                    aria-label={`Remove ${tech.name}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}

                        <Separator />

                        <p className="text-xs font-medium text-muted-foreground">
                          Add a technology
                        </p>
                        <Input
                          value={techSearch}
                          onChange={(e) => setTechSearch(e.target.value)}
                          placeholder="Search technologies…"
                          className="mb-1"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          {TECH_CATALOG.filter((item) =>
                            item.label.toLowerCase().includes(techSearch.trim().toLowerCase()),
                          ).map((item) => {
                            const added = technologies.some(
                              (t) => t.name.toLowerCase() === item.label.toLowerCase(),
                            );
                            return (
                              <button
                                key={item.key}
                                type="button"
                                disabled={added || techSaving}
                                onClick={() => handleAddTechnology(item)}
                                className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-left text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white"
                                  style={{ backgroundColor: item.color }}
                                >
                                  <Icon icon={item.icon} className="h-3.5 w-3.5" />
                                </span>
                                {item.label}
                                {added && <Check className="ml-auto h-3.5 w-3.5 text-green-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View public profile</DropdownMenuItem>
                      <DropdownMenuItem>Invite team members</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Delete profile</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="font-medium">{industry || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Company size</p>
                <p className="font-medium">{companySize || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Founded</p>
                <p className="font-medium">{foundedDate || "—"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Technologies</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setTechError("");
                      setTechSheetOpen(true);
                    }}
                    aria-label="Edit technologies"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {technologies.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No technologies added yet. Click the pencil to add some.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {technologies.map((tech) => {
                      const iconName = getTechIconName(tech.name);
                      return (
                        <div
                          key={tech.id}
                          className="flex items-center gap-2 rounded-lg border border-border p-2"
                        >
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
                            style={{ backgroundColor: tech.color }}
                          >
                            {iconName && <Icon icon={iconName} className="h-4 w-4" />}
                          </span>
                          <span className="truncate text-sm font-medium">{tech.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Key Contacts</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={openAddContact}
                    aria-label="Add contact"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {contacts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No contacts yet. Add key people buyers should know.
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact.id} className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        {contact.avatar_url ? <AvatarImage src={contact.avatar_url} /> : null}
                        <AvatarFallback className="text-xs">
                          {contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm font-medium truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                        <p className="text-xs text-primary truncate">{contact.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditContact(contact)}
                          aria-label="Edit contact"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600"
                          onClick={() => handleDeleteContact(contact)}
                          aria-label="Delete contact"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                <Sheet open={contactSheetOpen} onOpenChange={setContactSheetOpen}>
                  <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>{editingContact ? "Edit Contact" : "Add Contact"}</SheetTitle>
                      <SheetDescription>
                        {editingContact
                          ? "Update the contact details below."
                          : "Add a key contact for your company."}
                      </SheetDescription>
                    </SheetHeader>
                    {contactError && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {contactError}
                      </div>
                    )}
                    <form onSubmit={handleSaveContact} className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact_name">Name</Label>
                        <Input
                          id="contact_name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_role">Role</Label>
                        <Input
                          id="contact_role"
                          value={contactRole}
                          onChange={(e) => setContactRole(e.target.value)}
                          placeholder="e.g., CEO, Sales Lead"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_email">Email</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="name@company.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_avatar">Avatar URL</Label>
                        <Input
                          id="contact_avatar"
                          value={contactAvatarUrl}
                          onChange={(e) => setContactAvatarUrl(e.target.value)}
                          placeholder="https://…"
                        />
                      </div>
                      <SheetFooter className="px-0">
                        <Button type="submit" disabled={contactSaving} className="w-full">
                          {contactSaving
                            ? "Saving…"
                            : editingContact
                              ? "Save changes"
                              : "Add contact"}
                        </Button>
                      </SheetFooter>
                    </form>
                  </SheetContent>
                </Sheet>
                <Link
                  to="/vendor/company/contacts"
                  className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
                >
                  View all contacts
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
