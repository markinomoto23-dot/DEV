from django.contrib.auth.models import User
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver

from .models import Role, UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    UserProfile.objects.get_or_create(user=instance)


@receiver(post_migrate)
def create_default_roles(sender, **kwargs):
    if sender.name != "roles":
        return

    # Keep the existing Admin / Technician / User permissions unchanged.
    Role.objects.get_or_create(
        name="Admin",
        defaults={
            "description": "Administrative access.",
            "is_system": True,
            "can_access_dashboard": True,
            "can_access_customers": True,
            "can_access_locations": True,
            "can_access_equipment": True,
            "can_access_warranties": True,
            "can_access_licenses": True,
            "can_access_tickets": True,
            "can_access_technicians": True,
            "can_access_billing": True,
            "can_access_reports": True,
            "can_access_users": True,
            "can_access_roles": False,
            "can_access_audit_trail": True,
            "can_access_notifications": True,
            "can_access_settings": True,
            "can_manage_users": True,
            "can_manage_roles": False,
        },
    )

    Role.objects.get_or_create(
        name="Technician",
        defaults={
            "description": "Technician service access.",
            "is_system": True,
            "can_access_dashboard": True,
            "can_access_customers": False,
            "can_access_locations": True,
            "can_access_equipment": True,
            "can_access_warranties": True,
            "can_access_licenses": True,
            "can_access_tickets": True,
            "can_access_technicians": False,
            "can_access_billing": False,
            "can_access_reports": False,
            "can_access_users": False,
            "can_access_roles": False,
            "can_access_audit_trail": False,
            "can_access_notifications": True,
            "can_access_settings": False,
            "can_manage_users": False,
            "can_manage_roles": False,
        },
    )

    Role.objects.get_or_create(
        name="User",
        defaults={
            "description": "Standard system user.",
            "is_system": True,
            "can_access_dashboard": True,
            "can_access_customers": True,
            "can_access_locations": True,
            "can_access_equipment": True,
            "can_access_warranties": False,
            "can_access_licenses": False,
            "can_access_tickets": True,
            "can_access_technicians": False,
            "can_access_billing": False,
            "can_access_reports": False,
            "can_access_users": False,
            "can_access_roles": False,
            "can_access_audit_trail": False,
            "can_access_notifications": True,
            "can_access_settings": False,
            "can_manage_users": False,
            "can_manage_roles": False,
        },
    )

    # Add the Manager role for the MVP without changing existing Technician access.
    Role.objects.get_or_create(
        name="Manager",
        defaults={
            "description": "Service manager access.",
            "is_system": True,
            "can_access_dashboard": True,
            "can_access_customers": True,
            "can_access_locations": True,
            "can_access_equipment": True,
            "can_access_warranties": True,
            "can_access_licenses": True,
            "can_access_tickets": True,
            "can_access_technicians": True,
            "can_access_billing": True,
            "can_access_reports": True,
            "can_access_users": True,
            "can_access_roles": False,
            "can_access_audit_trail": False,
            "can_access_notifications": True,
            "can_access_settings": False,
            "can_manage_users": True,
            "can_manage_roles": False,
        },
    )
