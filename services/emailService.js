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
// export const sendReferralCodeEmail = async (email, code) => {
//   try {
//     // Check if email configuration is available
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       console.log("📧 Email not configured. Simulating email send...");
//       console.log(`=== SIMULATED EMAIL ===`);
//       console.log(`To: ${email}`);
//       console.log(`Subject: Your Treasure Fun Referral Code`);
//       console.log(`Referral Code: ${code}`);
//       console.log(`This code will expire in 10 minutes.`);
//       console.log(`=======================`);
//       return { success: true, simulated: true, code };
//     }

//     const transporter = createTransporter();

//     // Email content
//     const mailOptions = {
//       from: `"Treasure Fun" <${
//         process.env.EMAIL_FROM || process.env.EMAIL_USER
//       }>`,
//       to: email,
//       subject: "Your Treasure Fun Referral Code",
//       html: `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <style>
//             body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//             .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//             .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
//             .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
//             .code-box { background: #fff; border: 2px solid #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
//             .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
//             .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
//             .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <div class="header">
//               <h1>🏴‍☠️ Treasure Fun</h1>
//               <p>Your Referral Code is Here!</p>
//             </div>
//             <div class="content">
//               <p>Hello!</p>
//               <p>You've requested a referral code to complete your registration on Treasure Fun. Here's your verification code:</p>

//               <div class="code-box">
//                 <div class="code">${code}</div>
//               </div>

//               <div class="warning">
//                 <strong>⚠️ Important:</strong>
//                 <ul>
//                   <li>This code will expire in <strong>10 minutes</strong></li>
//                   <li>Use this code to complete your signup process</li>
//                   <li>If you didn't request this code, please ignore this email</li>
//                 </ul>
//               </div>

//               <p>Ready to start your treasure hunting adventure? Enter this code on the signup page to complete your registration!</p>

//               <div class="footer">
//                 <p>Best regards,<br>The Treasure Fun Team</p>
//                 <hr>
//                 <p><small>This is an automated email. Please do not reply to this message.</small></p>
//               </div>
//             </div>
//           </div>
//         </body>
//         </html>
//       `,
//       text: `
//         Treasure Fun - Your Referral Code

//         Hello!

//         You've requested a referral code to complete your registration on Treasure Fun.

//         Your verification code is: ${code}

//         Important:
//         - This code will expire in 10 minutes
//         - Use this code to complete your signup process
//         - If you didn't request this code, please ignore this email

//         Ready to start your treasure hunting adventure? Enter this code on the signup page to complete your registration!

//         Best regards,
//         The Treasure Fun Team
//       `,
//     };

//     // Send email
//     const info = await transporter.sendMail(mailOptions);

//     console.log("✅ Email sent successfully!");
//     console.log("Message ID:", info.messageId);

//     return {
//       success: true,
//       messageId: info.messageId,
//       simulated: false,
//     };
//   } catch (error) {
//     console.error("❌ Email sending failed:", error);

//     // Fallback to console logging if email fails
//     console.log("📧 Falling back to console logging...");
//     console.log(`=== EMAIL FALLBACK ===`);
//     console.log(`To: ${email}`);
//     console.log(`Subject: Your Treasure Fun Referral Code`);
//     console.log(`Referral Code: ${code}`);
//     console.log(`This code will expire in 10 minutes.`);
//     console.log(`======================`);

//     return {
//       success: true,
//       simulated: true,
//       code,
//       error: error.message,
//     };
//   }
// };

// Updated sendReferralCodeEmail function to support both verification and password reset

export const sendReferralCodeEmail = async (
  email,
  code,
  type = "verification"
) => {
  try {
    // Email templates based on type
    const templates = {
      verification: {
        subject: "Your Treasure Fun Verification Code",
        title: "🏴‍☠️ Treasure Fun",
        subtitle: "Your Verification Code is Here!",
        greeting:
          "You've requested a verification code to complete your registration on Treasure Fun.",
        instructions:
          "Enter this code on the signup page to complete your registration!",
        callToAction: "Ready to start your treasure hunting adventure?",
      },
      password_reset: {
        subject: "Your Treasure Fun Password Reset Code",
        title: "🔐 Treasure Fun",
        subtitle: "Password Reset Request",
        greeting:
          "We received a request to reset your password for your Treasure Fun account.",
        instructions:
          "Enter this code on the password reset page to create a new password!",
        callToAction: "Ready to secure your treasure hunting account?",
      },
    };

    const template = templates[type] || templates.verification;

    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`📧 Email not configured. Simulating ${type} email send...`);
      console.log(`=== SIMULATED ${type.toUpperCase()} EMAIL ===`);
      console.log(`To: ${email}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`Code: ${code}`);
      console.log(`Type: ${type}`);
      console.log(`This code will expire in 10 minutes.`);
      console.log(`=======================`);
      return {
        success: true,
        simulated: true,
        code,
        type,
        message: `${type} email simulated successfully`,
      };
    }

    const transporter = createTransporter();

    // Email content with dynamic template
    const mailOptions = {
      from: `"Treasure Fun" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: template.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
              background: ${
                type === "password_reset"
                  ? "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              }; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { 
              background: #fff; 
              border: 2px solid ${
                type === "password_reset" ? "#ff6b6b" : "#667eea"
              }; 
              padding: 20px; 
              text-align: center; 
              margin: 20px 0; 
              border-radius: 8px; 
            }
            .code { 
              font-size: 32px; 
              font-weight: bold; 
              color: ${type === "password_reset" ? "#ff6b6b" : "#667eea"}; 
              letter-spacing: 5px; 
              font-family: 'Courier New', monospace;
            }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .warning { 
              background: ${type === "password_reset" ? "#ffe6e6" : "#fff3cd"}; 
              border: 1px solid ${
                type === "password_reset" ? "#ffb3b3" : "#ffeaa7"
              }; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .security-note {
              background: #e8f5e8;
              border: 1px solid #4caf50;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${template.title}</h1>
              <p>${template.subtitle}</p>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>${template.greeting}</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">
                  Your ${
                    type === "password_reset" ? "Reset" : "Verification"
                  } Code
                </p>
                <div class="code">${code}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This code will expire in <strong>10 minutes</strong></li>
                  <li>${template.instructions}</li>
                  <li>If you didn't request this code, please ignore this email</li>
                  ${
                    type === "password_reset"
                      ? "<li><strong>For security:</strong> Never share this code with anyone</li>"
                      : ""
                  }
                </ul>
              </div>

              ${
                type === "password_reset"
                  ? `
                <div class="security-note">
                  <strong>🔒 Security Reminder:</strong>
                  <p style="margin: 5px 0 0;">
                    Our team will never ask for this code via phone, SMS, or email. 
                    If someone contacts you asking for this code, do not share it.
                  </p>
                </div>
              `
                  : ""
              }
              
              <p>${template.callToAction} ${template.instructions}</p>
              
              <div class="footer">
                <p>Best regards,<br>The Treasure Fun Team</p>
                <hr>
                <p><small>This is an automated email. Please do not reply to this message.</small></p>
                ${
                  type === "password_reset"
                    ? "<p><small>If you did not request a password reset, please contact our support team immediately.</small></p>"
                    : ""
                }
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Treasure Fun - Your ${
          type === "password_reset" ? "Password Reset" : "Verification"
        } Code
        
        Hello!
        
        ${template.greeting}
        
        Your ${
          type === "password_reset" ? "reset" : "verification"
        } code is: ${code}
        
        Important:
        - This code will expire in 10 minutes
        - ${template.instructions}
        - If you didn't request this code, please ignore this email
        ${
          type === "password_reset"
            ? "- For security: Never share this code with anyone"
            : ""
        }
        
        ${template.callToAction} ${template.instructions}
        
        Best regards,
        The Treasure Fun Team
        
        ${
          type === "password_reset"
            ? "Security Note: Our team will never ask for this code. If someone contacts you asking for this code, do not share it."
            : ""
        }
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ ${type} email sent successfully!`);
    console.log("Message ID:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      simulated: false,
      type,
      message: `${type} email sent successfully`,
    };
  } catch (error) {
    console.error(`❌ ${type} email sending failed:`, error);

    // Fallback to console logging if email fails
    console.log(`📧 Falling back to console logging for ${type}...`);
    console.log(`=== ${type.toUpperCase()} EMAIL FALLBACK ===`);
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log(`Type: ${type}`);
    console.log(`This code will expire in 10 minutes.`);
    console.log(`======================`);

    return {
      success: true,
      simulated: true,
      code,
      type,
      error: error.message,
      message: `${type} email fallback successful`,
    };
  }
};

// Helper function to send welcome email (bonus feature)
export const sendWelcomeEmail = async (email, username) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("📧 Welcome email simulation...");
      console.log(`Welcome ${username}! Email would be sent to: ${email}`);
      return { success: true, simulated: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Treasure Fun" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "🏴‍☠️ Welcome to Treasure Fun Adventure!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .welcome-box { background: #fff; border: 2px solid #4CAF50; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏴‍☠️ Welcome to Treasure Fun!</h1>
              <p>Your adventure begins now, ${username}!</p>
            </div>
            <div class="content">
              <div class="welcome-box">
                <h2>🎉 Registration Successful!</h2>
                <p>Thank you for joining our treasure hunting community!</p>
              </div>
              
              <p>Hello ${username},</p>
              <p>Welcome aboard! Your account has been successfully created and you're now part of the Treasure Fun family.</p>
              
              <h3>🗺️ What's Next?</h3>
              <ul>
                <li>Explore exciting treasure hunts</li>
                <li>Connect with fellow treasure hunters</li>
                <li>Unlock amazing rewards</li>
                <li>Share your adventures</li>
              </ul>
              
              <p>Ready to start your first treasure hunt? Log in to your account and let the adventure begin!</p>
              
              <div class="footer">
                <p>Happy Treasure Hunting!<br>The Treasure Fun Team</p>
                <hr>
                <p><small>This is an automated welcome email.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent successfully!");

    return {
      success: true,
      messageId: info.messageId,
      simulated: false,
    };
  } catch (error) {
    console.error("❌ Welcome email failed:", error);
    return {
      success: false,
      error: error.message,
      simulated: true,
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
