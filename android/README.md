# Codedrop Android app, built by GitHub

GitHub Actions builds a signed APK on every run and publishes it under the repository's **Releases**.
The app is the website inside Chrome (a Trusted Web Activity), so the camera, downloads and QR
scanning behave exactly as on the site, and website updates reach the app without a new APK.

## 1. Add the files to your repository
- Drag the `android` folder onto **Add file > Upload files** and commit.
- Create the workflow: **Add file > Create new file**, name it `.github/workflows/android.yml`
  (typing the slashes makes the folders), paste the contents of that file from the zip, commit.
  Folders starting with a dot are often skipped by uploads, which is why this one is created by hand.

## 2. Make a signing key (once) and store it as secrets
Every version of the app must be signed with the same key, so it lives in GitHub's encrypted secrets.

**Easiest, all in the browser (GitHub Codespaces):** on your repository click **Code > Codespaces >
Create codespace on main**. In its terminal, run (choose your own password instead of `CHANGE-ME`):

```bash
keytool -genkeypair -keystore codedrop.jks -alias codedrop -keyalg RSA -keysize 2048 \
  -validity 10000 -storepass CHANGE-ME -keypass CHANGE-ME -dname "CN=Codedrop"
base64 -w0 codedrop.jks > codedrop.b64
```

Open `codedrop.b64`, copy all of it, then right-click `codedrop.jks` and **Download** it as a private
backup. Then **delete both files** from the codespace, never commit them.

**Already built with PWABuilder?** You can reuse that key instead: its alias and passwords are in
`signing-key-info.txt`. On Windows, this copies the keystore as base64 to your clipboard (PowerShell):
`[Convert]::ToBase64String([IO.File]::ReadAllBytes("signing.keystore")) | Set-Clipboard`

Now in the repository: **Settings > Secrets and variables > Actions > New repository secret**, four times:

| Name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the long base64 text |
| `ANDROID_KEYSTORE_PASSWORD` | your keystore password |
| `ANDROID_KEY_ALIAS` | `codedrop` (or the PWABuilder alias) |
| `ANDROID_KEY_PASSWORD` | your key password (same as above if you used the command) |

## 3. Build
**Actions > Build Android app (APK) > Run workflow**. It takes a few minutes. When it turns green,
open the repository's **Releases** (right-hand side of the main page): `codedrop.apk` is there.

## 4. Remove the browser bar (once)
The run also produces `assetlinks.json` (in the release and in the run's summary). Create
`.well-known/assetlinks.json` in the repository with that content and commit. This needs the empty
`.nojekyll` file from the website setup, or GitHub Pages won't serve the `.well-known` folder.
If you also installed a PWABuilder build, its app has a different package name: put both entries
in the same file, inside one `[ ... ]` list.

## 5. Install
Open `codedrop.apk` on an Android phone and allow "install unknown apps". Later builds install as
updates, as long as the same key signs them.
