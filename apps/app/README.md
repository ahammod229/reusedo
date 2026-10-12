# ReuseDo app (Flutter)

One codebase for **Android, iOS, web, Windows, macOS and Linux**. The layout adapts: bottom bar on phones,
a rail on tablets, a full side menu on desktop (two-pane chat, two-column Home).

Mirrors the web app (`apps/web`): same screens, same bilingual copy (বাংলা default, English), same data shapes.

## Run

```bash
cd apps/app
flutter pub get
flutter run -d chrome        # or any connected device / -d windows / -d macos / -d linux
```

Demo sign-in: any well-formed email and password. The email code in sign-up is **123456** (sample only).

## Checks (also run in CI)

```bash
flutter analyze
flutter test
flutter build web --release
```

## Data: sample now, API next

Everything the screens need goes through `lib/data/data_source.dart`. `MockSource` implements it with sample data,
so the app is fully usable offline. To connect the real backend, write `ApiSource implements DataSource`
(each method maps to an endpoint, see the table in `docs/FLUTTER_APP.md`) and change one line in
`lib/data/providers.dart`. Sign-in goes through `AuthRepository` in `lib/features/auth/auth.dart` the same way.

## Layout

```
lib/
  core/       theme, language + theme preferences, bilingual helper (t('বাংলা', 'English'), t.n(123))
  data/       models, DataSource, MockSource, providers, district coordinates
  features/   auth, home (dashboard + donation map), feed, post (detail, quick post), chat,
              exchange (handover code, courier), profile (profile, settings, lists), shell (adaptive navigation)
  widgets/    shared widgets (cards, pills, async states, ad slot)
```

Fonts: Noto Sans Bengali (OFL) is bundled so Bangla renders the same on every platform, including desktop.
