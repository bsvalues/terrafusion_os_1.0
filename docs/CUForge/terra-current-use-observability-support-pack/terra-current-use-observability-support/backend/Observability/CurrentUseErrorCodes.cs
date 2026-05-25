namespace TerraFusion.Modules.CurrentUse.Observability;

public static class CurrentUseErrorCodes
{
    public const string RollbackMissingTaxYearData = "CU_ROLLBACK_MISSING_TAX_YEAR_DATA";
    public const string RollbackPolicyNotResolved = "CU_ROLLBACK_POLICY_NOT_RESOLVED";
    public const string NoticeApprovalRequired = "CU_NOTICE_APPROVAL_REQUIRED";
    public const string NoticeIssuedCannotVoid = "CU_NOTICE_ISSUED_CANNOT_VOID";
    public const string EvidenceDocumentMissing = "CU_EVIDENCE_DOCUMENT_MISSING";
    public const string TraceAppendFailed = "CU_TRACE_APPEND_FAILED";
    public const string PermissionDenied = "CU_PERMISSION_DENIED";
    public const string ImportValidationFailed = "CU_IMPORT_VALIDATION_FAILED";
}
