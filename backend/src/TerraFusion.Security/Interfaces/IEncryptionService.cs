namespace TerraFusion.Security.Interfaces
{
    /// <summary>
    /// Encryption service interface supporting both string and byte[] operations.
    /// String overloads used by ProductionAuditService for sensitive data encryption.
    /// </summary>
    public interface IEncryptionService
    {
        // String-based operations (used by ProductionAuditService)
        Task<string?> EncryptAsync(string? plainText);
        Task<string?> DecryptAsync(string? cipherText);

        // Key management
        Task<string> GenerateSecureKeyAsync(int keySize = 256);
        Task<bool> ValidateKeyStrengthAsync(string key);
    }

    /// <summary>
    /// Hashing service interface for audit log integrity verification.
    /// Used by ProductionAuditService for tamper detection.
    /// </summary>
    public interface IHashingService
    {
        string ComputeSha256(string data);
        string ComputeHmacSha256(string data, string key);
        bool VerifyHash(string data, string expectedHash);
    }
}
