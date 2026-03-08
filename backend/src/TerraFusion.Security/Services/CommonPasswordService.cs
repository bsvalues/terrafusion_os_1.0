using Microsoft.Extensions.Logging;
using TerraFusion.Security.Interfaces;

namespace TerraFusion.Security.Services;

/// <summary>
/// Production implementation of ICommonPasswordService.
/// Checks passwords against a top-100 common/breached password blocklist
/// and provides password strength scoring for FISMA-HIGH compliance.
/// </summary>
public sealed class CommonPasswordService : ICommonPasswordService
{
    // Top 100 most common passwords from breach databases
    private static readonly HashSet<string> BlockedPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        // Original 30
        "password", "123456", "12345678", "qwerty", "abc123",
        "monkey", "1234567", "letmein", "trustno1", "dragon",
        "baseball", "iloveyou", "master", "sunshine", "ashley",
        "bailey", "passw0rd", "shadow", "123123", "654321",
        "superman", "qazwsx", "michael", "football", "password1",
        "password123", "admin", "welcome", "login", "changeme",
        // Extended top 100
        "123456789", "1234567890", "12345", "1234", "111111",
        "1q2w3e4r", "000000", "qwerty123", "zaq1zaq1", "1q2w3e",
        "666666", "7777777", "121212", "123321", "charlie",
        "donald", "aa123456", "qwertyuiop", "password12", "password2",
        "princess", "solo", "lovely", "access", "starwars",
        "hottie", "flower", "hello", "charlie", "robert",
        "daniel", "jessica", "thomas", "summer", "hunter",
        "ginger", "jordan", "jennifer", "andrew", "joshua",
        "pepper", "ranger", "buster", "soccer", "harley",
        "batman", "george", "computer", "tigger", "thunder",
        "cookie", "matrix", "samantha", "banana", "gateway",
        "corvette", "austin", "mustang", "merlin", "secret",
        "p@ssw0rd", "p@ssword", "pa$$word", "passw0rd!", "admin123",
        "root", "toor", "pass", "test", "guest",
        "master123", "welcome1", "password!", "qwer1234", "letmein1",
        "iloveu", "trustno1!", "abc1234", "changeme1", "default"
    };

    private readonly ILogger<CommonPasswordService> _logger;

    public CommonPasswordService(ILogger<CommonPasswordService> logger)
    {
        _logger = logger;
    }

    public bool IsCommon(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            return true;

        var isCommon = BlockedPasswords.Contains(password);

        // Also check common patterns: all same char, sequential digits, keyboard walks
        if (!isCommon)
        {
            isCommon = IsWeakPattern(password);
        }

        if (isCommon)
        {
            _logger.LogWarning("Password rejected: matches common password blocklist or weak pattern");
        }

        return isCommon;
    }

    /// <summary>
    /// Computes a password strength score from 0 (weakest) to 100 (strongest).
    /// Considers length, character diversity, and pattern avoidance.
    /// </summary>
    public int GetStrengthScore(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            return 0;

        if (IsCommon(password))
            return 0;

        var score = 0;

        // Length scoring (up to 30 points)
        score += Math.Min(30, password.Length * 3);

        // Character class diversity (up to 40 points)
        var hasLower = password.Any(char.IsLower);
        var hasUpper = password.Any(char.IsUpper);
        var hasDigit = password.Any(char.IsDigit);
        var hasSpecial = password.Any(c => !char.IsLetterOrDigit(c));

        var classCount = (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasDigit ? 1 : 0) + (hasSpecial ? 1 : 0);
        score += classCount * 10;

        // Unique character ratio bonus (up to 15 points)
        var uniqueRatio = (double)password.Distinct().Count() / password.Length;
        score += (int)(uniqueRatio * 15);

        // Penalty for repetitive characters (up to -15 points)
        var maxRepeat = password
            .GroupBy(c => c)
            .Max(g => g.Count());
        if (maxRepeat > password.Length / 2)
            score -= 15;
        else if (maxRepeat > password.Length / 3)
            score -= 10;

        // Penalty for sequential patterns
        if (HasSequentialChars(password, 4))
            score -= 10;

        // Bonus for length >= 12 (NIST 800-63B recommendation)
        if (password.Length >= 12)
            score += 5;

        // Bonus for length >= 16
        if (password.Length >= 16)
            score += 5;

        return Math.Clamp(score, 0, 100);
    }

    /// <summary>
    /// Detects weak patterns such as all-same characters, sequential runs,
    /// or keyboard walks.
    /// </summary>
    private static bool IsWeakPattern(string password)
    {
        if (password.Length < 4)
            return true;

        // All same character
        if (password.Distinct().Count() == 1)
            return true;

        // Pure sequential digits (ascending or descending)
        if (password.All(char.IsDigit) && IsSequentialRun(password))
            return true;

        // Common keyboard walks
        var keyboardWalks = new[] { "qwert", "asdfg", "zxcvb", "1qaz", "2wsx", "qazwsx" };
        var lower = password.ToLowerInvariant();
        if (keyboardWalks.Any(w => lower.Contains(w)))
            return true;

        return false;
    }

    private static bool IsSequentialRun(string s)
    {
        if (s.Length < 4) return false;

        var ascending = true;
        var descending = true;
        for (int i = 1; i < s.Length; i++)
        {
            if (s[i] - s[i - 1] != 1) ascending = false;
            if (s[i - 1] - s[i] != 1) descending = false;
        }
        return ascending || descending;
    }

    private static bool HasSequentialChars(string s, int minRun)
    {
        if (s.Length < minRun) return false;

        var run = 1;
        for (int i = 1; i < s.Length; i++)
        {
            if (Math.Abs(s[i] - s[i - 1]) == 1)
            {
                run++;
                if (run >= minRun) return true;
            }
            else
            {
                run = 1;
            }
        }
        return false;
    }
}
