import { createFileRoute } from "@tanstack/react-router";
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

function VendorCompanyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Company profile</h1>
        <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
      </div>
      <Card><CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div><Label>Company name</Label><Input defaultValue="Nimbus Labs" /></div>
          <div><Label>Website</Label><Input defaultValue="https://nimbus.example" /></div>
          <div><Label>Headquarters</Label><Input defaultValue="San Francisco, CA" /></div>
          <div><Label>Founded</Label><Input defaultValue="2017" /></div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={4} defaultValue="Modern CRM for growing revenue teams." /></div>
          <div className="sm:col-span-2"><Button>Save</Button></div>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Socials</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div><Label>LinkedIn</Label><Input /></div>
          <div><Label>X (Twitter)</Label><Input /></div>
          <div><Label>YouTube</Label><Input /></div>
          <div><Label>GitHub</Label><Input /></div>
        </CardContent>
      </Card>
    </div>
  );
}
