import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { RequirementsWizard } from "@/components/requirements-wizard";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Requirements Assessment — PRISM" },
      {
        name: "description",
        content: "Answer a few questions to get personalized software recommendations.",
      },
    ],
  }),
  component: AssessmentPage,
});

function AssessmentPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={undefined} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold">Find Your Perfect Software</h1>
          <p className="mt-2 text-muted-foreground">
            Complete this short assessment and we&apos;ll recommend the best matches for your
            business.
          </p>
        </div>
        <RequirementsWizard onComplete={() => {}} />
      </main>
    </div>
  );
}
