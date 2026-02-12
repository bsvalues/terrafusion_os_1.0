"""
Sync Service Models

This package contains database models for the sync service.
"""

from sync_service.models.sync_tables import (
    SyncJob,
    SyncLog,
    TableConfiguration,
    FieldConfiguration, 
    FieldDefaultValue,
    PrimaryKeyColumn,
    LookupTableConfiguration,
    ParcelMap,
    PhotoMap,
    DataChangeMap,
    UpSyncDataChange,
    UpSyncDataChangeArchive,
    ParcelChangeIndexLog,
    GlobalSetting,
    # Add the new models
    SyncConflict,
    SyncSchedule,
    SanitizationLog,
    SyncNotificationLog,
    FieldSanitizationRule,
    NotificationConfig
)

# Import Data Quality models if available
try:
    from sync_service.models.data_quality import (
        DataQualityRule,
        DataQualityIssue,
        DataQualityReport,
        AnomalyDetectionConfig,
        DataAnomaly,
        DataQualityAlert,
        DataQualityNotification
    )
except ImportError:
    # Data Quality models not available
    pass