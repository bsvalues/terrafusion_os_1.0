using TerraFusion.CiHints;

var primary = args.Length > 0 ? args[0] : null;
var hint = CiFailureHint.Decide(primary);

if (!string.IsNullOrWhiteSpace(hint))
{
    Console.WriteLine(hint);
}
