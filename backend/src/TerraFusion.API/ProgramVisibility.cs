// Provides a stable, namespaced Program type for WebApplicationFactory in tests.
// This avoids ambiguity when multiple referenced projects have top-level Program classes.
namespace TerraFusion.API
{
    public partial class Program { }
}
