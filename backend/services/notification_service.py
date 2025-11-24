from twilio.rest import Client
from typing import List, Dict
import os
from dotenv import load_dotenv

load_dotenv()

class NotificationService:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_PHONE_NUMBER')
        self.use_whatsapp = os.getenv('USE_WHATSAPP', 'false').lower() == 'true'
        self.whatsapp_from = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')  # Twilio sandbox default

        if not all([self.account_sid, self.auth_token, self.from_number]):
            raise ValueError("Twilio credentials not found in environment variables")

        self.client = Client(self.account_sid, self.auth_token)

        if self.use_whatsapp:
            print(f"[Notification Service] WhatsApp mode enabled")
            print(f"[Notification Service] WhatsApp From: {self.whatsapp_from}")
        else:
            print(f"[Notification Service] SMS mode enabled")
            print(f"[Notification Service] SMS From: {self.from_number}")

    def send_sms(self, to_number: str, message: str) -> Dict[str, any]:
        """
        Send SMS or WhatsApp message to a single phone number
        Returns dict with status and error if any
        """
        try:
            # Ensure phone number is in E.164 format
            original_number = to_number
            if not to_number.startswith('+'):
                to_number = f'+{to_number}'

            # Determine if using WhatsApp or SMS
            if self.use_whatsapp:
                # WhatsApp requires 'whatsapp:' prefix
                to_whatsapp = f'whatsapp:{to_number}'
                from_number = self.whatsapp_from

                print(f"[WhatsApp] Sending to: {to_whatsapp} (original: {original_number})")
                print(f"[WhatsApp] From: {from_number}")
                print(f"[WhatsApp] Message: {message[:50]}...")
            else:
                to_whatsapp = to_number
                from_number = self.from_number

                print(f"[SMS] Sending to: {to_number} (original: {original_number})")
                print(f"[SMS] From: {from_number}")
                print(f"[SMS] Message: {message[:50]}...")

            message_obj = self.client.messages.create(
                body=message,
                from_=from_number,
                to=to_whatsapp
            )

            print(f"[{'WhatsApp' if self.use_whatsapp else 'SMS'}] Success! SID: {message_obj.sid}, Status: {message_obj.status}")

            return {
                'success': True,
                'sid': message_obj.sid,
                'status': message_obj.status,
                'to': to_number
            }
        except Exception as e:
            print(f"[{'WhatsApp' if self.use_whatsapp else 'SMS'}] Error sending to {to_number}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'to': to_number
            }

    def send_bulk_sms(self, phone_numbers: List[str], message: str) -> Dict[str, any]:
        """
        Send SMS to multiple phone numbers
        Returns summary with success and failure counts
        """
        results = {
            'successful': [],
            'failed': [],
            'total': len(phone_numbers)
        }

        for phone_number in phone_numbers:
            if not phone_number:
                results['failed'].append({
                    'phone': phone_number,
                    'error': 'Empty phone number'
                })
                continue

            result = self.send_sms(phone_number, message)

            if result['success']:
                results['successful'].append(result)
            else:
                results['failed'].append(result)

        return results

    @staticmethod
    def get_predefined_message(message_type: str, trip_info: dict = None) -> str:
        """
        Get predefined message templates
        """
        messages = {
            'arriving_10_min': 'Your shuttle will arrive in approximately 10 minutes. Please be ready at the pickup point.',
            'departing_3_min': 'The shuttle will depart in 3 minutes. Please board immediately.',
            'running_late': 'The shuttle is running late due to unforeseen circumstances. We apologize for the inconvenience.',
        }

        base_message = messages.get(message_type, '')

        if trip_info:
            route_name = trip_info.get('route_name', '')
            if route_name:
                base_message = f"[{route_name}] {base_message}"

        return base_message


notification_service = NotificationService()
