namespace TerraFusion.Modules.CurrentUse.Repositories;

public interface ICurrentUseUnitOfWork
{
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed class CurrentUseUnitOfWork : ICurrentUseUnitOfWork
{
    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        // Replace with app DbContext.SaveChangesAsync.
        return Task.CompletedTask;
    }
}
