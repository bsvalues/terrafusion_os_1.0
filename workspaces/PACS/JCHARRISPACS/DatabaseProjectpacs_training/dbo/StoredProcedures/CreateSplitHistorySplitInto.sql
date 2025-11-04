
CREATE  PROCEDURE CreateSplitHistorySplitInto

	@parent_propid	   	int,
	@propid				int,
	@year				numeric(4,0),
	@sid				int

AS

SET NOCOUNT ON

declare @legal_acre	numeric(14,4)
declare @legal_desc varchar(255)

select @legal_acre = 0.0
select @legal_desc = ''


		select top 1 @legal_acre = legal_acreage, @legal_desc = legal_desc from property_val with (nolock) where prop_id = @propid and sup_num = 0 and prop_val_yr = @year


		insert into split_into (
			split_id,
			parent_id,
			child_id,
			legal_acres,
			legal_desc,
			owner
			)
		select
			@sid,
			@parent_propid,
			@propid,
			@legal_acre,
			@legal_desc,
			(select top 1 a.file_as_name from account a with (nolock), owner o with (nolock) where a.acct_id = o.owner_id and o.prop_id = @propid and o.owner_tax_yr = @year)

GO

