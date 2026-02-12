using Microsoft.AspNetCore.Mvc;
using DatabaseProjectpacs_oltp.Services.Auth;

namespace DatabaseProjectpacs_oltp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!await _authService.ValidateCredentialsAsync(request.Username, request.Password))
        {
            return Unauthorized("Invalid credentials");
        }

        var token = await _authService.GenerateTokenAsync(request.Username);
        return Ok(new { token });
    }
}

public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
} 