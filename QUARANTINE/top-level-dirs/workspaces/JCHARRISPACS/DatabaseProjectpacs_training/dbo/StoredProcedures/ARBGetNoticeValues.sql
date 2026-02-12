



CREATE  procedure ARBGetNoticeValues

@prop_id	int,
@prop_val_yr	numeric(4)

as

declare @land_hstd_val		numeric(14,0)
declare @land_non_hstd_val	numeric(14,0)
declare @imprv_hstd_val		numeric(14,0)
declare @imprv_non_hstd_val	numeric(14,0)
declare @ag_use_val		numeric(14,0)
declare @ag_market		numeric(14,0)
declare @timber_use		numeric(14,0)
declare @timber_market		numeric(14,0)
declare @market			numeric(14,0)
declare @appraised_val		numeric(14,0)
declare @ten_percent_cap	numeric(14,0)
declare @assessed_val		numeric(14,0)
declare @rendered_val		numeric(14,0)
declare @exemptions		varchar(50)
declare @entities 		varchar(50)
declare @arb_protest_due_dt	datetime

declare @sup_num		int
declare @entity_cd		varchar(5)
declare @exmpt_type_cd		varchar(5)
declare @notice_num		int
declare @owner_id		int

select @notice_num = max(notice_num)
from appr_notice_prop_list
where prop_id = @prop_id
and   notice_yr = @prop_val_yr


set @exemptions = ''
set @entities   = ''


select top 1 @land_hstd_val      = an_land_hstd_val,
       @land_non_hstd_val  = an_land_non_hstd_val,
       @imprv_hstd_val     = an_imprv_hstd_val,
       @imprv_non_hstd_val = an_imprv_non_hstd_val,
       @ag_use_val	   = an_ag_land_use_val,
       @ag_market	   = an_ag_land_mkt_val,
       @timber_use	   = an_timber_use,
       @timber_market	   = an_timber_market,
       @market		   = an_market_val,
       @appraised_val      = an_appraised_val,   
       @ten_percent_cap    = an_ten_percent_cap,
       @assessed_val       = an_assessed_val,
       @rendered_val       = 0,
       @sup_num		   = sup_num,
       @exemptions	   = exemption,
       @owner_id	   = owner_id
       
from appr_notice_prop_list
where prop_id 	= @prop_id
and   notice_yr 	= @prop_val_yr
and   notice_num     = @notice_num


-- get entities
DECLARE ENTITIES CURSOR FAST_FORWARD
FOR select distinct RTRIM(entity_cd) as entity_cd
    from appr_notice_prop_list_bill ab, entity e
    where ab.entity_id = e.entity_id
    and   prop_id    = @prop_id
    and   notice_yr  = @prop_val_yr
    and   sup_num    = @sup_num
    and   owner_id   = @owner_id
    and   notice_num = @notice_num
    order by entity_cd

OPEN ENTITIES
FETCH NEXT FROM ENTITIES INTO @entity_cd

WHILE (@@FETCH_STATUS = 0)
BEGIN
	if (@entities = '')
	begin
		set @entities = @entity_cd
	end
	else
	begin
		set @entities = @entities + ', '
		set @entities = @entities + @entity_cd
	end

	FETCH NEXT FROM ENTITIES INTO @entity_cd
END

CLOSE ENTITIES
DEALLOCATE ENTITIES


select @arb_protest_due_dt = arb_protest_due_dt
from appr_notice_selection_criteria
where notice_yr = @prop_val_yr
and   notice_num = @notice_num





select 	land_hstd_val      = @land_hstd_val,		
	land_non_hstd_val  = @land_non_hstd_val,	
	imprv_hstd_val     = @imprv_hstd_val,		
	imprv_non_hstd_val = @imprv_non_hstd_val,	
	ag_use_val	   = @ag_use_val,		
	ag_market	   = @ag_market,	
	timber_use	   = @timber_use,		
	timber_market	   = @timber_market,			
	market		   = @market,			
	appraised_val	   = @appraised_val,		
	ten_percent_cap	   = @ten_percent_cap,	
	assessed_val	   = @assessed_val,		
	rendered_val	   = @rendered_val,		
	exemptions	   = @exemptions,		
	entities	   = @entities,
	dt		   = @arb_protest_due_dt

GO

