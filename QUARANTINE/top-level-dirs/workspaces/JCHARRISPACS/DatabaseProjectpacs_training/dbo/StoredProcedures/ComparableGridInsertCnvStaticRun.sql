
create procedure ComparableGridInsertCnvStaticRun
	@lPacsUserID int,
	@szQuery varchar(2048),
	@bMakeStaticDefault bit,
	@bReplaceExisting bit
as

set nocount on

	declare @lCnvStaticRunID int

	insert comparable_grid_cnv_static_run with(rowlock) (
		dtRun, szQuery, bMakeStaticDefault, bReplaceExisting, lPacsUserID
	) values (
		getdate(), @szQuery, @bMakeStaticDefault, @bReplaceExisting, @lPacsUserID
	)

	set @lCnvStaticRunID = scope_identity()

set nocount off
	
	select lCnvStaticRunID = @lCnvStaticRunID

GO

