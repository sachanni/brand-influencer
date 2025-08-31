# OTP Integration Guide - Email & SMS Services

## Current Status
**Development Mode**: OTP codes are displayed in the UI for testing (no actual emails/SMS sent)
**Production**: Requires integration with email/SMS service providers

## Free Tier Options

### Email Services
1. **SendGrid** (Free: 100 emails/day)
   - Easy integration
   - Good deliverability
   - REST API

2. **Mailgun** (Free: 100 emails/day for 3 months)
   - Simple API
   - Good documentation
   - EU/US regions

3. **Resend** (Free: 3,000 emails/month)
   - Modern API
   - Great developer experience
   - Built for transactional emails

4. **Gmail SMTP** (Free with Gmail account)
   - Limited to 500 emails/day
   - May be marked as spam
   - Not recommended for production

### SMS Services
1. **Twilio** (Free trial: $15 credit)
   - Most popular choice
   - Global coverage
   - ~$0.0075 per SMS after trial

2. **AWS SNS** (Free: 100 SMS/month)
   - Part of AWS Free Tier
   - Good for existing AWS users
   - Pay-per-use after free tier

3. **Firebase Auth** (Free for phone auth)
   - Integrates with Google services
   - Handles OTP generation/verification
   - Limited customization

## Recommended Production Setup

### For Email OTP (Recommended: Resend)
```javascript
// Install: npm install resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOTPEmail(email, otp) {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Account</h2>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `
  });
}
```

### For SMS OTP (Recommended: Twilio with Messaging Service)
```javascript
// Install: npm install twilio
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendOTPSMS(phone, otp) {
  // Option 1: Using Messaging Service SID (Recommended for production)
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    await client.messages.create({
      body: `Your verification code is: ${otp}. Valid for 10 minutes.`,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: phone
    });
  } 
  // Option 2: Using Phone Number (Simple setup)
  else {
    await client.messages.create({
      body: `Your verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
  }
}
```

## Cost Comparison (Monthly)

### Email Services
- **Resend**: Free (3K), $20 (50K), $85 (100K)
- **SendGrid**: Free (100/day), $19.95 (40K), $89.95 (100K)
- **Mailgun**: $35 (50K), $80 (100K)

### SMS Services
- **Twilio**: ~$7.50 per 1,000 SMS
- **AWS SNS**: ~$6.10 per 1,000 SMS
- **Firebase**: Free for moderate usage

## Implementation Priority

### Phase 1: Email OTP Only
- Use Resend (free tier: 3,000 emails/month)
- Covers most users
- Easy to implement

### Phase 2: Add SMS Support
- Add Twilio for SMS
- Fallback option for users
- Higher engagement rates

### Phase 3: Advanced Features
- Email templates
- Multi-language support
- Rate limiting
- Analytics

## Environment Variables Needed

```env
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxx

# SMS (Twilio) - Choose one of the following sender methods:

# Option 1: Messaging Service (Recommended for production)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxx

# Option 2: Phone Number (Simple setup)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Security
OTP_SECRET_KEY=your-secret-key-for-encryption
```

## Twilio Setup Options

### Messaging Service (Recommended)
1. Go to Twilio Console > Messaging > Services
2. Create new Messaging Service
3. Add phone numbers to the service
4. Use the Messaging Service SID (starts with MG...)
5. Benefits: Better delivery, load balancing, advanced features

### Phone Number (Simple)
1. Purchase a phone number in Twilio Console
2. Use the phone number directly
3. Simpler setup but limited features

## Security Best Practices

1. **Rate Limiting**: Max 3 OTP requests per 15 minutes
2. **Expiration**: 10-minute OTP validity
3. **One-time Use**: Mark OTP as used after verification
4. **IP Tracking**: Monitor for abuse patterns
5. **Secure Storage**: Hash OTP codes in database

## Current Development Mode

The system currently shows OTP codes directly in the UI for testing:
- OTP appears in green success message
- Auto-fills the input field
- Allows immediate testing without external services

To switch to production mode:
1. Set NODE_ENV=production
2. Remove developmentOtp from API responses
3. Implement actual email/SMS sending