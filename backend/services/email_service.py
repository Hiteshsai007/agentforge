"""
Email service abstraction - supports multiple providers (SendGrid, SMTP, logging).
"""

import os
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class EmailProvider(ABC):
    """Abstract email provider interface."""

    @abstractmethod
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        plain_text: str = "",
    ) -> bool:
        """Send email. Returns True if successful."""
        pass


class LoggingEmailProvider(EmailProvider):
    """Development provider - logs emails to console."""

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        plain_text: str = "",
    ) -> bool:
        print(f"\n{'=' * 70}")
        print(f"📧 EMAIL (DEV MODE)")
        print(f"{'=' * 70}")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"{'=' * 70}")
        print(html_body if html_body else plain_text)
        print(f"{'=' * 70}\n")
        return True


class SendGridEmailProvider(EmailProvider):
    """SendGrid email provider."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Email, To, Content

            self.Mail = Mail
            self.Email = Email
            self.To = To
            self.Content = Content
            self.sendgrid_client = sendgrid.SendGridAPIClient(api_key)
        except ImportError:
            raise ImportError("sendgrid package not installed")

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        plain_text: str = "",
    ) -> bool:
        try:
            sender_email = os.getenv("SENDER_EMAIL", "noreply@agentforge.example.com")
            mail = self.Mail(
                from_email=sender_email,
                to_emails=self.To(to_email),
                subject=subject,
            )
            if html_body:
                mail.add_content(self.Content("text/html", html_body))
            elif plain_text:
                mail.add_content(self.Content("text/plain", plain_text))

            response = self.sendgrid_client.send(mail)
            return 200 <= response.status_code < 300
        except Exception as e:
            print(f"⚠️  SendGrid email failed: {e}")
            return False


class SMTPEmailProvider(EmailProvider):
    """SMTP email provider."""

    def __init__(self, smtp_host: str, smtp_port: int, username: str, password: str):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.username = username
        self.password = password

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        plain_text: str = "",
    ) -> bool:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            sender_email = os.getenv("SENDER_EMAIL", "noreply@agentforge.example.com")
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = sender_email
            msg["To"] = to_email

            if plain_text:
                msg.attach(MIMEText(plain_text, "plain"))
            if html_body:
                msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"⚠️  SMTP email failed: {e}")
            return False


class EmailService:
    """Email service factory and manager."""

    _provider: Optional[EmailProvider] = None

    @classmethod
    def configure(cls) -> None:
        """Initialize email provider based on environment."""
        provider_name = os.getenv("EMAIL_PROVIDER", "logging").lower()

        if provider_name == "sendgrid":
            api_key = os.getenv("SENDGRID_API_KEY")
            if not api_key:
                print("⚠️  SENDGRID_API_KEY not set, falling back to logging")
                cls._provider = LoggingEmailProvider()
            else:
                cls._provider = SendGridEmailProvider(api_key)
        elif provider_name == "smtp":
            smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            smtp_user = os.getenv("SMTP_USER", "")
            smtp_pass = os.getenv("SMTP_PASSWORD", "")
            if smtp_user and smtp_pass:
                cls._provider = SMTPEmailProvider(
                    smtp_host, smtp_port, smtp_user, smtp_pass
                )
            else:
                cls._provider = LoggingEmailProvider()
        else:
            cls._provider = LoggingEmailProvider()

    @classmethod
    async def send_credential_email(
        cls,
        to_email: str,
        api_key: str,
        secret_key: str,
        expiry_date: str,
        agent_name: str,
    ) -> bool:
        """Send credential email to company admin."""
        if cls._provider is None:
            cls.configure()

        subject = f"Your API Key for {agent_name}"
        html_body = f"""
        <h2>Agent API Credentials</h2>
        <p>Your API key for <strong>{agent_name}</strong> has been generated.</p>
        <hr />
        <h3>Credentials</h3>
        <p><strong>API Key:</strong><br /><code>{api_key}</code></p>
        <p><strong>Secret Key:</strong><br /><code>{secret_key}</code></p>
        <hr />
        <p><strong>Expiry Date:</strong> {expiry_date}</p>
        <p><strong>⚠️ Important:</strong></p>
        <ul>
            <li>Store these credentials securely. They will not be shown again.</li>
            <li>Use the header <code>X-API-Key: {api_key}</code> when calling the API.</li>
            <li>Keep your secret key confidential.</li>
            <li>Rotate your credentials before the expiry date.</li>
        </ul>
        <p>Questions? Contact support@agentforge.example.com</p>
        """

        plain_text = f"""
Your API Credentials for {agent_name}

API Key: {api_key}
Secret Key: {secret_key}
Expiry Date: {expiry_date}

IMPORTANT: Store these credentials securely. They will not be shown again.
Use the header X-API-Key: {api_key} when calling the API.

Questions? Contact support@agentforge.example.com
        """

        return await cls._provider.send_email(to_email, subject, html_body, plain_text)

    @classmethod
    async def send_rotation_warning_email(
        cls,
        to_email: str,
        agent_name: str,
        days_until_expiry: int,
    ) -> bool:
        """Send credential rotation warning email."""
        if cls._provider is None:
            cls.configure()

        subject = f"⚠️ API Key Expiring Soon: {agent_name}"
        html_body = f"""
        <h2>API Key Expiration Warning</h2>
        <p>Your API key for <strong>{agent_name}</strong> will expire in <strong>{days_until_expiry} days</strong>.</p>
        <p>To avoid service interruption, please rotate your credentials now.</p>
        <p><strong>How to rotate:</strong></p>
        <ol>
            <li>Go to your Agent Dashboard</li>
            <li>Select the agent <strong>{agent_name}</strong></li>
            <li>Click "Rotate Credentials"</li>
            <li>New credentials will be sent to this email</li>
        </ol>
        <p>Questions? Contact support@agentforge.example.com</p>
        """

        plain_text = f"""
API Key Expiration Warning

Your API key for {agent_name} will expire in {days_until_expiry} days.

Please rotate your credentials to avoid service interruption.

Contact support@agentforge.example.com with questions.
        """

        return await cls._provider.send_email(to_email, subject, html_body, plain_text)

    @classmethod
    async def send_rotated_credentials_email(
        cls,
        to_email: str,
        agent_name: str,
        new_api_key: str,
        new_secret_key: str,
        new_expiry_date: str,
    ) -> bool:
        """Send rotated credentials email."""
        if cls._provider is None:
            cls.configure()

        subject = f"✅ New API Credentials: {agent_name}"
        html_body = f"""
        <h2>Credentials Rotated Successfully</h2>
        <p>Your API credentials for <strong>{agent_name}</strong> have been rotated.</p>
        <hr />
        <h3>New Credentials</h3>
        <p><strong>API Key:</strong><br /><code>{new_api_key}</code></p>
        <p><strong>Secret Key:</strong><br /><code>{new_secret_key}</code></p>
        <hr />
        <p><strong>New Expiry Date:</strong> {new_expiry_date}</p>
        <p><strong>Important:</strong></p>
        <ul>
            <li>Update your applications to use the new API key immediately.</li>
            <li>Old credentials have been revoked and will no longer work.</li>
            <li>Store the new secret key securely.</li>
        </ul>
        <p>Questions? Contact support@agentforge.example.com</p>
        """

        plain_text = f"""
Credentials Rotated Successfully

New API Credentials for {agent_name}

API Key: {new_api_key}
Secret Key: {new_secret_key}
New Expiry Date: {new_expiry_date}

IMPORTANT: Update your applications to use the new API key immediately.
Old credentials have been revoked.

Contact support@agentforge.example.com with questions.
        """

        return await cls._provider.send_email(to_email, subject, html_body, plain_text)

    @classmethod
    async def send_company_api_key_email(
        cls,
        to_email: str,
        api_key: str,
        secret_key: str,
        company_name: str,
        expiry_date: str,
    ) -> bool:
        """Send company API key email."""
        if cls._provider is None:
            cls.configure()

        subject = f"Your Company API Key - {company_name}"
        html_body = f"""
        <h2>Company API Key Generated</h2>
        <p>Your company API key for <strong>{company_name}</strong> has been generated.</p>
        <hr />
        <h3>API Credentials</h3>
        <p><strong>API Key:</strong><br /><code>{api_key}</code></p>
        <p><strong>Secret Key:</strong><br /><code>{secret_key}</code></p>
        <hr />
        <p><strong>Expiry Date:</strong> {expiry_date}</p>
        <p><strong>⚠️ Important:</strong></p>
        <ul>
            <li>Store these credentials securely. They will not be shown again.</li>
            <li>Use the header <code>X-Company-API-Key: {api_key}</code> when calling the API.</li>
            <li>Optionally include <code>X-Agent-ID: agent_uuid</code> to specify which agent to use.</li>
            <li>Keep your secret key confidential.</li>
        </ul>
        <p>Questions? Contact support@agentforge.example.com</p>
        """

        plain_text = f"""
Your Company API Key for {company_name}

API Key: {api_key}
Secret Key: {secret_key}
Expiry Date: {expiry_date}

IMPORTANT: Store these credentials securely. They will not be shown again.
Use the header X-Company-API-Key: {api_key} when calling the API.
Optionally include X-Agent-ID: agent_uuid to specify which agent to use.

Questions? Contact support@agentforge.example.com
        """

        return await cls._provider.send_email(to_email, subject, html_body, plain_text)

    @classmethod
    async def send_verification_email(
        cls,
        to_email: str,
        code: str,
        expiry_minutes: int = 5,
    ) -> bool:
        """Send verification code email for revealing API key."""
        if cls._provider is None:
            cls.configure()

        subject = "Your Verification Code - Agent Forge"
        html_body = f"""
        <h2>Verify Your Identity</h2>
        <p>Your verification code is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 20px 0;">
            {code}
        </div>
        <p><strong>This code expires in {expiry_minutes} minutes.</strong></p>
        <p>If you didn't request this code, please ignore this email.</p>
        """

        plain_text = f"""
Verify Your Identity

Your verification code is: {code}

This code expires in {expiry_minutes} minutes.

If you didn't request this code, please ignore this email.
        """

        return await cls._provider.send_email(to_email, subject, html_body, plain_text)
