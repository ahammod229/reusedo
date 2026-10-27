/// Where the app finds the ReuseDo API. Override for local testing:
///   flutter run --dart-define=API_URL=http://10.0.2.2:8080/api
const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'https://reusedo.vercel.app/api');

/// The website, for pages the app opens in the browser (help, terms, courier…).
const webUrl = String.fromEnvironment('WEB_URL', defaultValue: 'https://reusedo.vercel.app');
