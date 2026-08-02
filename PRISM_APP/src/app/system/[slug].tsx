import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Video, ResizeMode } from "expo-av";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useApi } from "@/hooks/use-api";
import { api, SystemFeature, PricingPlan, SystemIntegration, Review, SystemMedia } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-storage";

const TABS = ["Overview", "Pricing", "Features", "TCO", "Media", "Reviews"] as const;
type Tab = (typeof TABS)[number];

export default function SystemDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("Overview");
  const [watchlisted, setWatchlisted] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [seats, setSeats] = useState("50");
  const [term, setTerm] = useState("3");
  const [escalation, setEscalation] = useState("5");
  const [discount, setDiscount] = useState("10");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [tcoResult, setTcoResult] = useState<{ total: number; years: { year: number; cost: number }[] } | null>(null);
  const [tcoError, setTcoError] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState("");

  const { data, loading, error } = useApi(() => api.systems.get(slug ?? ""), [slug]);

  const system = data?.system;
  const features = data?.features ?? [];
  const integrations = data?.integrations ?? [];
  const plans = data?.plans ?? [];
  const reviews = data?.reviews ?? [];
  const media = data?.media ?? [];

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  useEffect(() => {
    if (!system?.id) return;
    (async () => {
      const token = await getAuthToken();
      if (!token) return;
      try {
        const { items } = await api.watchlist.list();
        setWatchlisted(items.some((i) => i.id === system.id));
      } catch {
        // ignore
      }
    })();
  }, [system?.id]);

  const toggleWatchlist = useCallback(async () => {
    if (!system) return;
    const token = await getAuthToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setWatchlistLoading(true);
    const wasListed = watchlisted;
    setWatchlisted(!wasListed);
    try {
      if (wasListed) {
        await api.watchlist.remove(system.id);
      } else {
        await api.watchlist.add(system.id);
      }
    } catch {
      setWatchlisted(wasListed);
    } finally {
      setWatchlistLoading(false);
    }
  }, [system, watchlisted]);

  const handleMessageVendor = async () => {
    if (!system) return;
    const token = await getAuthToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    if (!messageBody.trim()) return;

    setMessageLoading(true);
    setMessageError("");
    try {
      const subject = `Re: ${system.name}`;
      const result = await api.threads.create({
        system_id: system.id,
        subject,
        message: messageBody.trim(),
      });
      setMessageOpen(false);
      setMessageBody("");
      router.push(`/chat/${result.thread.id}`);
    } catch (e) {
      setMessageError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setMessageLoading(false);
    }
  };

  const toNum = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const basePrice = plans.find((p) => p.is_popular)?.price ?? "$0";
  const basePriceNum = parseInt(basePrice.replace(/[^0-9]/g, ""), 10) || 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => goBack()} style={styles.backBtn} hitSlop={8}>
            <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Loading…</Text>
        </View>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !system) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => goBack()} style={styles.backBtn} hitSlop={8}>
            <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Error</Text>
        </View>
        <View style={styles.loaderBox}>
          <Text style={[styles.errorText, { color: theme.mutedForeground }]}>
            {error ?? "System not found"}
          </Text>
          <Pressable
            onPress={() => goBack()}
            style={[styles.backLink, { borderColor: theme.border }]}
          >
            <Text style={[styles.backLinkText, { color: theme.text }]}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const featuresByCategory = features.reduce<Record<string, SystemFeature[]>>((acc, f) => {
    const cat = f.category ?? "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => goBack()} style={styles.backBtn} hitSlop={8}>
          <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {system.name}
        </Text>
        <Pressable onPress={toggleWatchlist} hitSlop={8} disabled={watchlistLoading}>
          <Text
            style={[styles.heartBtn, { color: watchlisted ? "#E53E3E" : theme.mutedForeground }]}
          >
            {watchlisted ? "♥" : "♡"}
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoBox, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.logoLetter, { color: theme.mutedForeground }]}>
              {system.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.systemName, { color: theme.text }]}>{system.name}</Text>
            <Text style={[styles.systemVendor, { color: theme.mutedForeground }]}>
              {system.vendor_name} · {system.category_name}
            </Text>
          </View>
          {system.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.verifiedBg }]}>
              <Text style={[styles.verifiedText, { color: theme.verified }]}>✓ Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.ratingRow}>
          <Text style={[styles.rating, { color: theme.text }]}>
            ★ {Number(system.rating).toFixed(1)}
          </Text>
          <Text style={[styles.reviewCount, { color: theme.mutedForeground }]}>
            ({system.review_count} reviews)
          </Text>
        </View>

        <Text style={[styles.tagline, { color: theme.mutedForeground }]}>{system.tagline}</Text>

        <View style={styles.ctaRow}>
          <Pressable
            onPress={toggleWatchlist}
            disabled={watchlistLoading}
            style={[styles.ctaBtn, { borderColor: theme.border, flex: 1 }]}
          >
            <Text style={[styles.ctaBtnText, { color: theme.text }]}>
              {watchlisted ? "♥ Saved" : "♡ Watchlist"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMessageOpen(true)}
            style={[styles.ctaBtn, { backgroundColor: theme.primary, flex: 1 }]}
          >
            <Text style={[styles.ctaBtnText, { color: theme.primaryForeground }]}>
              Message vendor
            </Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContent}
        >
          {TABS.map((t) => {
            const active = t === tab;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: active ? theme.primary : "transparent",
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: active ? theme.primaryForeground : theme.textSecondary },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.tabBody}>
          {/* OVERVIEW */}
          {tab === "Overview" && (
            <>
              <Card theme={theme}>
                <SectionTitle title="About" theme={theme} />
                <Text style={[styles.bodyText, { color: theme.mutedForeground }]}>
                  {system.description}
                </Text>
              </Card>

              <InfoRow
                label="Starting price"
                value={system.starting_price ?? "Contact sales"}
                theme={theme}
              />
              <InfoRow label="Deployment" value={system.deployment_type} theme={theme} />
              <InfoRow label="Best fit" value={system.target_size} theme={theme} />
              <InfoRow
                label="Rating"
                value={`${Number(system.rating).toFixed(1)} / 5`}
                theme={theme}
              />
              {system.trial_available && (
                <InfoRow label="Free trial" value="Available" theme={theme} />
              )}

              {(system.security_certifications ?? []).length > 0 && (
                <Card theme={theme}>
                  <SectionTitle title="Compliance" theme={theme} />
                  <View style={styles.chipRow}>
                    {(system.security_certifications ?? []).map((c: string, idx: number) => (
                      <View
                        key={`${c}-${idx}`}
                        style={[styles.chip, { backgroundColor: theme.backgroundElement }]}
                      >
                        <Text style={[styles.chipText, { color: theme.text }]}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              )}

              {integrations.length > 0 && (
                <Card theme={theme}>
                  <SectionTitle title="Integrations" theme={theme} />
                  <View style={styles.chipRow}>
                    {integrations.map((i: SystemIntegration, idx: number) => (
                      <View
                        key={`${i.integration_name}-${i.integration_type}-${idx}`}
                        style={[styles.chip, { backgroundColor: theme.backgroundElement }]}
                      >
                        <Text style={[styles.chipText, { color: theme.text }]}>
                          {i.integration_name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card>
              )}
            </>
          )}

          {/* PRICING */}
          {tab === "Pricing" && (
            <>
              {plans.length === 0 ? (
                <Card theme={theme}>
                  <Text style={[styles.bodyText, { color: theme.mutedForeground }]}>
                    Contact vendor for pricing.
                  </Text>
                </Card>
              ) : (
                plans.map((plan: PricingPlan) => (
                  <Card key={plan.name + plan.price} theme={theme}>
                    {plan.is_popular && (
                      <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.popularText, { color: theme.primaryForeground }]}>
                          Most popular
                        </Text>
                      </View>
                    )}
                    <View style={styles.planHeader}>
                      <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
                      <View style={styles.planPrice}>
                        <Text style={[styles.planPriceMain, { color: theme.text }]}>
                          {plan.price}
                        </Text>
                        <Text style={[styles.planPriceSub, { color: theme.mutedForeground }]}>
                          {plan.billing_cycle}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                     {(plan.features ?? []).map((f: string, fIdx: number) => (
                       <View key={`${f}-${fIdx}`} style={styles.featureRow}>
                        <Text style={[styles.checkmark, { color: theme.verified }]}>✓</Text>
                        <Text style={[styles.featureText, { color: theme.text }]}>{f}</Text>
                      </View>
                    ))}
                    <Pressable
                      style={[
                        styles.planBtn,
                        plan.price === "Custom"
                          ? { borderWidth: 1, borderColor: theme.border }
                          : { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.planBtnText,
                          {
                            color: plan.price === "Custom" ? theme.text : theme.primaryForeground,
                          },
                        ]}
                      >
                        {plan.price === "Custom" ? "Contact sales" : "Get started"}
                      </Text>
                    </Pressable>
                  </Card>
                ))
              )}
            </>
          )}

          {/* FEATURES */}
          {tab === "Features" && (
            <>
              {Object.entries(featuresByCategory).map(([category, catFeatures]) => (
                <Card key={category} theme={theme}>
                  <SectionTitle title={category} theme={theme} />
                  {catFeatures.map((f: SystemFeature, i: number) => (
                    <View key={`${f.feature_name}-${i}`}>
                      <View style={styles.featureMatrixRow}>
                        <Text style={[styles.featureMatrixName, { color: theme.text }]}>
                          {f.feature_name}
                        </Text>
                        <Text
                          style={[
                            styles.featureMatrixVal,
                            {
                              color: f.feature_value ? theme.verified : theme.mutedForeground,
                            },
                          ]}
                        >
                          {f.feature_value ? "✓" : "—"}
                        </Text>
                      </View>
                      {i < catFeatures.length - 1 && (
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                      )}
                    </View>
                  ))}
                </Card>
              ))}
            </>
          )}

          {/* TCO */}
          {tab === "TCO" && (
            <>
              <Card theme={theme}>
                <SectionTitle title="TCO Inputs" theme={theme} />
                <TcoInput label="Number of seats" value={seats} onChange={setSeats} theme={theme} />
                <TcoInput
                  label="Term length (years)"
                  value={term}
                  onChange={setTerm}
                  theme={theme}
                />
                <TcoInput
                  label="Annual price escalation %"
                  value={escalation}
                  onChange={setEscalation}
                  theme={theme}
                />
                <TcoInput label="Discount %" value={discount} onChange={setDiscount} theme={theme} />
                <Pressable
                  onPress={() => {
                    setTcoError("");
                    const seatsNum = toNum(seats);
                    const termNum = toNum(term);
                    const escalationNum = toNum(escalation);
                    const discountNum = toNum(discount);
                    const base = basePriceNum;
                    if (base <= 0 && seatsNum <= 0) {
                      setTcoError("Enter a valid base price or number of seats.");
                      setTcoResult(null);
                      return;
                    }
                    const year1 = seatsNum * base * 12 * (1 - discountNum / 100);
                    const years: { year: number; cost: number }[] = [];
                    for (let i = 1; i <= termNum; i++) {
                      const cost = i === 1 ? year1 : year1 * Math.pow(1 + escalationNum / 100, i - 1);
                      years.push({ year: i, cost });
                    }
                    setTcoResult({ total: years.reduce((sum, y) => sum + y.cost, 0), years });
                  }}
                  style={[styles.calcBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.calcBtnText, { color: theme.primaryForeground }]}>Calculate TCO</Text>
                </Pressable>
                {tcoError ? (
                  <Text style={[styles.tcoNote, { color: "#E53E3E" }]}>{tcoError}</Text>
                ) : null}
              </Card>

              {tcoResult && (
                <Card theme={theme} bg={theme.primary}>
                  <Text style={[styles.tcoLabel, { color: theme.primaryForeground, opacity: 0.7 }]}>
                    Estimated {term}-year TCO
                  </Text>
                  <Text style={[styles.tcoTotal, { color: theme.primaryForeground }]}>
                    ${Math.round(tcoResult.total).toLocaleString()}
                  </Text>
                  <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
                  {tcoResult.years.map((row) => (
                    <TcoRow key={row.year} label={`Year ${row.year}`} value={row.cost} color={theme.primaryForeground} />
                  ))}
                </Card>
              )}
            </>
          )}

          {/* MEDIA */}
          {tab === "Media" && (
            <>
              {media.length === 0 ? (
                <Card theme={theme}>
                  <Text style={[styles.bodyText, { color: theme.mutedForeground }]}>
                    No media available.
                  </Text>
                </Card>
              ) : (
                media.map((m: SystemMedia) => (
                  <Card key={m.id} theme={theme}>
                     {m.media_type === "video" &&
                     typeof m.url === "string" &&
                     (m.url.startsWith("http://") || m.url.startsWith("https://")) ? (
                       <Video
                         source={{ uri: m.url }}
                         style={styles.videoPlayer}
                         useNativeControls
                         resizeMode={ResizeMode.CONTAIN}
                       />
                     ) : (
                       <View
                         style={[
                           styles.mediaPlaceholder,
                           { backgroundColor: theme.backgroundElement },
                         ]}
                       >
                         <Text style={[styles.bodyText, { color: theme.mutedForeground }]}>
                           {m.media_type === "video"
                             ? "Video unavailable"
                             : `${m.media_type}: ${m.url}`}
                         </Text>
                       </View>
                     )}
                    {m.caption ? (
                      <Text style={[styles.bodyText, { color: theme.mutedForeground }]}>
                        {m.caption}
                      </Text>
                    ) : null}
                  </Card>
                ))
              )}
            </>
          )}

          {/* REVIEWS */}
          {tab === "Reviews" && (
            <>
              {reviews.length === 0 ? (
                <Card theme={theme}>
                  <Text style={[styles.bodyText, { color: theme.mutedForeground }]}>
                    No reviews yet.
                  </Text>
                </Card>
              ) : (
                reviews.map((r: Review, i: number) => (
                  <Card key={i} theme={theme}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewMeta}>
                        <Text style={[styles.reviewTitle, { color: theme.text }]}>{r.title}</Text>
                        {r.is_verified_customer && (
                          <Text style={[styles.reviewVerified, { color: theme.verified }]}>
                            ✓ Verified customer
                          </Text>
                        )}
                      </View>
                      <View style={styles.reviewRating}>
                        <Text style={[styles.reviewStars, { color: theme.primary }]}>
                          {"★".repeat(Math.round(r.rating))}
                          {"☆".repeat(5 - Math.round(r.rating))}
                        </Text>
                        <Text style={[styles.reviewRatingNum, { color: theme.mutedForeground }]}>
                          {Number(r.rating).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.bodyText, { color: theme.mutedForeground }]}>
                      {r.review_text}
                    </Text>
                    {r.pros && (
                      <View style={styles.proConRow}>
                        <Text style={[styles.proLabel, { color: theme.verified }]}>Pros</Text>
                        <Text style={[styles.proConText, { color: theme.text }]}>{r.pros}</Text>
                      </View>
                    )}
                    {r.cons && (
                      <View style={styles.proConRow}>
                        <Text style={[styles.conLabel, { color: "#E53E3E" }]}>Cons</Text>
                        <Text style={[styles.proConText, { color: theme.text }]}>{r.cons}</Text>
                      </View>
                    )}
                  </Card>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={messageOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setMessageOpen(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Message vendor</Text>
            <Text style={[styles.modalSubtitle, { color: theme.mutedForeground }]}>
              {system.vendor_name}
            </Text>

            {messageError ? (
              <Text style={[styles.modalError, { color: "#E53E3E" }]}>{messageError}</Text>
            ) : null}

            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
              placeholder="Hi, I have a question about…"
              placeholderTextColor={theme.mutedForeground}
              value={messageBody}
              onChangeText={setMessageBody}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setMessageOpen(false);
                  setMessageBody("");
                  setMessageError("");
                }}
                style={[styles.modalBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleMessageVendor}
                disabled={messageLoading || !messageBody.trim()}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: messageLoading || !messageBody.trim() ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: theme.primaryForeground }]}>
                  {messageLoading ? "Sending…" : "Send"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Card({ children, theme, bg }: { children: React.ReactNode; theme: any; bg?: string }) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg ?? theme.card, borderColor: bg ? "transparent" : theme.border },
      ]}
    >
      {children}
    </View>
  );
}

function SectionTitle({ title, theme }: { title: string; theme: any }) {
  return <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>;
}

function InfoRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={[styles.infoRow, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function TcoInput({
  label,
  value,
  onChange,
  theme,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  theme: any;
}) {
  return (
    <View style={styles.tcoField}>
      <Text style={[styles.tcoFieldLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[
          styles.tcoFieldInput,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.backgroundElement,
          },
        ]}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
      />
    </View>
  );
}

function TcoRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.tcoBreakRow}>
      <Text style={[styles.tcoBreakLabel, { color, opacity: 0.8 }]}>{label}</Text>
      <Text style={[styles.tcoBreakVal, { color }]}>${Math.round(value).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loaderBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.md },
  errorText: { fontSize: 14, textAlign: "center" },
  backLink: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  backLinkText: { fontSize: 14, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  backBtn: { padding: 2 },
  backArrow: { fontSize: 28, lineHeight: 32, fontWeight: "300" },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "700" },
  heartBtn: { fontSize: 22 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: { fontSize: 24, fontWeight: "700" },
  heroText: { flex: 1 },
  systemName: { fontSize: 20, fontWeight: "800" },
  systemVendor: { fontSize: 13, marginTop: 3 },
  verifiedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  verifiedText: { fontSize: 12, fontWeight: "700" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  rating: { fontSize: 14, fontWeight: "700" },
  reviewCount: { fontSize: 13 },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  ctaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  ctaBtn: {
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  ctaBtnText: { fontSize: 14, fontWeight: "700" },
  tabScroll: { flexGrow: 0 },
  tabContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
    flexDirection: "row",
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  tabLabel: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  tabBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    opacity: 0.5,
  },
  bodyText: { fontSize: 14, lineHeight: 21 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  chipText: { fontSize: 12, fontWeight: "600", lineHeight: 16 },
  divider: { height: 1, marginVertical: Spacing.xs },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "700" },
  popularBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginBottom: 4,
  },
  popularText: { fontSize: 11, fontWeight: "700" },
  planHeader: { gap: 4 },
  planName: { fontSize: 18, fontWeight: "700" },
  planPrice: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  planPriceMain: { fontSize: 28, fontWeight: "800" },
  planPriceSub: { fontSize: 13 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  checkmark: { fontSize: 14, fontWeight: "700" },
  featureText: { fontSize: 14 },
  planBtn: {
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  planBtnText: { fontSize: 15, fontWeight: "700" },
  featureMatrixRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  featureMatrixName: { fontSize: 14 },
  featureMatrixVal: { fontSize: 14, fontWeight: "700" },
  tcoField: { gap: 6 },
  tcoFieldLabel: { fontSize: 12, fontWeight: "600" },
  tcoFieldInput: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    fontWeight: "600",
  },
  tcoNote: { fontSize: 12, lineHeight: 17, opacity: 0.7 },
  calcBtn: {
    marginTop: Spacing.sm,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  calcBtnText: { fontSize: 15, fontWeight: "700" },
  tcoLabel: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  tcoTotal: { fontSize: 40, fontWeight: "800" },
  tcoBreakRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tcoBreakLabel: { fontSize: 14 },
  tcoBreakVal: { fontSize: 14, fontWeight: "700" },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  reviewMeta: { flex: 1, gap: 3 },
  reviewTitle: { fontSize: 15, fontWeight: "700" },
  reviewVerified: { fontSize: 11, fontWeight: "600" },
  reviewRating: { alignItems: "flex-end", gap: 2 },
  reviewStars: { fontSize: 13 },
  reviewRatingNum: { fontSize: 12 },
  proConRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "flex-start" },
  proLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
    width: 32,
  },
  conLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
    width: 32,
  },
  proConText: { flex: 1, fontSize: 13, lineHeight: 18 },
  videoPlayer: { width: "100%", height: 200, borderRadius: Radius.md, backgroundColor: "#000" },
  mediaPlaceholder: {
    width: "100%",
    minHeight: 120,
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSubtitle: { fontSize: 14, marginTop: -Spacing.xs },
  modalError: { fontSize: 13 },
  modalInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  modalBtnText: { fontSize: 15, fontWeight: "700" },
});
