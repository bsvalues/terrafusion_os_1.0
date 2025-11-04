

create procedure MaintainSitusFromGisSitusDatabase
	@lPreviewOnly bit
as 
	set nocount on
		
	declare @foundSP bit
	declare @updateCount int
	declare @deleteCount int
	declare @insertCount int
	
	declare @county_name varchar(50)
	declare @proc_name varchar(100)

	set @foundSP = 0

	select top 1 @county_name = upper(county_name)
	from system_address
	with (nolock)

	set @proc_name = @county_name + 'ImportSitusAddressInfomation'

	if object_id(@proc_name) > 0
	begin
		set @foundSP = 1

		create table #tmp
		  (update_count int, insert_count int, delete_count int)

		insert #tmp exec @proc_name @lPreviewOnly

		set @updateCount = (select top 1 update_count from #tmp)
		set @deleteCount = (select top 1 delete_count from #tmp)
		set @insertCount = (select top 1 insert_count from #tmp)

		drop table #tmp
	end
      
	set nocount off
      
	-- Return the results
	select @foundSP as found_SP, isnull(@updateCount, -1) as update_count,
			isnull(@insertCount, -1) as insert_count,
			isnull(@deleteCount, -1) as delete_count

GO

