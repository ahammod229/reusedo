// Firebase client settings for project binimoy-we. These keys only identify the app;
// access is enforced by Firebase Auth rules and the API, so they are safe to ship.
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
        return ios;
      default:
        // Windows/Linux have no native Firebase app; the web settings work through the REST APIs.
        return web;
    }
  }

  static const web = FirebaseOptions(
    apiKey: 'AIzaSyDbQ41y5BSdLzMjES3wvSbMY3aWqZUp1UE',
    appId: '1:305561958577:web:3e77c574eed6a50e1a8a90',
    messagingSenderId: '305561958577',
    projectId: 'binimoy-we',
    authDomain: 'binimoy-we.firebaseapp.com',
    storageBucket: 'binimoy-we.firebasestorage.app',
  );

  static const android = FirebaseOptions(
    apiKey: 'AIzaSyAiZ_6227CH6q_imgcSa9ejvgOPz_q1X3Y',
    appId: '1:305561958577:android:f27ba2f07eea6c9b1a8a90',
    messagingSenderId: '305561958577',
    projectId: 'binimoy-we',
    storageBucket: 'binimoy-we.firebasestorage.app',
  );

  static const ios = FirebaseOptions(
    apiKey: 'AIzaSyC7Fdfaox05wgkF7iq8YQfCaHvf4sJv5SY',
    appId: '1:305561958577:ios:1f896c9a199c3f281a8a90',
    messagingSenderId: '305561958577',
    projectId: 'binimoy-we',
    storageBucket: 'binimoy-we.firebasestorage.app',
    iosClientId: '305561958577-5eua093m8i9vqd2bj71r5nhli0ud47qa.apps.googleusercontent.com',
    iosBundleId: 'com.noklity.reusedo',
  );
}
