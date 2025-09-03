import { Resend } from 'resend';
import twilio from 'twilio';

// Initialize Resend client only if API key is available
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.log('Resend API key not found. Email OTP will use development mode.');
}

// Initialize Twilio client (will only work if credentials are provided)
let twilioClient: any = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.log('Twilio Account SID:', process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio client initialized successfully');
  } else {
    console.log('Twilio credentials not provided - SMS will use development mode');
  }
} catch (error) {
  console.warn('Twilio initialization failed:', error);
  twilioClient = null;
}

export async function sendOTPEmail(email: string, otp: string, firstName?: string): Promise<boolean> {
  try {
    if (!resend) {
      console.log(`Development Mode - OTP for ${email}: ${otp}`);
      return true; // Fallback to development mode
    }

    // Check if this is a restricted email (Resend test mode limitation)
    const allowedTestEmails = [
      'aulnova.techsoft@gmail.com',
      'nirajsachan1982@gmail.com',
      'niraj.sachan@hotmail.com'
    ];
    const isTestMode = !allowedTestEmails.includes(email);

    if (isTestMode) {
      console.log(`Resend Test Mode - Can only send to approved test emails. OTP for ${email}: ${otp}`);
      return true; // Return true but log for development
    }

    const { data, error } = await resend.emails.send({
      from: 'Influencer Hub <noreply@resend.dev>', // Using Resend's test domain
      to: [email],
      subject: 'Your Verification Code - Influencer Hub',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Account</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f9fc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                  Influencer Hub
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">
                  Verify Your Account
                </p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">
                  Hi${firstName ? ` ${firstName}` : ''}!
                </h2>
                
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                  Welcome to Influencer Hub! To complete your registration, please verify your email address using the code below:
                </p>
                
                <!-- OTP Code -->
                <div style="background-color: #f3f4f6; border: 2px dashed #14b8a6; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
                  <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                    Your Verification Code
                  </p>
                  <div style="font-size: 36px; font-weight: bold; color: #14b8a6; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${otp}
                  </div>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 20px 0;">
                  <strong>Important:</strong> This code will expire in 10 minutes for security reasons. If you didn't request this verification, please ignore this email.
                </p>
                
                <div style="border-top: 1px solid #e5e7eb; margin: 30px 0; padding-top: 20px;">
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.4; margin: 0;">
                    This email was sent from Influencer Hub. If you have any questions, please contact our support team.
                  </p>
                </div>
              </div>
              
            </div>
          </body>
        </html>
      `,
      text: `Hi${firstName ? ` ${firstName}` : ''}!\n\nWelcome to Influencer Hub! Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this verification, please ignore this email.\n\n- Influencer Hub Team`
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log('OTP email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

export async function sendOTPSMS(phone: string, otp: string, firstName?: string): Promise<boolean> {
  try {
    if (!twilioClient) {
      console.log(`Development Mode - SMS OTP for ${phone}: ${otp}`);
      return true; // Fallback to development mode
    }

    // Check if we have Messaging Service SID or Phone Number
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!messagingServiceSid && !phoneNumber) {
      console.log(`Development Mode - No Twilio sender configured - SMS OTP for ${phone}: ${otp}`);
      return true;
    }

    const messageBody = `Hi${firstName ? ` ${firstName}` : ''}! Your Influencer Hub verification code is: ${otp}. Valid for 10 minutes. If you didn't request this, please ignore.`;

    // Prepare message options
    const messageOptions: any = {
      body: messageBody,
      to: phone
    };

    // Use Messaging Service SID if available (recommended), otherwise use phone number
    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid;
      console.log('Sending SMS via Messaging Service:', messagingServiceSid?.substring(0, 10) + '...');
    } else {
      messageOptions.from = phoneNumber;
      console.log('Sending SMS via phone number...');
    }

    console.log('SMS message options:', { ...messageOptions, body: '[REDACTED]' });
    const message = await twilioClient.messages.create(messageOptions);

    console.log('OTP SMS sent successfully:', message.sid);
    return true;
  } catch (error) {
    console.error('Failed to send OTP SMS:', error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidPhone(phone: string): boolean {
  // Basic phone validation - should start with + and contain 10-15 digits
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  return phoneRegex.test(phone);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function sendExternalInvitationEmail(
  email: string, 
  campaignTitle: string,
  campaignDescription: string,
  personalMessage: string,
  incentiveOffer: string,
  campaignId: string
): Promise<boolean> {
  try {
    if (!resend) {
      console.log(`Development Mode - External invitation for ${email} to campaign: ${campaignTitle}`);
      return true; // Fallback to development mode
    }

    // Check if this is a restricted email (Resend test mode limitation)
    const allowedTestEmails = [
      'aulnova.techsoft@gmail.com',
      'nirajsachan1982@gmail.com',
      'niraj.sachan@hotmail.com'
    ];
    const isTestMode = !allowedTestEmails.includes(email);

    if (isTestMode) {
      console.log(`Resend Test Mode - Can only send to approved test emails. External invitation for ${email} to campaign: ${campaignTitle}`);
      return true; // Return true but log for development
    }

    const { data, error } = await resend.emails.send({
      from: 'Influencer Hub <noreply@resend.dev>', // Using Resend's test domain
      to: [email],
      subject: `Collaboration Opportunity: ${campaignTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Collaboration Invitation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f9fc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                  Influencer Hub
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">
                  Collaboration Invitation
                </p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">
                  You're Invited to Collaborate!
                </h2>
                
                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                  You've been invited to participate in an exciting collaboration opportunity on Influencer Hub.
                </p>
                
                <!-- Campaign Details -->
                <div style="background-color: #f9fafb; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 20px;">
                    ${campaignTitle}
                  </h3>
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                    ${campaignDescription}
                  </p>
                </div>
                
                ${personalMessage ? `
                <!-- Personal Message -->
                <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h4 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">
                    Personal Message
                  </h4>
                  <p style="color: #92400e; font-size: 14px; line-height: 1.5; margin: 0; font-style: italic;">
                    "${personalMessage}"
                  </p>
                </div>
                ` : ''}
                
                ${incentiveOffer ? `
                <!-- Incentive Offer -->
                <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h4 style="color: #065f46; margin: 0 0 10px; font-size: 16px;">
                    💰 Special Offer
                  </h4>
                  <p style="color: #065f46; font-size: 14px; line-height: 1.5; margin: 0; font-weight: 500;">
                    ${incentiveOffer}
                  </p>
                </div>
                ` : ''}
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.APP_URL || 'https://influencer-hub.app'}/register?ref=campaign&id=${campaignId}" 
                     style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.2);">
                    Join Influencer Hub & Apply
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 20px 0;">
                  Don't have an account yet? No problem! Click the button above to create your free Influencer Hub account and learn more about this collaboration opportunity.
                </p>
                
                <div style="border-top: 1px solid #e5e7eb; margin: 30px 0; padding-top: 20px;">
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.4; margin: 0;">
                    This invitation was sent through Influencer Hub. If you're not interested in collaboration opportunities, you can ignore this email.
                  </p>
                </div>
              </div>
              
            </div>
          </body>
        </html>
      `,
      text: `You're Invited to Collaborate!\n\nYou've been invited to participate in: ${campaignTitle}\n\n${campaignDescription}\n\n${personalMessage ? `Personal Message: "${personalMessage}"\n\n` : ''}${incentiveOffer ? `Special Offer: ${incentiveOffer}\n\n` : ''}Join Influencer Hub to learn more: ${process.env.APP_URL || 'https://influencer-hub.app'}/register?ref=campaign&id=${campaignId}\n\n- Influencer Hub Team`
    });

    if (error) {
      console.error('Resend external invitation email error:', error);
      return false;
    }

    console.log('External invitation email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send external invitation email:', error);
    return false;
  }
}

export async function sendExternalInvitationSMS(
  phone: string,
  campaignTitle: string,
  incentiveOffer?: string
): Promise<boolean> {
  try {
    if (!twilioClient) {
      console.log(`Development Mode - External invitation SMS for ${phone} to campaign: ${campaignTitle}`);
      return true; // Fallback to development mode
    }

    // Check if we have Messaging Service SID or Phone Number
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!messagingServiceSid && !phoneNumber) {
      console.log(`Development Mode - No Twilio sender configured - External invitation SMS for ${phone}: ${campaignTitle}`);
      return true;
    }

    const messageBody = `🎯 Collaboration Opportunity: You're invited to join "${campaignTitle}" on Influencer Hub!${incentiveOffer ? ` 💰 ${incentiveOffer}` : ''} Join now: ${process.env.APP_URL || 'https://influencer-hub.app'}/register`;

    // Prepare message options
    const messageOptions: any = {
      body: messageBody,
      to: phone
    };

    // Use Messaging Service SID if available (recommended), otherwise use phone number
    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid;
    } else {
      messageOptions.from = phoneNumber;
    }

    const message = await twilioClient.messages.create(messageOptions);

    console.log('External invitation SMS sent successfully:', message.sid);
    return true;
  } catch (error) {
    console.error('Failed to send external invitation SMS:', error);
    return false;
  }
}