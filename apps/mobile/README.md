# ReuseDo app (Flutter)

The cross-platform ReuseDo app: Android, iOS, web and macOS from one codebase. It uses the same
Firebase project (`binimoy-we`) and the same API as the website, so one account works everywhere.

## What it does

- Sign in with email or Google, verify email, set area and phone
- Feed with type, area and category filters; pull to refresh
- Post details, "I want this" / "I have this" requests, report, share
- New post with camera or gallery photos, and AI filling in the title and details
- AI search
- Messages (refreshes every few seconds while a chat is open)
- Profile, my posts (mark given, delete), saved, notifications
- Bengali / English and dark mode

Exchanges, courier and help open the website.

## Run

```sh
flutter pub get
flutter run                     # a connected phone, emulator, or Chrome
```

It talks to `https://reusedo.vercel.app/api` by default. Point it elsewhere with
`--dart-define=API_URL=http://10.0.2.2:8080/api` (Android emulator → local API).

## Build

```sh
flutter build apk --release --split-per-abi   # Android, for sharing directly
flutter build appbundle --release             # Android, for the Play Store
flutter build ipa                             # iOS (needs an Apple developer account)
flutter build web --release                   # web
flutter build macos --release                 # macOS
```

Release builds are signed with the debug key until an upload key is set up in
`android/app/build.gradle.kts` (needed for the Play Store).

## Notes

- Firebase settings are in `lib/firebase_options.dart` (client keys, safe to ship).
- `lib/core/bd.dart` is generated from `apps/web/src/features/geo/bd.ts`.
- Bengali uses the bundled Noto Sans Bengali font so text measures the same on every platform.
