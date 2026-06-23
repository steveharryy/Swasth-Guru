import nodemailer from 'nodemailer';

const isSMTPConfigured = !!(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD);
const transporter = isSMTPConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : null;

// ─────────────────────────────────────────────────────────────────────────────
// HTML Templates
// ─────────────────────────────────────────────────────────────────────────────

function patientEmailHTML(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to SwasthGuru</title>
</head>
<body style="margin:0;padding:0;background:#FDF8F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1A8A7A 0%,#0f6b5e 100%);border-radius:20px 20px 0 0;padding:40px 48px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:12px 24px;margin-bottom:16px;">
                <span style="font-size:28px;">🌿</span>
                <span style="color:white;font-size:22px;font-weight:900;letter-spacing:-0.5px;margin-left:8px;">SwasthGuru</span>
              </div>
              <div style="color:rgba(255,255,255,0.8);font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-top:8px;">
                आपका स्वास्थ्य, हमारी प्राथमिकता
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:48px 48px 32px;border-left:1px solid #EDE8E0;border-right:1px solid #EDE8E0;">
              <p style="margin:0 0 8px;color:#1A8A7A;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Welcome Aboard!</p>
              <h1 style="margin:0 0 24px;color:#2D1F0F;font-size:28px;font-weight:900;line-height:1.2;">
                नमस्ते, ${name}! 🙏
              </h1>
              <p style="margin:0 0 24px;color:#6B5B4E;font-size:16px;line-height:1.7;">
                We are truly delighted to welcome you to <strong style="color:#1A8A7A;">SwasthGuru</strong> — a platform built with one mission: to bring <strong>quality healthcare</strong> right to your doorstep, no matter where you live.
              </p>

              <!-- Feature List -->
              <div style="background:#F7F3ED;border-radius:16px;padding:28px 32px;margin:0 0 28px;">
                <p style="margin:0 0 16px;color:#2D1F0F;font-size:15px;font-weight:800;">With SwasthGuru, you can now:</p>
                ${[
                  ['📹', 'Book instant <strong>video consultations</strong> with qualified doctors from home'],
                  ['🏠', 'Get expert medical advice <strong>without traveling</strong> to a clinic'],
                  ['🗂️', 'Securely store and access your <strong>medical records</strong> anytime'],
                  ['💊', 'Track your <strong>medicines and health vitals</strong> daily'],
                  ['⏰', 'Connect with trusted doctors <strong>24/7</strong>'],
                ].map(([icon, text]) => `
                <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
                  <span style="font-size:18px;margin-right:12px;line-height:1.5;">${icon}</span>
                  <span style="color:#4A3728;font-size:14px;line-height:1.6;">${text}</span>
                </div>`).join('')}
              </div>

              <p style="margin:0 0 32px;color:#6B5B4E;font-size:15px;line-height:1.7;">
                Your health matters deeply to us. We are here to ensure that <strong>every family, every village</strong> gets the care it deserves — accessible, affordable, and always available.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:0 0 32px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/patient/dashboard"
                   style="display:inline-block;background:linear-gradient(135deg,#F08020 0%,#d96a10 100%);color:white;text-decoration:none;font-size:16px;font-weight:800;padding:16px 40px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 8px 24px rgba(240,128,32,0.35);">
                  Go to My Dashboard →
                </a>
              </div>

              <div style="border-top:1px solid #EDE8E0;padding-top:24px;text-align:center;">
                <p style="margin:0;color:#A89080;font-size:13px;line-height:1.6;">
                  Stay healthy, stay strong. 💚<br/>
                  Need help? Reply to this email — we're always here.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F7F3ED;border-radius:0 0 20px 20px;padding:24px 48px;text-align:center;border:1px solid #EDE8E0;border-top:none;">
              <p style="margin:0 0 6px;color:#1A8A7A;font-size:14px;font-weight:800;">Team SwasthGuru</p>
              <p style="margin:0;color:#A89080;font-size:12px;">
                Telemedicine for Rural India &bull; Empowering Every Family
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function doctorEmailHTML(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to SwasthGuru — Doctor</title>
</head>
<body style="margin:0;padding:0;background:#FDF8F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f6b5e 0%,#1A8A7A 60%,#F08020 100%);border-radius:20px 20px 0 0;padding:40px 48px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:12px 24px;margin-bottom:16px;">
                <span style="font-size:28px;">🩺</span>
                <span style="color:white;font-size:22px;font-weight:900;letter-spacing:-0.5px;margin-left:8px;">SwasthGuru</span>
              </div>
              <div style="color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-top:8px;">
                आपकी सेवा, हमारा सम्मान
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:48px 48px 32px;border-left:1px solid #EDE8E0;border-right:1px solid #EDE8E0;">
              <p style="margin:0 0 8px;color:#F08020;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Doctor Onboarding Complete</p>
              <h1 style="margin:0 0 24px;color:#2D1F0F;font-size:28px;font-weight:900;line-height:1.2;">
                Welcome, Dr. ${name}! 🙏
              </h1>
              <p style="margin:0 0 24px;color:#6B5B4E;font-size:16px;line-height:1.7;">
                It is a true honour to have you join the <strong style="color:#1A8A7A;">SwasthGuru</strong> network. You are now part of a mission-driven community of healthcare professionals connecting with patients across India — especially those in <strong>rural and underserved communities</strong> who need you most.
              </p>

              <!-- Feature List -->
              <div style="background:#F7F3ED;border-radius:16px;padding:28px 32px;margin:0 0 28px;">
                <p style="margin:0 0 16px;color:#2D1F0F;font-size:15px;font-weight:800;">As a SwasthGuru Doctor, you can now:</p>
                ${[
                  ['📹', 'Conduct secure <strong>video consultations</strong> from anywhere'],
                  ['📅', 'Manage your <strong>appointment schedule</strong> effortlessly'],
                  ['🗂️', 'Access and maintain <strong>digital patient records</strong>'],
                  ['🌾', 'Reach patients in <strong>underserved areas</strong> who lack access to quality care'],
                  ['📈', 'Build and grow your <strong>digital medical practice</strong>'],
                ].map(([icon, text]) => `
                <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
                  <span style="font-size:18px;margin-right:12px;line-height:1.5;">${icon}</span>
                  <span style="color:#4A3728;font-size:14px;line-height:1.6;">${text}</span>
                </div>`).join('')}
              </div>

              <!-- Highlight Quote -->
              <div style="border-left:4px solid #1A8A7A;padding:16px 24px;background:#f0faf8;border-radius:0 12px 12px 0;margin:0 0 28px;">
                <p style="margin:0;color:#1A8A7A;font-size:15px;font-style:italic;line-height:1.6;">
                  "Your expertise has the power to transform lives — especially for those who have waited too long for quality care."
                </p>
              </div>

              <p style="margin:0 0 32px;color:#6B5B4E;font-size:15px;line-height:1.7;">
                Together, we are making healthcare accessible for <strong>every Indian</strong> — urban or rural. Thank you for being a part of this mission.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:0 0 32px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/doctor/dashboard"
                   style="display:inline-block;background:linear-gradient(135deg,#1A8A7A 0%,#0f6b5e 100%);color:white;text-decoration:none;font-size:16px;font-weight:800;padding:16px 40px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 8px 24px rgba(26,138,122,0.35);">
                  Go to Doctor Dashboard →
                </a>
              </div>

              <div style="border-top:1px solid #EDE8E0;padding-top:24px;text-align:center;">
                <p style="margin:0;color:#A89080;font-size:13px;line-height:1.6;">
                  Thank you for your dedication. 🙏<br/>
                  Need support? Reply to this email — our team is here for you.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F7F3ED;border-radius:0 0 20px 20px;padding:24px 48px;text-align:center;border:1px solid #EDE8E0;border-top:none;">
              <p style="margin:0 0 6px;color:#1A8A7A;font-size:14px;font-weight:800;">Team SwasthGuru</p>
              <p style="margin:0;color:#A89080;font-size:12px;">
                Telemedicine for Rural India &bull; Empowering Every Doctor, Reaching Every Patient
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Send Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function sendPatientWelcomeEmail(email: string, name: string): Promise<void> {
  if (!transporter) {
    console.warn('[Email] SMTP (Gmail) credentials not set — skipping welcome email');
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: `"SwasthGuru" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: '🌿 Welcome to SwasthGuru — आपका स्वास्थ्य, हमारी प्राथमिकता',
      html: patientEmailHTML(name),
    });
    console.log('[Email] Patient welcome email sent:', info.messageId, '→', email);
  } catch (err) {
    console.error('[Email] Unexpected error sending patient email:', err);
  }
}

export async function sendDoctorWelcomeEmail(email: string, name: string): Promise<void> {
  if (!transporter) {
    console.warn('[Email] SMTP (Gmail) credentials not set — skipping welcome email');
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: `"SwasthGuru" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: '🩺 Welcome to SwasthGuru — आपकी सेवा, हमारा सम्मान',
      html: doctorEmailHTML(name),
    });
    console.log('[Email] Doctor welcome email sent:', info.messageId, '→', email);
  } catch (err) {
    console.error('[Email] Unexpected error sending doctor email:', err);
  }
}
