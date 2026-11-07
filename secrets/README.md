# secrets

Release credentials live here **on the build machine only**. Everything in this folder except this
README is git-ignored, and `app/scripts/release-mac.sh` refuses to run if anything else in it is tracked.

```text
secrets/cupertino/
  app-store-connect/
    AuthKey_<KEYID>.p8     # App Store Connect API key (notarization)
    key-id.txt             # or keyId.key
    issuer-id.txt          # or IssuerId.key
  apple/                   # only when the certificate is not in the login keychain
    developer-id-application.p12
    developer-id-application.p12.password
```

Resolution order for each value: environment variable → this folder → a sibling
`../qLar/secrets` checkout (read-only, never copied) → the login keychain (signing identity only).

| Variable | Meaning |
| --- | --- |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: Name (TEAMID)`; found in the keychain if unset |
| `APPLE_API_KEY`, `APPLE_API_ISSUER`, `APPLE_API_KEY_PATH` | notarization (key id, issuer id, `.p8` path) |
| `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD` | base64 `.p12` and its password, for a machine without the certificate in its keychain (CI) |
| `OSLAB_SECRETS_DIR` | another folder laid out like `secrets/cupertino` |

On GitHub Actions, put the same names in repository **secrets**; never in the workflow file.
