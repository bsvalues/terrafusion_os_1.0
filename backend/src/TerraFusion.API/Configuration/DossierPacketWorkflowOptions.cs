namespace TerraFusion.API.Configuration;

public sealed class DossierPacketWorkflowOptions
{
    public string Mode { get; set; } = "Disabled";
    public int TimeoutSeconds { get; set; } = 30;
    public const string ExpectedCommit = "8f58a6b989641a6fde063afa3dda68bd18062c63";
    public const string ExpectedArtifactSha256 = "d4f29a599c96499f567c065274127b5c6943955b6366bd5959166ac5abf55c01";
    public const string ArtifactSlot = ".terrafusion/runtime/dossier/packet-workflow";
    internal static readonly (string Path, long Length, string Hash)[] Files =
    [
        ("manifest.json", 928, "25f1a91faef5ad1867c058fc57795016ba20fdd090fb596c43255fa637bd159c"),
        ("operations/work-orders/EO-TF-DOSSIER-DURABLE-PACKET-HANDOFF-001.md", 10579, "fc3b630e41cb26c86f946cb0ca9b14e4b00084ae9844f632b6120627d2c15723"),
        ("src/appeal-handoff/decide-dossier-appeal-handoff.mjs", 1204, "1dbfedb5762133e7a8be9d2a9b646a0b55a4bc7a376551d059f9713e42d5e65c"),
        ("src/mutation-decision/decide-dossier-mutation.mjs", 18366, "b314d94ac5cd1ed88d7c841f8a87d3263e7a8adf21c4d5d465003c015c66f277"),
        ("src/packet-finalization/decide-dossier-packet-finalization.mjs", 13668, "f55be3fa60a9cd519a425c20d72b8603a3d12283c7bc004085c79be375a097de")
    ];
}
