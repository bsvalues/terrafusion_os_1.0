CREATE PROC [dbo].[UpgradeSharePointPaths]
    @OldPrefix nvarchar(440),
    @NewPrefix nvarchar(440),
    @PrefixLen int

AS
BEGIN
UPDATE [Catalog]
  SET [Path] = @NewPrefix + SUBSTRING([Path], @PrefixLen, 5000)
  WHERE [Path] like @OldPrefix escape '*';
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[UpgradeSharePointPaths] TO [RSExecRole]
    AS [dbo];


GO

