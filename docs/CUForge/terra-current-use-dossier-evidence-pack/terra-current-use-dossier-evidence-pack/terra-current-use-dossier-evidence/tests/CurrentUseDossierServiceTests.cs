using TerraFusion.Modules.CurrentUse.Dossier;
using TerraFusion.Modules.CurrentUse.Dto;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseDossierServiceTests
{
    [Fact]
    public async Task Empty_Packet_Reports_Missing_Required_Documents()
    {
        var service = new CurrentUseDossierService();

        var packet = await service.GetEvidencePacketAsync(
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.Equal(CurrentUseEvidencePacketStatus.Incomplete, packet.Status);
        Assert.Contains("FARM_PLAN", packet.MissingDocumentTypes);
    }

    [Fact]
    public async Task Linked_Document_Appears_In_Evidence_Packet()
    {
        var service = new CurrentUseDossierService();
        var parcelId = Guid.NewGuid();

        await service.LinkDocumentAsync(
            new LinkCurrentUseDocumentRequestDto(
                Guid.NewGuid(),
                parcelId,
                null,
                Guid.NewGuid(),
                "FARM_PLAN",
                "farm-plan.pdf",
                "application/pdf",
                1000,
                "unit.test@county.gov",
                "test"),
            CancellationToken.None);

        var packet = await service.GetEvidencePacketAsync(parcelId, CancellationToken.None);

        Assert.Contains(packet.Documents, x => x.DocumentType == "FARM_PLAN");
    }
}
