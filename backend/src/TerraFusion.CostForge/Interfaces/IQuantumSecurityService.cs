using System.Threading.Tasks;

namespace TerraFusion.CostForge.Interfaces
{
    /// <summary>
    /// Quantum Security Service Interface (Local CostForge Implementation)
    /// Provides quantum-enhanced security capabilities for CostForge operations
    /// </summary>
    public interface IQuantumSecurityService
    {
        /// <summary>
        /// Validates quantum security protocols
        /// </summary>
        /// <returns>True if quantum security is operational</returns>
        Task<bool> ValidateQuantumSecurityAsync();

        /// <summary>
        /// Encrypts data using quantum encryption algorithms
        /// </summary>
        /// <param name="data">Data to encrypt</param>
        /// <returns>Encrypted data string</returns>
        Task<string> QuantumEncryptAsync(string data);

        /// <summary>
        /// Decrypts data using quantum decryption algorithms
        /// </summary>
        /// <param name="encryptedData">Encrypted data to decrypt</param>
        /// <returns>Decrypted data string</returns>
        Task<string> QuantumDecryptAsync(string encryptedData);

        /// <summary>
        /// Generates quantum-secured tokens for authentication
        /// </summary>
        /// <param name="payload">Token payload</param>
        /// <returns>Quantum-secured token</returns>
        Task<string> GenerateQuantumTokenAsync(object payload);

        /// <summary>
        /// Validates quantum-secured tokens
        /// </summary>
        /// <param name="token">Token to validate</param>
        /// <returns>True if token is valid</returns>
        Task<bool> ValidateQuantumTokenAsync(string token);
    }
}
