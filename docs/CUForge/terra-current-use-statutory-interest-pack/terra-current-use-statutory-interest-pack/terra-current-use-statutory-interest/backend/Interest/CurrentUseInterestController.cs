using Microsoft.AspNetCore.Mvc;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Interest;

[ApiController]
[Route("api/forge/current-use/interest")]
public sealed class CurrentUseInterestController : ControllerBase
{
    private readonly ICurrentUseInterestCalculator _calculator;

    public CurrentUseInterestController(ICurrentUseInterestCalculator calculator)
    {
        _calculator = calculator;
    }

    [HttpPost("calculate")]
    public async Task<ActionResult<CurrentUseInterestAccrualResultDto>> Calculate(
        [FromBody] CurrentUseInterestAccrualInputDto input,
        CancellationToken cancellationToken)
    {
        return Ok(await _calculator.CalculateAsync(input, cancellationToken));
    }
}
