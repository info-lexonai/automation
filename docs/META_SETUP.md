# Meta / Instagram API setup

Meta's exact screens and permission names change over time — treat this as a checklist and confirm against developers.facebook.com when you do it.

1. Go to developers.facebook.com → My Apps → Create App → choose the "Business" type.
2. Add the **Instagram** product to the app (Instagram API with Instagram Login).
3. App settings → Basic: copy **App ID** → `META_APP_ID`, copy **App Secret** → `META_APP_SECRET`.
4. Instagram → API setup with Instagram Login → add an Instagram test account (your own IG **Business or Creator** account — automation/messaging APIs require a Business or Creator account, not a personal one).
5. Set the OAuth **Redirect URI** to exactly `META_REDIRECT_URI` from your `.env` (e.g. `https://your-backend-domain.com/api/instagram/oauth/callback`). It must be HTTPS in production.
6. Request the permissions the app needs (names as of this build — verify current names in the dashboard):
   - `instagram_business_basic`
   - `instagram_business_manage_messages`
   - `instagram_business_manage_comments`
   - `instagram_business_content_publish` (only needed if you later let users post from LEXON)
7. While the app is in **Development mode**, only accounts added as testers/developers on the app can use it. To let any user connect their Instagram, you must submit the app for **App Review** with those permissions — this requires a working privacy policy URL and a screencast of the exact flow (LEXON's Connect → Dashboard flow is the one to record).
8. Once approved, switch the app to **Live** mode.
9. Put the real `META_APP_ID` / `META_APP_SECRET` / `META_REDIRECT_URI` in the **backend's** environment only.
