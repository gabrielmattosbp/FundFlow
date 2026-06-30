import smtplib
from email.mime.text import MIMEText

from app.config import settings


def send_reset_email(to_email: str, token: str) -> bool:
    """Send a password reset email via SMTP. Returns True if sent."""
    if not settings.smtp_host:
        return False

    reset_link = f"{settings.app_url}/reset-password?token={token}&email={to_email}"

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 2rem; max-width: 480px;">
  <h2 style="color: #7c3aed;">FundFlow</h2>
  <p>You requested a password reset.</p>
  <p>Click the button below to set a new password. This link expires in 1 hour.</p>
  <a href="{reset_link}"
     style="display: inline-block; background: #7c3aed; color: #fff;
            padding: 12px 24px; border-radius: 8px; text-decoration: none;
            font-weight: 600; margin: 16px 0;">
    Reset Password
  </a>
  <p style="color: #666; font-size: 14px;">
    If you didn't request this, ignore this email.<br>
    Token: <code>{token}</code>
  </p>
</body>
</html>"""

    msg = MIMEText(html, "html")
    msg["Subject"] = "FundFlow — Password Reset"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_tls:
                server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, [to_email], msg.as_string())
        return True
    except Exception:
        return False
