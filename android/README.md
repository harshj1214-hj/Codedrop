# Codedrop Android app

Every push that changes `android/` makes GitHub build `codedrop.apk` and publish it under
**Releases** on the repository's main page. Download it on an Android phone and open it to install.
To build without changing anything: **Actions > Build Android app (APK) > Run workflow**.

The signing key (`app/codedrop-signing.jks`) is part of the project so builds need no setup.
That's fine for a class project. Before publishing on the Play Store, switch to a private key.
