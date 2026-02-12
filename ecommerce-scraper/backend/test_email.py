"""
Quick Email Test
"""
import smtplib
from email.mime.text import MIMEText

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "kpraneethreddy111@gmail.com"
SMTP_PASSWORD = "batceyssnrkntafa"
TO_EMAIL = "kummethap74@gmail.com"

try:
    print("🚀 Testing email...")
    
    msg = MIMEText("This is a test email from OfferZone!")
    msg["Subject"] = "OfferZone Test Email"
    msg["From"] = SMTP_USER
    msg["To"] = TO_EMAIL
    
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        print("✅ TLS connected")
        
        server.login(SMTP_USER, SMTP_PASSWORD)
        print("✅ Login successful")
        
        server.sendmail(SMTP_USER, TO_EMAIL, msg.as_string())
        print(f"✅ Email sent to {TO_EMAIL}!")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")