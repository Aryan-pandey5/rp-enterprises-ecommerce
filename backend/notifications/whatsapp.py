import os
import json
import logging
import urllib.request
import urllib.parse
import urllib.error

logger = logging.getLogger(__name__)


def get_whatsapp_config():
    """
    Reads WhatsApp configuration safely from environment variables.
    Provides standard defaults for API version and admin mobile number.
    """
    admin_number = os.environ.get('WHATSAPP_ADMIN_NUMBER', '919305616979').strip()
    access_token = os.environ.get('WHATSAPP_ACCESS_TOKEN', '').strip()
    phone_number_id = os.environ.get('WHATSAPP_PHONE_NUMBER_ID', '').strip()
    business_account_id = os.environ.get('WHATSAPP_BUSINESS_ACCOUNT_ID', '').strip()
    api_version = os.environ.get('WHATSAPP_API_VERSION', 'v18.0').strip()
    
    template_new_customer = os.environ.get('WHATSAPP_TEMPLATE_NEW_CUSTOMER', '').strip()
    template_language = os.environ.get('WHATSAPP_TEMPLATE_LANGUAGE', 'en_US').strip()

    if phone_number_id:
        api_url = f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
    else:
        api_url = ""

    return {
        "admin_number": admin_number,
        "access_token": access_token,
        "phone_number_id": phone_number_id,
        "business_account_id": business_account_id,
        "api_version": api_version,
        "api_url": api_url,
        "template_new_customer": template_new_customer,
        "template_language": template_language,
        "is_configured": bool(access_token and phone_number_id and admin_number and api_url)
    }


def get_whatsapp_status():
    """
    Returns a safe summary of WhatsApp API configuration status without exposing access tokens.
    Used by the admin test API endpoint.
    """
    cfg = get_whatsapp_config()
    masked_number = f"{cfg['admin_number'][:2]}******{cfg['admin_number'][-4:]}" if len(cfg['admin_number']) >= 10 else cfg['admin_number']
    
    return {
        "configured": cfg["is_configured"],
        "status": "Configured" if cfg["is_configured"] else "Not Configured (Missing Meta API credentials)",
        "admin_number": masked_number,
        "phone_number_id": cfg["phone_number_id"] or "Not Set",
        "api_version": cfg["api_version"],
        "has_access_token": bool(cfg["access_token"]),
    }


def send_admin_whatsapp(message_text, template_name=None, template_components=None):
    """
    Core HTTP Dispatcher sending official WhatsApp Business Cloud API payload to factory admin (919305616979).
    """
    cfg = get_whatsapp_config()

    if not cfg["is_configured"]:
        print("[INFO] WhatsApp notification skipped: Meta WhatsApp Business API environment credentials not configured.")
        return False

    try:
        if template_name:
            payload = {
                "messaging_product": "whatsapp",
                "to": cfg["admin_number"],
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {
                        "code": cfg["template_language"]
                    }
                }
            }
            if template_components:
                payload["template"]["components"] = template_components
        else:
            payload = {
                "messaging_product": "whatsapp",
                "to": cfg["admin_number"],
                "type": "text",
                "text": {
                    "body": message_text
                }
            }

        data_bytes = json.dumps(payload).encode('utf-8')

        req = urllib.request.Request(
            cfg["api_url"],
            data=data_bytes,
            headers={
                "Authorization": f"Bearer {cfg['access_token']}",
                "Content-Type": "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            print(f"[SUCCESS] Meta WhatsApp API notification dispatched to admin recipient ({cfg['admin_number']}).")
            return True

    except urllib.error.HTTPError as http_err:
        print(f"[WARNING] Meta WhatsApp API HTTPError {http_err.code} when sending message to {cfg['admin_number']}. Database operation unaffected.")
        return False
    except Exception as err:
        print(f"[WARNING] Meta WhatsApp notification failed safely: {str(err)}. Database operation unaffected.")
        return False


def send_whatsapp_customer_signup_notification(user, profile):
    """
    Event 1 — New Customer Registration WhatsApp Notification.
    """
    cfg = get_whatsapp_config()

    if cfg["template_new_customer"]:
        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": user.first_name or "New Customer"},
                    {"type": "text", "text": profile.mobile_number or user.username},
                    {"type": "text", "text": profile.address or "Not Provided"}
                ]
            }
        ]
        return send_admin_whatsapp(
            message_text=None,
            template_name=cfg["template_new_customer"],
            template_components=components
        )

    registered_time = user.date_joined.strftime('%d %b %Y, %I:%M %p') if user.date_joined else "Now"
    
    message_text = (
        f"🆕 *New Customer — R.P. Enterprises*\n\n"
        f"👤 *Name:* {user.first_name or 'N/A'}\n"
        f"📞 *Mobile:* {profile.mobile_number or user.username}\n"
        f"📍 *Address:* {profile.address or 'Not Provided'}\n\n"
        f"📅 *Registered:* {registered_time}"
    )

    return send_admin_whatsapp(message_text=message_text)
