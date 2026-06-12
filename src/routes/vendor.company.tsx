import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/vendor/company")({
  component: VendorCompanyPage,
});

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
};

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

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
  const [isNew, setIsNew] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/vendors", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "Failed to load vendor profile");
          return;
        }
        const vendor = data.vendor as Vendor | null;
        if (!vendor) {
          if (!cancelled) setIsNew(true);
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
      } catch {
        if (!cancelled) setError("Failed to load vendor profile");
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
          }
        : {
            company_name: companyName,
            logo_url: logoUrl || null,
            website: website || null,
            description: description || null,
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
        <h1 className="text-2xl font-semibold">{isNew ? "Set up your company profile" : "Company profile"}</h1>
        {verified && (
          <Badge className="gap-1">
            <ShieldCheck className="h-3 w-3" /> Verified
          </Badge>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="company_name">Company name</Label>
              <Input
                id="company_name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 space-y-3">
              <Label>Logo</Label>
              <div>
                <Label htmlFor="logo_url" className="text-xs text-muted-foreground">
                  URL
                </Label>
                <Input
                  id="logo_url"
                  value={isUploadedLogo ? "" : logoUrl}
                  onChange={(e) => {
                    setLogoUrl(e.target.value);
                    setLogoFileError("");
                    if (logoFileInputRef.current) logoFileInputRef.current.value = "";
                  }}
                  placeholder={isUploadedLogo ? "PNG uploaded — enter a URL to replace" : "https://…"}
                  className="mt-1.5"
                />
              </div>
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
              </div>
              {logoFileError && <p className="text-sm text-red-600">{logoFileError}</p>}
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Company logo preview"
                  className="h-16 w-16 rounded-md border border-border object-contain bg-background"
                />
              )}
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Socials</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="twitter">X (Twitter)</Label>
              <Input id="twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="youtube">YouTube</Label>
              <Input id="youtube" value={youtube} onChange={(e) => setYoutube(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input id="github" value={github} onChange={(e) => setGithub(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isNew ? "Create profile" : "Save"}
        </Button>
      </form>
    </div>
  );
}
