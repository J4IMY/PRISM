import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { api, WatchlistItem } from "@/lib/api";

export default function WatchlistScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { items: data } = await api.watchlist.list();
      setItems(data);
      setSelectedIds([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load watchlist");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const remove = async (id: string) => {
    try {
      await api.watchlist.remove(id);
      setItems((prev) => prev.filter((s) => s.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } catch {
      // ignore
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const openCompare = () => {
    if (selectedIds.length < 2) return;
    const ids = selectedIds.join(",");
    router.push({ pathname: "/compare", params: { ids } });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Watchlist</Text>
          <Text style={[styles.count, { color: theme.mutedForeground }]}>
            {items.length} saved
          </Text>
        </View>
        {selectedIds.length >= 2 && (
          <Pressable
            onPress={openCompare}
            style={[styles.compareBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.compareBtnText, { color: theme.primaryForeground }]}>
              Compare ({selectedIds.length})
            </Text>
          </Pressable>
        )}
      </View>

      {error ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyBody, { color: theme.mutedForeground }]}>{error}</Text>
          <Pressable
            onPress={() => router.push("/auth/login")}
            style={[styles.browseBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.browseBtnText, { color: theme.primaryForeground }]}>Sign in</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyIcon, { color: theme.mutedForeground }]}>♡</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved systems yet</Text>
          <Pressable
            onPress={() => router.push("/")}
            style={[styles.browseBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.browseBtnText, { color: theme.primaryForeground }]}>
              Browse systems
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const checked = selectedIds.includes(item.id);
            const disabled = selectedIds.length >= 3 && !checked;
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/system/[slug]",
                    params: { slug: item.slug },
                  })
                }
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor: checked ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.checkCol}>
                    <Pressable
                      onPress={() => toggleSelect(item.id)}
                      disabled={disabled}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: disabled ? theme.border : theme.primary,
                          backgroundColor: checked ? theme.primary : "transparent",
                        },
                      ]}
                    >
                      {checked && <Text style={[styles.checkLabel, { color: theme.primaryForeground }]}>✓</Text>}
                    </Pressable>
                  </View>
                  <View style={styles.meta}>
                    <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.vendor, { color: theme.mutedForeground }]}>
                      {item.vendor_name}
                    </Text>
                  </View>
                  <Text style={[styles.price, { color: theme.text }]}>{item.starting_price}</Text>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => remove(item.id)}
                    style={[styles.actionBtn, { borderColor: theme.border }]}
                  >
                    <Text style={{ color: "#E53E3E", fontWeight: "600" }}>Remove</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  title: { fontSize: 22, fontWeight: "700" },
  count: { fontSize: 12, marginTop: 1 },
  compareBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  compareBtnText: { fontWeight: "700", fontSize: 14 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, textAlign: "center" },
  browseBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  browseBtnText: { fontWeight: "700" },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  checkCol: { marginRight: Spacing.sm, justifyContent: "center" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkLabel: { fontSize: 14, fontWeight: "700" },
  cardTop: { flexDirection: "row", alignItems: "center" },
  meta: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700" },
  vendor: { fontSize: 12, marginTop: 2 },
  price: { fontSize: 13, fontWeight: "700", marginLeft: Spacing.sm },
  actions: { flexDirection: "row" },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
});
