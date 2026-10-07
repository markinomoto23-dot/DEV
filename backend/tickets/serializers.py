from django.utils import timezone
from rest_framework import serializers

from .models import Ticket, TicketAttachment


class TicketAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TicketAttachment
        fields = [
            "id",
            "ticket",
            "attachment_type",
            "file_url",
            "original_name",
            "file_size",
            "content_type",
            "uploaded_at",
        ]
        read_only_fields = [
            "id",
            "ticket",
            "attachment_type",
            "file_url",
            "original_name",
            "file_size",
            "content_type",
            "uploaded_at",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        path = f"/api/tickets/{obj.ticket_id}/attachments/{obj.id}/download/"
        return request.build_absolute_uri(path) if request else path


class TicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.company_name", read_only=True, allow_null=True)
    location_name = serializers.CharField(source="location.location_name", read_only=True, allow_null=True)
    equipment_name = serializers.CharField(source="equipment.equipment_name", read_only=True, allow_null=True)
    equipment_serial = serializers.CharField(source="equipment.serial_number", read_only=True, allow_null=True)

    # Legacy fields are returned for old clients, but new clients should use technicians.
    technician_name = serializers.CharField(source="technician.full_name", read_only=True, allow_null=True)
    technician_employee_id = serializers.CharField(source="technician.employee_id", read_only=True, allow_null=True)

    technician_names = serializers.SerializerMethodField()
    technician_details = serializers.SerializerMethodField()
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    created_by_username = serializers.SerializerMethodField()
    is_scheduled = serializers.BooleanField(read_only=True)

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None

    def get_technician_names(self, obj):
        return [tech.full_name or tech.employee_id for tech in obj.technicians.all()]

    def get_technician_details(self, obj):
        return [
            {
                "id": tech.id,
                "employee_id": tech.employee_id,
                "full_name": tech.full_name,
                "email": tech.email,
            }
            for tech in obj.technicians.all()
        ]

    class Meta:
        model = Ticket
        fields = [
            "id", "ticket_number",
            "customer", "customer_name",
            "location", "location_name",
            "equipment", "equipment_name", "equipment_serial",
            "subject", "description",
            "contact_name", "contact_email", "contact_phone",
            "category", "priority", "status",
            "technician", "technician_name", "technician_employee_id",
            "technicians", "technician_names", "technician_details",
            "assigned_technician",
            "due_date",
            "service_date", "start_time", "end_time",
            "recurrence_type", "recurrence_end_date",
            "resolved_at", "notes",
            "work_performed", "time_on_site", "equipment_materials_used",
            "attachments",
            "is_scheduled",
            "created_by", "created_by_username",
            "created_at", "updated_at",
        ]
        extra_kwargs = {
            "customer": {
                "required": False,
                "allow_null": True,
            },
            "subject": {
                "required": False,
                "allow_blank": True,
            },
        }

        read_only_fields = [
            "id", "ticket_number",
            "customer_name", "location_name", "equipment_name", "equipment_serial",
            "technician_name", "technician_employee_id",
            "technician_names", "technician_details",
            "assigned_technician",
            "attachments", "is_scheduled",
            "created_by", "created_by_username",
            "created_at", "updated_at",
        ]

    def validate(self, attrs):
        customer = attrs.get("customer", getattr(self.instance, "customer", None))
        location = attrs.get("location", getattr(self.instance, "location", None))
        equipment = attrs.get("equipment", getattr(self.instance, "equipment", None))
        recurrence_type = attrs.get(
            "recurrence_type",
            getattr(self.instance, "recurrence_type", "none"),
        )
        service_date = attrs.get("service_date", getattr(self.instance, "service_date", None))
        recurrence_end_date = attrs.get(
            "recurrence_end_date",
            getattr(self.instance, "recurrence_end_date", None),
        )
        start_time = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(self.instance, "end_time", None))
        due_date = attrs.get("due_date", getattr(self.instance, "due_date", None))

        old_service_date = getattr(self.instance, "service_date", None)
        old_recurrence_type = getattr(self.instance, "recurrence_type", "none")
        old_recurrence_end_date = getattr(self.instance, "recurrence_end_date", None)

        service_date_changed = self.instance is None or service_date != old_service_date
        recurrence_changed = (
            self.instance is None
            or recurrence_type != old_recurrence_type
            or service_date != old_service_date
            or recurrence_end_date != old_recurrence_end_date
        )

        if location and customer and location.customer_id != customer.id:
            raise serializers.ValidationError({
                "location": "The selected location does not belong to this customer."
            })

        if equipment and equipment.location:
            if (
                customer
                and equipment.location.customer_id
                and equipment.location.customer_id != customer.id
            ):
                raise serializers.ValidationError({
                    "equipment": "The selected equipment does not belong to this customer."
                })
            if location and equipment.location_id != location.id:
                raise serializers.ValidationError({
                    "equipment": "The selected equipment does not belong to this location."
                })

        if service_date and service_date_changed and service_date < timezone.localdate():
            raise serializers.ValidationError({
                "service_date": "Appointment / Service Date cannot be in the past."
            })

        if service_date and due_date and service_date > due_date:
            raise serializers.ValidationError({
                "service_date": "Appointment / Service Date cannot be later than the Due Date."
            })

        if bool(start_time) != bool(end_time):
            raise serializers.ValidationError({
                "start_time": "Set both Start Time and End Time, or leave both blank for an all-day booking."
            })


        if recurrence_end_date and service_date and recurrence_end_date < service_date:
            raise serializers.ValidationError({
                "recurrence_end_date": "Recurrence end date cannot be before the service date."
            })

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                "end_time": "End time must be later than start time."
            })

        return attrs

    def _sync_legacy_technician_fields(self, instance):
        first = instance.technicians.first()
        Ticket.objects.filter(pk=instance.pk).update(
            technician=first,
            assigned_technician=(first.full_name or first.employee_id) if first else "",
        )
        instance.technician = first
        instance.assigned_technician = (first.full_name or first.employee_id) if first else ""

    def create(self, validated_data):
        technicians = validated_data.pop("technicians", [])
        status_value = validated_data.get("status", "open")
        if status_value == "closed" and not validated_data.get("resolved_at"):
            validated_data["resolved_at"] = timezone.now()

        ticket = super().create(validated_data)
        if technicians:
            ticket.technicians.set(technicians)
        self._sync_legacy_technician_fields(ticket)
        return ticket

    def update(self, instance, validated_data):
        technicians = validated_data.pop("technicians", None)
        old_status = instance.status
        instance = super().update(instance, validated_data)
        if technicians is not None:
            instance.technicians.set(technicians)
            self._sync_legacy_technician_fields(instance)

        if old_status != "closed" and instance.status == "closed" and not instance.resolved_at:
            instance.resolved_at = timezone.now()
            instance.save(update_fields=["resolved_at"])
        elif old_status == "closed" and instance.status != "closed" and instance.resolved_at:
            instance.resolved_at = None 
            instance.save(update_fields=["resolved_at"])

        return instance
