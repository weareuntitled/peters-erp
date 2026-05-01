import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

class EmailService:
    def __init__(self):
        self.host = os.getenv('SMTP_HOST', '')
        self.port = int(os.getenv('SMTP_PORT', '587'))
        self.user = os.getenv('SMTP_USER', '')
        self.password = os.getenv('SMTP_PASSWORD', '')
        self.from_address = os.getenv('SMTP_FROM', self.user)
        
    def is_configured(self) -> bool:
        return bool(self.host and self.user and self.password)

    def send_email_with_attachment(self, to_address: str, subject: str, message: str, attachment_bytes: bytes, filename: str) -> bool:
        """Sends an email with a file attachment via SMTP."""
        if not self.is_configured():
            raise ValueError("SMTP is not fully configured.")

        msg = MIMEMultipart()
        msg['From'] = self.from_address
        msg['To'] = to_address
        msg['Subject'] = subject

        msg.attach(MIMEText(message, 'plain', 'utf-8'))

        part = MIMEBase('application', 'octet-stream')
        part.set_payload(attachment_bytes)
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename="{filename}"'
        )
        msg.attach(part)

        try:
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            raise

email_service = EmailService()
