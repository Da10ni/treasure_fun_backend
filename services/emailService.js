import nodemailer from "nodemailer";

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === "development") {
    // For development - using Gmail
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password, not regular password
      },
    });
  } else {
    // For production - you can use services like SendGrid, Mailgun, etc.
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
};

// Send referral code email
export const sendReferralCodeEmail = async (email, code) => {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("📧 Email not configured. Simulating email send...");
      console.log(`=== SIMULATED EMAIL ===`);
      console.log(`To: ${email}`);
      console.log(`Subject: Your Treasure Fun Referral Code`);
      console.log(`Referral Code: ${code}`);
      console.log(`This code will expire in 10 minutes.`);
      console.log(`=======================`);
      return { success: true, simulated: true, code };
    }

    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: `"Treasure Fun" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Your Treasure Fun Referral Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: #fff; border: 2px solid #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏴‍☠️ Treasure Fun</h1>
              <p>Your Referral Code is Here!</p>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>You've requested a referral code to complete your registration on Treasure Fun. Here's your verification code:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This code will expire in <strong>10 minutes</strong></li>
                  <li>Use this code to complete your signup process</li>
                  <li>If you didn't request this code, please ignore this email</li>
                </ul>
              </div>
              
              <p>Ready to start your treasure hunting adventure? Enter this code on the signup page to complete your registration!</p>
              
              <div class="footer">
                <p>Best regards,<br>The Treasure Fun Team</p>
                <hr>
                <p><small>This is an automated email. Please do not reply to this message.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Treasure Fun - Your Referral Code
        
        Hello!
        
        You've requested a referral code to complete your registration on Treasure Fun.
        
        Your verification code is: ${code}
        
        Important:
        - This code will expire in 10 minutes
        - Use this code to complete your signup process
        - If you didn't request this code, please ignore this email
        
        Ready to start your treasure hunting adventure? Enter this code on the signup page to complete your registration!
        
        Best regards,
        The Treasure Fun Team
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      simulated: false,
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error);

    // Fallback to console logging if email fails
    console.log("📧 Falling back to console logging...");
    console.log(`=== EMAIL FALLBACK ===`);
    console.log(`To: ${email}`);
    console.log(`Subject: Your Treasure Fun Referral Code`);
    console.log(`Referral Code: ${code}`);
    console.log(`This code will expire in 10 minutes.`);
    console.log(`======================`);

    return {
      success: true,
      simulated: true,
      code,
      error: error.message,
    };
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { configured: false, message: "Email credentials not configured" };
    }

    const transporter = createTransporter();
    await transporter.verify();

    return { configured: true, message: "Email configuration is valid" };
  } catch (error) {
    return { configured: false, message: error.message };
  }
};
