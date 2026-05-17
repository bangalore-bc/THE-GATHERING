# Google Sheets Secure Subscription Setup Guide

This guide outlines how to connect **The Gathering** website subscription form to a Google Sheet in a highly secure and privacy-compliant manner. 

To satisfy international privacy standards (such as **GDPR**, **CCPA/CPRA**, and general enterprise-grade cybersecurity practices), this implementation secures the entire pipeline against major vulnerabilities like:
1. **Unauthorized Webhook Writes / Spamming:** Protecting your sheet from external attackers flooding your database with fake records or exhausting your Google quota.
2. **Google Sheets Formula Injection (CSV Injection):** Preventing attackers from injecting malicious formulas (e.g., beginning with `=`) that could execute in your browser and exfiltrate all existing subscriber emails.
3. **Personally Identifiable Information (PII) Leakage in Logs:** Eliminating raw emails or phone numbers from system logs, using secure hashes and masked representations instead.
4. **Data Minimization:** Ensuring only necessary, validated data is stored, and preventing redundant duplicate records.

---

## Part 1: The Google Apps Script Code

Create a Google Sheet named **THE GATHERING**. In the menu bar, go to **Extensions** &rarr; **Apps Script**, delete any default code, and copy-paste the secure script below:

```javascript
 
```

---

## Part 2: How to Deploy the Script (Steps)

1. Open your Google Sheet named **THE GATHERING**.
2. Go to **Extensions** &rarr; **Apps Script**.
3. Replace the contents of `Code.gs` with the script above.
4. **Configure your Secret Token (Highly Recommended):**
   - Click the **Gear Icon** (Project Settings) on the left sidebar.
   - Scroll down to **Script Properties**.
   - Click **Add script property**.
   - Set **Property** to `API_KEY`.
   - Set **Value** to a strong secret string (e.g., `GATHERING_SECURE_TOKEN_3a7b9e` or any randomly generated key of your choice).
   - Click **Save script properties**.
5. **Deploy as a Web App:**
   - Click the blue **Deploy** button in the top right corner &rarr; select **New deployment**.
   - Click the gear next to "Select type" and select **Web app**.
   - Set **Description** to `The Gathering Secure Subscription Webhook`.
   - Set **Execute as** to **Me** (this gives the script write permission to your private sheet).
   - Set **Who has access** to **Anyone** (this is necessary so that your website backend can submit data, but don't worry—the script restricts access using the `API_KEY` token check).
   - Click **Deploy**.
   - You may be prompted to authorize permissions. Click **Authorize Access**, select your Google Account, click **Advanced**, click **Go to Untitled project (unsafe)**, and click **Allow**.
6. Copy the **Web App URL** generated. It will look like this:
   `https://script.google.com/macros/s/AKfycb.../exec`
7. Go to **The Gathering Admin Portal** (`http://localhost:8080/admin.html`), scroll to **Settings**, paste this Web App URL into **Google Sheet Webhook URL**, and click **Save Settings**.

---

## Part 3: Privacy & Security Best Practices Checked

| Security Vector | Risk | Mitigation | Compliant? |
| :--- | :--- | :--- | :---: |
| **Data In Transit** | Eavesdropping / Man-in-the-Middle (MITM) | Standard HTTPS TLS 1.3 encryption is enforced by both Node.js native requests and the Google servers. | **Yes** &check; |
| **Authentication** | Spoofing/Spamming the public webhook | A custom `Authorization: Bearer <token>` token is sent by the Node backend and verified by the Apps Script before any row is written. | **Yes** &check; |
| **Formula Injection** | Malicious formula inputs exfiltrating database | Escapes input strings starting with `=, +, -, @` by prepending `'` forcing literal text rendering. | **Yes** &check; |
| **PII in Debug Logs** | Leaking sensitive user data in cloud audit logs | Emails are fully masked in logs (e.g. `a***n@example.com`). Hashing/redaction shields user privacy. | **Yes** &check; |
| **Access Rights** | Public reading your subscriber list | The sheet remains **100% Private** to you. The Web App executes *as the owner*, allowing write-only access without exposing read capabilities. | **Yes** &check; |
| **Input Validation** | Trash data polluting sheet or database | Regular expression format validation runs *both* on your Node.js backend and within the Apps Script itself. | **Yes** &check; |
