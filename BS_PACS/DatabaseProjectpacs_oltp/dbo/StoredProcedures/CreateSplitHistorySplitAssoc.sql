
CREATE  PROCEDURE CreateSplitHistorySplitAssoc

	@propid	int,
	@year 		numeric(4),
	@sup_num  	int

AS

SET NOCOUNT ON

	declare @sid int
	declare @legal_acre	numeric(14,4)
	declare @legal_desc varchar(255)


	select @sid = 0
	select @legal_acre = 0.0
	select @legal_desc = ''


	select top 1 @legal_acre = legal_acreage, @legal_desc = legal_desc from property_val with (nolock) where prop_id = @propid and sup_num = @sup_num and prop_val_yr = @year

	exec dbo.GetUniqueID 'split_assoc', @sid output, 1, 0

	insert into split_assoc(
				prop_id,	
				split_id,
				split_dt,
				before_legal_acres,
				before_legal_desc,
				before_owner,
				after_legal_acres,
				after_legal_desc,
				after_owner
				)
			select
				@propid,
				@sid,
				GETDATE(),
				@legal_acre,
				@legal_desc,
				(select top 1 a.file_as_name from account a with (nolock), owner o with (nolock) where a.acct_id = o.owner_id and o.prop_id = @propid and o.owner_tax_yr = @year),
				@legal_acre,
				@legal_desc,
				(select top 1 a.file_as_name from account a with (nolock), owner o with (nolock) where a.acct_id = o.owner_id and o.prop_id = @propid and o.owner_tax_yr = @year)
		

	if object_id('tempdb..#sid') is null
	begin
		create table #sid
		(
			sid	int
		)
	end

	insert into #sid VALUES(@sid)

	select sid from #sid

	drop table #sid

GO

