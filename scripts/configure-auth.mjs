// Configures Supabase Auth for 254 through the Management API.
// Usage: node scripts/configure-auth.mjs   (reads the access token from ./.secret; never prints it)
import { readFileSync } from 'node:fs';

const REF = 'drbkkzrmrvwodinsllrk';
const token = readFileSync(new URL('../.secret', import.meta.url), 'utf8').replace(/^[^:]*:\s*/, '').trim();
const recovery = readFileSync(new URL('../supabase/templates/recovery.html', import.meta.url), 'utf8');

const config = {
  site_url: 'two54://',
  uri_allow_list: 'two54://**,exp+app-254://**',
  external_email_enabled: true,
  mailer_autoconfirm: true, // sign-up goes straight into the app (designs: Sign up → Create first habit)
  password_min_length: 8,
  mailer_otp_exp: 1800, // reset link valid for 30 minutes
  mailer_secure_email_change_enabled: true,
  security_update_password_require_reauthentication: false,
  // Custom templates need a custom SMTP provider on the free plan; enable once SMTP is set up:
  ...(process.env.WITH_TEMPLATES ? { mailer_subjects_recovery: 'Reset your 254 password', mailer_templates_recovery_content: recovery } : {}),
};

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(config),
});
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error('Failed:', res.status, JSON.stringify(body).slice(0, 500));
  process.exit(1);
}
for (const k of Object.keys(config)) {
  const v = body[k];
  console.log(k.padEnd(40), typeof v === 'string' && v.length > 60 ? `${v.slice(0, 40)}…` : v);
}
console.log('rate_limit_email_sent'.padEnd(40), body.rate_limit_email_sent, '(emails/hour with built-in SMTP)');
console.log('smtp configured'.padEnd(40), Boolean(body.smtp_host));
