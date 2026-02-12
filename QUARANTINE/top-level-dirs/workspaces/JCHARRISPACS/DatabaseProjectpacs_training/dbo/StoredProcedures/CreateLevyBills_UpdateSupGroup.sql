
/******************************************************************************************
 Procedure: CreateLevyBills_UpdateSupGroup
 Synopsis:	Updates the supplement and sup_group data based on the levy bill creation process
			
 Call From:	App Server
 ******************************************************************************************/
CREATE PROCEDURE CreateLevyBills_UpdateSupGroup
	@pacs_user_id		int,
	@year				numeric(4, 0) = 0,		
	@levy_cert_run_id	int = 0
	
AS

SET NOCOUNT ON

declare @supGroupID int, @supNum int,
@return_message varchar(255)

set @supGroupID = -1
set @supNum = -1

if(@year = 0 or @levy_cert_run_id = 0)
begin
	select 
		@levy_cert_run_id = lcr.levy_cert_run_id,
		@year = lcr.[year]
	from levy_cert_run as lcr with (nolock) 
	join (	select max(bills_created_date) maxDate 
			from levy_cert_run with (nolock) 
			where status = 'Bills Created') tmp
		on tmp.maxDate = lcr.bills_created_date 
	where lcr.status = 'Bills Created'
	and lcr.bills_created_by_id = @pacs_user_id
end

if(@year = 0 or @levy_cert_run_id = 0)
begin

	set @return_message = 'Please specify a year and levy run id.'
	goto quit
end

declare supData cursor fast_forward for 
	select distinct s.sup_num, s.sup_group_id
	from levy_supp_assoc lsa with (nolock)
	join supplement s with (nolock) on
		s.sup_tax_yr = lsa.sup_yr and
		s.sup_num = lsa.sup_num
	where lsa.sup_yr = @year
		
open supData
fetch next from supData into @supNum, @supGroupID

while @@fetch_status = 0
begin
	
	--update the supplement table
	update supplement
	set levy_cert_run_id = @levy_cert_run_id
	where sup_tax_yr = @year
	and sup_group_id = @supGroupID
	and sup_num = @supNum
	
	--do not update sup group 0 and do not update sup groups with other year layers in it
	if @supGroupID <> 0 and not exists (	select * 
											from supplement 
											where sup_group_id = @supGroupID
											and sup_tax_yr <> @year) 
					
	begin 
		exec SupGroupPreprocess_UpdateTaxAmounts @supGroupID, @pacs_user_id
		
		update sup_group set 
			sup_bill_create_dt = (	select bills_created_date 
									from levy_cert_run 
									where levy_cert_run_id = @levy_cert_run_id and 
									[year] = @year),
			sup_bills_created_by_id = @pacs_user_id,
			status_cd = 'BC'
		where sup_group_id = @supGroupID
	end
	
	fetch next from supData into @supNum, @supGroupID
end

close supData 
deallocate supData

quit:
	select @return_message as return_message

GO

