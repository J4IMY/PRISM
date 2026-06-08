# TODO

## Migrations task: make `npm run migrateM` work on Windows without Bun
- [ ] Update `package.json` scripts: replace `bun run scripts/migrate.ts` with a Node-based command
- [ ] Update `package.json` scripts for `seed` similarly
- [ ] Run migrations using the new command and confirm it applies `migrations/*.sql`
- [ ] Document required env var `DATABASE_URL` if needed

