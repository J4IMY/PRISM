# PRISM — Android (React Native)

Source-only React Native screens that mirror the web app. Drop into an
Expo / React Native project (RN 0.74+, React Navigation 6+).

```
mobile/
  App.tsx                     # Navigation root (stack + tabs + role drawers)
  theme.ts                    # Colors, spacing, typography
  data/mockData.ts            # Shared mock data
  components/                 # Reusable UI primitives
  screens/
    auth/                     # Login, Signup, Forgot, Reset
    discovery/                # Home (search), SystemDetail, Compare, Watchlist
    account/                  # Profile, Settings
    vendor/                   # Dashboard, Company, Team, Inbox, Systems list/edit
    admin/                    # Dashboard, Scraper, Deletions, Moderators, Vendors, Audit
    moderator/                # Dashboard, Queue, ItemReview
```

## Install (target project)

```bash
npx create-expo-app my-app --template blank-typescript
cd my-app
npm i @react-navigation/native @react-navigation/native-stack \
      @react-navigation/bottom-tabs @react-navigation/drawer \
      react-native-screens react-native-safe-area-context \
      react-native-gesture-handler react-native-reanimated \
      @expo/vector-icons
```

Copy the `mobile/` folder contents into the Expo project root and point
`App.tsx` to `./App`.

## Notes
- All data is mocked in `data/mockData.ts`.
- Auth state is faked via a React context in `App.tsx` for navigation gating.
- No network calls — ready to be wired to Lovable Cloud / Supabase later.
