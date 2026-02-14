namespace TerraFusion.Security.Interfaces;

public interface IHashingService
{
    string ComputeSha256(string data);
}
