import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TcoPackage = {
  id: string;
  name: string;
  description: string | null;
  pricing_model: string;
  currency: string;
  base_price: number | null;
  billing_cadence: string | null;
  is_free: boolean;
  contact_sales: boolean;
  trial_available: boolean;
  trial_duration_days: number | null;
  minimum_seats: number | null;
  maximum_seats: number | null;
  is_unlimited_seats: boolean;
  is_popular: boolean;
  features: string[];
};

type TcoResultRow = {
  year: number;
  cost: number;
  base: number;
  escalationAmount: number;
};

const PRICING_LABELS: Record<string, string> = {
  per_user: "Seats",
  per_device: "Devices",
  monthly_subscription: "Flat Monthly Fee",
  annual_subscription: "Flat Annual Fee",
  usage_based: "Usage Units",
  per_transaction: "Transactions",
  per_organization: "Organizations",
  one_time: "One-Time Purchase",
  freemium: "Freemium",
  free: "Free",
  custom: "Custom",
  contact_sales: "Contact Sales",
  tiered_usage: "Tiered Usage",
};

export function SystemTcoCalculator({
  systemName,
  packages,
}: {
  systemName: string;
  packages: TcoPackage[];
}) {
  const [years, setYears] = useState(3);
  const [escalation, setEscalation] = useState(5);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [result, setResult] = useState<TcoResultRow[] | null>(null);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [error, setError] = useState("");

  const calculablePackages = useMemo(() => {
    return packages.filter(
      (pkg) => !pkg.is_free && !pkg.contact_sales && pkg.base_price != null && pkg.base_price > 0,
    );
  }, [packages]);

  const handleQuantityChange = (packageId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [packageId]: Math.max(0, value) }));
    setResult(null);
    setTotalCost(null);
    setError("");
  };

  const calculateTco = () => {
    setError("");
    setResult(null);
    setTotalCost(null);

    if (calculablePackages.length === 0) {
      setError("No calculable packages available for this system.");
      return;
    }

    const rate = Math.max(0, escalation) / 100;
    const yrs = Math.min(10, Math.max(1, years));

    const packageBreakdowns = calculablePackages.map((pkg) => {
      const qty = quantities[pkg.id] ?? 0;
      const price = pkg.base_price!;
      const model = pkg.pricing_model;

      if (model === "per_user" || model === "per_device") {
        if (pkg.minimum_seats && qty < pkg.minimum_seats) {
          return {
            packageId: pkg.id,
            error: `Min ${pkg.minimum_seats} ${PRICING_LABELS[model].toLowerCase()} required for ${pkg.name}`,
          };
        }
        if (pkg.maximum_seats && !pkg.is_unlimited_seats && qty > pkg.maximum_seats) {
          return {
            packageId: pkg.id,
            error: `Max ${pkg.maximum_seats} ${PRICING_LABELS[model].toLowerCase()} allowed for ${pkg.name}`,
          };
        }
      }

      let year1 = 0;
      let year1Base = 0;

      if (model === "per_user" || model === "per_device") {
        const monthly = price * qty;
        const annual = pkg.billing_cadence === "annual" ? price * qty : monthly * 12;
        year1 = annual;
        year1Base = annual;
      } else if (model === "monthly_subscription") {
        year1 = price * 12;
        year1Base = price * 12;
      } else if (model === "annual_subscription") {
        year1 = price;
        year1Base = price;
      } else if (
        model === "usage_based" ||
        model === "per_transaction" ||
        model === "tiered_usage"
      ) {
        year1 = price * qty * 12;
        year1Base = price * qty * 12;
      } else if (model === "one_time") {
        year1 = price;
        year1Base = price;
      } else {
        year1 = price * 12;
        year1Base = price * 12;
      }

      return {
        packageId: pkg.id,
        yearlyCosts: Array.from({ length: yrs }, (_, i) => {
          const cost = i === 0 ? year1 : year1 * Math.pow(1 + rate, i);
          return {
            year: i + 1,
            cost,
            base: year1Base,
            escalationAmount: Math.max(0, cost - year1Base),
          };
        }),
      };
    });

    const errors = packageBreakdowns.filter(
      (entry): entry is { packageId: string; error: string } => "error" in entry && !!entry.error,
    );
    if (errors.length > 0) {
      setError(errors.map((entry) => entry.error).join("; "));
      return;
    }

    const validBreakdowns = packageBreakdowns as Array<{
      packageId: string;
      yearlyCosts: TcoResultRow[];
    }>;

    const combined = validBreakdowns[0].yearlyCosts.map((_, yearIndex) => {
      const year = yearIndex + 1;
      let cost = 0;
      let base = 0;
      let escalationAmount = 0;

      validBreakdowns.forEach((entry) => {
        const currentYear = entry.yearlyCosts[yearIndex];
        cost += currentYear.cost;
        base += currentYear.base;
        escalationAmount += currentYear.escalationAmount;
      });

      return { year, cost, base, escalationAmount };
    });

    setResult(combined);
    setTotalCost(combined.reduce((sum, row) => sum + row.cost, 0));
  };

  const formatCurrency = (value: number, currency: string) =>
    `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const currency = calculablePackages[0]?.currency ?? "";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Years (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={years}
                onChange={(e) => {
                  setYears(parseInt(e.target.value, 10) || 1);
                  setResult(null);
                  setTotalCost(null);
                }}
              />
            </div>
            <div>
              <Label>Annual Escalation (%)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={escalation}
                onChange={(e) => {
                  setEscalation(parseFloat(e.target.value) || 0);
                  setResult(null);
                  setTotalCost(null);
                }}
              />
            </div>
          </div>

          {packages.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => {
                const label = PRICING_LABELS[pkg.pricing_model] || "Quantity";
                const hasPrice = pkg.base_price != null && pkg.base_price > 0;

                return (
                  <Card
                    key={pkg.id}
                    className={pkg.is_free || pkg.contact_sales || !hasPrice ? "opacity-60" : ""}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        {pkg.name}
                        {pkg.is_popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {pkg.pricing_model.replace(/_/g, " ")}
                        </Badge>
                        {hasPrice ? (
                          <span className="text-xs font-medium">
                            {formatCurrency(pkg.base_price!, pkg.currency)}
                            {pkg.billing_cadence && ` / ${pkg.billing_cadence}`}
                          </span>
                        ) : pkg.is_free ? (
                          <span className="text-xs text-muted-foreground">Free</span>
                        ) : pkg.contact_sales ? (
                          <span className="text-xs text-muted-foreground">Contact Sales</span>
                        ) : null}
                      </div>
                      {hasPrice && !pkg.is_free && !pkg.contact_sales ? (
                        <div>
                          <Label className="text-xs">{label}</Label>
                          <Input
                            type="number"
                            min="0"
                            className="h-8 text-xs"
                            value={quantities[pkg.id] ?? 0}
                            onChange={(e) =>
                              handleQuantityChange(pkg.id, parseInt(e.target.value, 10) || 0)
                            }
                          />
                          {pkg.minimum_seats && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Min: {pkg.minimum_seats}
                              {!pkg.is_unlimited_seats && pkg.maximum_seats
                                ? ` | Max: ${pkg.maximum_seats}`
                                : ""}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {pkg.is_free
                            ? "Free package"
                            : pkg.contact_sales
                              ? "Contact sales for pricing"
                              : "No base price set"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pricing packages configured.</p>
          )}

          <div className="flex justify-end">
            <Button onClick={calculateTco}>Calculate Total TCO</Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && totalCost !== null && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {systemName} — {years}-Year Combined Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">System</p>
                  <p className="text-sm font-medium">{systemName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Packages</p>
                  <p className="text-sm font-medium">{calculablePackages.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Escalation</p>
                  <p className="text-sm font-medium">{escalation}% / year</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Projected Cost</p>
                  <p className="text-2xl font-semibold">
                    {currency} {totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <Separator className="mb-6" />

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      label={{ value: "Year", position: "insideBottom", offset: -5 }}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      }
                      width={90}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `${currency} ${value.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}`,
                        "Cost",
                      ]}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Year-by-Year Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Year</th>
                      <th className="text-right">Base Cost</th>
                      <th className="text-right">Escalation</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((row) => (
                      <tr key={row.year} className="border-b last:border-0">
                        <td className="py-2">Year {row.year}</td>
                        <td className="text-right">{formatCurrency(row.base, currency)}</td>
                        <td className="text-right text-muted-foreground">
                          +{formatCurrency(row.escalationAmount, currency)}
                        </td>
                        <td className="text-right font-medium">
                          {formatCurrency(row.cost, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-medium">
                      <td className="py-2">Total</td>
                      <td className="text-right">
                        {formatCurrency(
                          result.reduce((sum, row) => sum + row.base, 0),
                          currency,
                        )}
                      </td>
                      <td className="text-right text-muted-foreground">
                        +
                        {formatCurrency(
                          result.reduce((sum, row) => sum + row.escalationAmount, 0),
                          currency,
                        )}
                      </td>
                      <td className="text-right">{formatCurrency(totalCost, currency)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
