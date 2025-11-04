using System.Threading.Tasks;
using TerraFusion.Experiments.Models;
using TerraFusion.Experiments.Services;
using Xunit;

namespace TerraFusion.Experiments.Tests
{
    public class ExperimentServiceTests
    {
        [Fact]
        public async Task CreateAndRetrieveExperiment_ShouldWork()
        {
            var svc = new ExperimentService();
            var manifest = new ExperimentManifest
            {
                Name = "unit-test",
                DatasetId = "ds-1",
                ModelId = "m-1",
                Seed = 12345
            };

            var created = await svc.CreateAsync(manifest);
            Assert.NotEqual(System.Guid.Empty, created.Id);

            var fetched = await svc.GetAsync(created.Id);
            Assert.NotNull(fetched);
            Assert.Equal("unit-test", fetched!.Name);
        }
    }
}
