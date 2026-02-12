namespace DatabaseProjectpacs_oltp.Services.Auth;

public interface IAuthService
{
    Task<string> GenerateTokenAsync(string username);
    Task<bool> ValidateCredentialsAsync(string username, string password);
    Task<bool> ValidateTokenAsync(string token);
} 