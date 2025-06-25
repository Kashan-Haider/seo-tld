import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv('SMTP_HOST')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
SMTP_FROM = os.getenv('SMTP_FROM')

class EmailService:
    @staticmethod
    def send_verification_email(to_email: str, verification_link: str):
        if not all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM]):
            raise RuntimeError("SMTP configuration is missing or incomplete.")
        subject = 'Verify your email address'
        body = f"""
        <p>Thank you for signing up!</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href='{verification_link}'>Verify Email</a>
        <p>This link will expire in 3 hours.</p>
        """
        msg = MIMEMultipart()
        msg['From'] = str(SMTP_FROM)
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        try:
            with smtplib.SMTP(str(SMTP_HOST), int(SMTP_PORT)) as server:
                server.starttls()
                server.login(str(SMTP_USER), str(SMTP_PASSWORD))
                server.sendmail(str(SMTP_FROM), to_email, msg.as_string())
        except Exception as e:
            print(f"Failed to send verification email: {e}")
            raise 