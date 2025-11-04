
create procedure RecalcProperty
	@prop_id int,
	@sup_yr  numeric(4),
	@sup_num int,
	@bRecalcIncome bit = 0,
	@bCalcPTDOnly bit = 0,
	@bCalcProfileOnly bit = 0,
	@lSaleID int = 0
as

-- call recalc, Washington version

set nocount on

declare
	@szSQL varchar(4000),
	@szTAAppSvr varchar(64),
	@lTAAppSvrEnvironmentID int,
	@szParam1 varchar(30),
	@szParam2 varchar(50),
	@lChangeLogPacsUserID int

	
-- Get the configuration parameters
select top 1
	@szTAAppSvr = szTAAppSvr,
	@lTAAppSvrEnvironmentID = lTAAppSvrEnvironmentID,
	@szParam1 = szParam1,
	@szParam2 = szParam2
from xsp_pacs_config with(nolock)

select @lChangeLogPacsUserID = pacs_user_id
from pacs_user with(nolock)
where pacs_user_name = @szParam1

set @lChangeLogPacsUserID = isnull(@lChangeLogPacsUserID, 0)

declare @lRecalcByPacsUserID int
set @lRecalcByPacsUserID = 0

if ( @prop_id = 0 and @sup_num > 0 )
begin
	-- change to calc by list for performance reasons

	select @lRecalcByPacsUserID = @lChangeLogPacsUserID

	delete recalc_prop_list
	where pacs_user_id = @lRecalcByPacsUserID

	insert recalc_prop_list
	(prop_id, sup_yr, sup_num, pacs_user_id)
	
	select pv.prop_id, pv.prop_val_yr, pv.sup_num, @lRecalcByPacsUserID
	from property_val as pv with(nolock)
	where pv.prop_val_yr = @sup_yr
	and pv.sup_num = @sup_num
	and pv.prop_inactive_dt is null
	order by pv.prop_id, pv.prop_val_yr, pv.sup_num
end


-- cast parameters to the expected types
declare @lYear int
set @lYear = convert(int, @sup_yr)

declare @lRecalcIncome int
set @lRecalcIncome = convert(int, @bRecalcIncome)

declare	@lTrace int
set @lTrace = 0

declare @lCalcPTDOnly int
set @lCalcPTDOnly = convert(int, @bCalcPTDOnly)

declare @lCalcProfileOnly int
set @lCalcProfileOnly = convert(int, @bCalcProfileOnly)


-- call the extended stored procedure
exec master..xp_RecalcProperty90
	@szTAAppSvr, @lTAAppSvrEnvironmentID, @szParam1, @szParam2, 
	@lRecalcByPacsUserID, @lYear, @sup_num, @prop_id, 
	@lRecalcIncome, @lTrace, @lSaleID, 
	@lChangeLogPacsUserID, @lCalcPTDOnly, @lCalcProfileOnly

GO

