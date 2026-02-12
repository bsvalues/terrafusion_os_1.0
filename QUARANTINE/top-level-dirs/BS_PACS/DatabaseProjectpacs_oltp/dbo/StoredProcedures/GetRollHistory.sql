
CREATE procedure GetRollHistory

@input_pacs_user_id	int,
@input_prop_id		int

as


delete from #property_roll_history 
where prop_id = @input_prop_id

declare @query_prop_id		int
declare @prop_id		int
declare @sup_num		int
declare @prop_val_yr		numeric(4)
declare @owner_id		int
declare @child_prop_id		int
declare @pct_ownership		numeric(13,10)
declare @imprv_hstd_val		numeric(14)
declare @imprv_non_hstd_val	numeric(14)
declare @land_hstd_val		numeric(14)
declare @land_non_hstd_val	numeric(14)
declare @ag_market		numeric(14)
declare @ag_use_val		numeric(14)
declare @ag_late_loss		numeric(14)
declare @timber_market		numeric(14)
declare @timber_use		numeric(14)
declare @timber_late_loss	numeric(14)
declare @market			numeric(14)
declare @appraised_val		numeric(14)
declare @ten_percent_cap	numeric(14)
declare @assessed_val		numeric(14)
declare @freeze_exists		bit
declare @entities		varchar(250)
declare @exemptions		varchar(250)
declare @entity_agent		varchar(70)
declare @cad_agent		varchar(70)
declare @arb_agent		varchar(70)


DECLARE ROLL_HISTORY CURSOR FAST_FORWARD
FOR
select 
	pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr,
	o.owner_id,
	IsNull(o.udi_child_prop_id, -1),
	o.pct_ownership,
	pv.imprv_hstd_val,
	pv.imprv_non_hstd_val,
	pv.land_hstd_val,
	pv.land_non_hstd_val,
	pv.ag_market,
	pv.ag_use_val,
	pv.ag_late_loss,
	pv.timber_market,
	pv.timber_use,
	pv.timber_late_loss,
	pv.market,
	pv.appraised_val,
	pv.ten_percent_cap,
	pv.assessed_val
from
	prop_supp_assoc as psa with(nolock),
	property_val as pv with(nolock),
	owner as o with(nolock)
where
	psa.prop_id = pv.prop_id
and	psa.sup_num = pv.sup_num
and	psa.owner_tax_yr = pv.prop_val_yr
and	psa.prop_id = o.prop_id
and	psa.sup_num = o.sup_num
and	psa.owner_tax_yr = o.owner_tax_yr
and	pv.prop_id = @input_prop_id

open ROLL_HISTORY
fetch next from ROLL_HISTORY into
	@prop_id,
	@sup_num,
	@prop_val_yr,
	@owner_id,
	@child_prop_id,
	@pct_ownership,
	@imprv_hstd_val,
	@imprv_non_hstd_val,
	@land_hstd_val,
	@land_non_hstd_val,
	@ag_market,
	@ag_use_val,
	@ag_late_loss,
	@timber_market,
	@timber_use,
	@timber_late_loss,
	@market,
	@appraised_val,
	@ten_percent_cap,
	@assessed_val
	

while (@@FETCH_STATUS = 0)
begin
	IF (@child_prop_id = -1)
	BEGIN
		set @query_prop_id = @prop_id
	END
	ELSE
	BEGIN
		set @query_prop_id = @child_prop_id

		SELECT
			@imprv_hstd_val = pv.imprv_hstd_val,
			@imprv_non_hstd_val = pv.imprv_non_hstd_val,
			@land_hstd_val = pv.land_hstd_val,
			@land_non_hstd_val = pv.land_non_hstd_val,
			@ag_market = pv.ag_market,
			@ag_use_val = pv.ag_use_val,
			@ag_late_loss = pv.ag_late_loss,
			@timber_market = pv.timber_market,
			@timber_use = pv.timber_use,
			@timber_late_loss = pv.timber_late_loss,
			@market = pv.market,
			@appraised_val = pv.appraised_val,
			@ten_percent_cap = pv.ten_percent_cap,
			@assessed_val = pv.assessed_val
		FROM
			property_val AS pv
		WHERE
			pv.prop_id = @child_prop_id
		AND	pv.sup_num = @sup_num
		AND	pv.prop_val_yr = @prop_val_yr
	END

	set @entities = ''
	set @exemptions = ''
	set @freeze_exists = null
	set @entity_agent = ''
	set @cad_agent = ''
	set @arb_agent = ''

	exec GetEntities   'C', @query_prop_id, @sup_num, @prop_val_yr, @entities output
	exec GetExemptions 'C', @query_prop_id, @owner_id, @sup_num, @prop_val_yr, @exemptions output
	exec GetFreezeExists 'C', @query_prop_id, @owner_id, @sup_num, @prop_val_yr, @freeze_exists output
	exec GetAgents @query_prop_id, @owner_id, @prop_val_yr, @entity_agent output, @cad_agent output, @arb_agent output

	insert into #property_roll_history
	(
		roll_type, 
		prop_id,
		sup_num ,    
		prop_val_yr, 
		owner_id    ,
		pct_ownership,   
		imprv_hstd_val,   
		imprv_non_hstd_val, 
		land_hstd_val    ,
		land_non_hstd_val ,
		ag_market  ,
		ag_use_val , 
		ag_late_loss,
		timber_market    ,
		timber_use  ,
		timber_late_loss,
		appraised_val    ,
		ten_percent_cap  ,
		market,
		assessed_val,
		freeze_exists,
		entities, 
		exemptions,
		entity_agent,
		cad_agent,
		arb_agent,
		udi_child_prop_id
	)    
	values
	(
		'C',
		@prop_id,
		@sup_num,
		@prop_val_yr,
		@owner_id,
		@pct_ownership,
		@imprv_hstd_val,
		@imprv_non_hstd_val,
		@land_hstd_val,
		@land_non_hstd_val,
		@ag_market,
		@ag_use_val,
		@ag_late_loss,
		@timber_market,
		@timber_use,
		@timber_late_loss,
		@appraised_val,
		@ten_percent_cap,
		@market,
		@assessed_val,
		@freeze_exists,
		@entities,
		@exemptions,
		@entity_agent,
		@cad_agent,
		@arb_agent,
		@child_prop_id
	)  



	fetch next from ROLL_HISTORY into
		@prop_id,
		@sup_num,
		@prop_val_yr,
		@owner_id,
		@child_prop_id,
		@pct_ownership,
		@imprv_hstd_val,
		@imprv_non_hstd_val,
		@land_hstd_val,
		@land_non_hstd_val,
		@ag_market,
		@ag_use_val,
		@ag_late_loss,
		@timber_market,
		@timber_use,
		@timber_late_loss,
		@market,
		@appraised_val,
		@ten_percent_cap,
		@assessed_val

end

close ROLL_HISTORY
deallocate ROLL_HISTORY



DECLARE PRELIMINARY CURSOR FAST_FORWARD
FOR
select 
	pv.prop_id,
	pv.sup_num,
	pv.prop_val_yr,
	o.owner_id,
	o.pct_ownership,
	pv.imprv_hstd_val,
	pv.imprv_non_hstd_val,
	pv.land_hstd_val,
	pv.land_non_hstd_val,
	pv.ag_market,
	pv.ag_use_val,
	pv.ag_late_loss,
	pv.timber_market,
	pv.timber_use,
	pv.timber_late_loss,
	pv.market,
	pv.appraised_val,
	pv.ten_percent_cap,
	pv.assessed_val
from
	prelim_property_val as pv with(nolock),
	prelim_owner as o with(nolock)
where
	pv.prop_id = o.prop_id
and	pv.sup_num = o.sup_num
and	pv.prop_val_yr = o.owner_tax_yr
and	pv.prop_id = @input_prop_id



open PRELIMINARY
fetch next from PRELIMINARY into
	@prop_id,
	@sup_num,
	@prop_val_yr,
	@owner_id,
	@pct_ownership,
	@imprv_hstd_val,
	@imprv_non_hstd_val,
	@land_hstd_val,
	@land_non_hstd_val,
	@ag_market,
	@ag_use_val,
	@ag_late_loss,
	@timber_market,
	@timber_use,
	@timber_late_loss,
	@market,
	@appraised_val,
	@ten_percent_cap,
	@assessed_val


while (@@FETCH_STATUS = 0)
begin

	set @entities = ''
	set @exemptions = ''
	set @entity_agent = ''
	set @cad_agent = ''
	set @arb_agent = ''


	exec GetEntities   'P', @prop_id, @sup_num, @prop_val_yr, @entities output
	exec GetExemptions 'P', @prop_id, @owner_id, @sup_num, @prop_val_yr, @exemptions output
	exec GetFreezeExists 'P', @prop_id, @owner_id, @sup_num, @prop_val_yr, @freeze_exists output

	insert into #property_roll_history
	(
		roll_type, 
		prop_id,
		sup_num ,    
		prop_val_yr, 
		owner_id    ,
		pct_ownership,   
		imprv_hstd_val,   
		imprv_non_hstd_val, 
		land_hstd_val    ,
		land_non_hstd_val ,
		ag_market  ,
		ag_use_val , 
		ag_late_loss,
		timber_market    ,
		timber_use  ,
		timber_late_loss,
		market,
		appraised_val    ,
		ten_percent_cap  ,
		assessed_val,
		freeze_exists,
		entities, 
		exemptions,
		entity_agent,
		cad_agent,
		arb_agent,
		udi_child_prop_id 
	)    
	values
	(
		'P',
		@prop_id,
		@sup_num,
		@prop_val_yr,
		@owner_id,
		@pct_ownership,
		@imprv_hstd_val,
		@imprv_non_hstd_val,
		@land_hstd_val,
		@land_non_hstd_val,
		@ag_market,
		@ag_use_val,
		@ag_late_loss,
		@timber_market,
		@timber_use,
		@timber_late_loss,
		@market,
		@appraised_val,
		@ten_percent_cap,
		@assessed_val,
		@freeze_exists,
		@entities,
		@exemptions,
		@entity_agent,
		@cad_agent,
		@arb_agent,
		@child_prop_id
	)  




	fetch next from PRELIMINARY into
		@prop_id,
		@sup_num,
		@prop_val_yr,
		@owner_id,
		@pct_ownership,
		@imprv_hstd_val,
		@imprv_non_hstd_val,
		@land_hstd_val,
		@land_non_hstd_val,
		@ag_market,
		@ag_use_val,
		@ag_late_loss,
		@timber_market,
		@timber_use,
		@timber_late_loss,
		@market,
		@appraised_val,
		@ten_percent_cap,
		@assessed_val

end

close PRELIMINARY
deallocate PRELIMINARY

GO

