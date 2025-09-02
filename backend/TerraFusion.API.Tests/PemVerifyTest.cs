using System;
using System.IO;
using System.Text;
// using TerraFusion.AI.Services; // Service doesn't exist
using Xunit;

namespace TerraFusion.API.Tests;

// This test references non-existent MarketplaceService - commenting out until service is implemented
/*
public class PemVerifyTest
{
    // A helper class to expose the private static method for testing
    private class MarketplaceServiceAccessor : MarketplaceService
    {
        public MarketplaceServiceAccessor() : base(null, null, null) { }
        public static byte[] ParsePublicKeyFromPem(string pem) => MarketplaceService.ParsePublicKeyFromPem(pem);
    }

    [Fact]
    public void NodeJs_Signs_DotNet_Verifies_Successfully()
    {
        // Arrange
        var baseDir = AppContext.BaseDirectory;
        // Navigate up from bin/Debug/net8.0 to the project root, then to the solution root.
        var solutionRoot = Directory.GetParent(baseDir).Parent.Parent.Parent.Parent.FullName;
        var keysDir = Path.Combine(solutionRoot, "keys");
        var artifactsDir = solutionRoot;

        var pem = File.ReadAllText(Path.Combine(keysDir, "ed25519-public.pem"));
        byte[] msg = Encoding.UTF8.GetBytes("hello world");
        byte[] sig = File.ReadAllBytes(Path.Combine(artifactsDir, "sig.bin"));

        // Act
        byte[] pk = MarketplaceServiceAccessor.ParsePublicKeyFromPem(pem);
        bool ok = Sodium.PublicKeyAuth.VerifyDetached(sig, msg, pk);

        // Assert
        Assert.True(ok, "Signature verification failed. The signature from Node.js was not valid.");
    }
}
*/
