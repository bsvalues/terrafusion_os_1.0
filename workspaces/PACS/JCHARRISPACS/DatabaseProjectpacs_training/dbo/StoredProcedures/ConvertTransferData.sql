
create  procedure ConvertTransferData

as

set nocount on

declare @prop_id	    int
declare @owner_id	    int
declare @entity_id	    int
declare @sup_num	    int
declare @sup_yr		    numeric(4)
declare @freeze_assessed    numeric(14,0)
declare @freeze_taxable	    numeric(14,0)
declare @m_n_o_tax_pct	    numeric(13,10)
declare @i_n_s_tax_pct	    numeric(13,10)
declare @prot_i_n_s_tax_pct numeric(13,10)
declare @freeze_yr	    numeric(4)
declare @freeze_ceiling	    numeric(14,2)

declare @ptd_actual_tax		numeric(14,2)
declare @bill_freeze_m_n_o	numeric(14,2)
declare @bill_freeze_i_n_s	numeric(14,2)
declare @bill_m_n_o		numeric(14,2)
declare @bill_i_n_s		numeric(14,2)
declare @transfer_dt		datetime
declare @use_freeze		char(1)
declare @transfer_pct		numeric(9,6)
declare @use_transfer		char(1)

declare @transfer_freeze_assessed    numeric(14,0)
declare @transfer_freeze_taxable     numeric(14,0)
declare @transfer_entity_taxable     numeric(14,0)
declare @transfer_taxable_adjustment numeric(14,0)


declare ptd_freeze CURSOR FAST_FORWARD
for
select
	poev.prop_id,
	poev.owner_id,
	poev.entity_id,
	poev.sup_num,
	poev.sup_yr,
	(poev.imprv_hstd_val +  poev.land_hstd_val - poev.ten_percent_cap) as frz_assessed,
	(poev.imprv_hstd_val +  poev.land_hstd_val - poev.ten_percent_cap) - (poev.assessed_val - poev.taxable_val) as frz_taxable,
	IsNull(tr.m_n_o_tax_pct, 0),
	IsNull(tr.i_n_s_tax_pct, 0),
	IsNull(tr.prot_i_n_s_tax_pct, 0),
	pf.freeze_yr,
	pf.freeze_ceiling,
	pf.transfer_dt,
	pf.use_freeze,
	pf.transfer_pct
from
	prop_owner_entity_val as poev with (nolock),
	property_freeze as pf with (nolock),
	tax_rate as tr with (nolock),
	prop_supp_assoc as psa with (nolock),
	entity as e with (nolock)
where
	pf.prop_id = poev.prop_id
and	pf.owner_id = poev.owner_id
and	pf.entity_id = poev.entity_id
and	pf.owner_tax_yr = poev.sup_yr
and	pf.exmpt_tax_yr = poev.sup_yr
and	pf.sup_num  = poev.sup_num
and	poev.entity_id = tr.entity_id
and	poev.sup_yr = tr.tax_rate_yr
and	psa.prop_id = poev.prop_id
and	psa.sup_num = poev.sup_num
and	psa.owner_tax_yr  = poev.sup_yr
and	tr.entity_id = e.entity_id
and	psa.owner_tax_yr  < 2002

open ptd_freeze
fetch next from ptd_freeze into
	@prop_id,
	@owner_id,
	@entity_id,
	@sup_num,
	@sup_yr,
	@freeze_assessed,
	@freeze_taxable,
	@m_n_o_tax_pct,
	@i_n_s_tax_pct,
	@prot_i_n_s_tax_pct,
	@freeze_yr,
	@freeze_ceiling,
	@transfer_dt,
	@use_freeze,
	@transfer_pct

while (@@FETCH_STATUS = 0)
begin
	if (datepart(year, @transfer_dt) = @sup_yr)
	begin
		set @use_transfer = 'T'
	end

	if (@use_transfer = 'T' and @use_freeze = 'F')
	begin
		set @transfer_freeze_assessed = @freeze_assessed
		set @transfer_freeze_taxable = @freeze_taxable
		set @transfer_entity_taxable = @transfer_freeze_taxable * (@transfer_pct/100)
		set @transfer_taxable_adjustment = @transfer_freeze_taxable - @transfer_entity_taxable
		
		update prop_owner_entity_val
		set
			transfer_freeze_assessed = @transfer_freeze_assessed,
			transfer_freeze_taxable = @transfer_freeze_taxable,
			transfer_entity_taxable = @transfer_entity_taxable,
			transfer_taxable_adjustment = @transfer_taxable_adjustment,
			transfer_flag = 'T'
		where
			prop_id = @prop_id
		and	owner_id = @owner_id
		and	sup_num = @sup_num
		and	sup_yr = @sup_yr
		and	entity_id = @entity_id
	end

	fetch next from ptd_freeze into
		@prop_id,
		@owner_id,
		@entity_id,
		@sup_num,
		@sup_yr,
		@freeze_assessed,
		@freeze_taxable,
		@m_n_o_tax_pct,
		@i_n_s_tax_pct,
		@prot_i_n_s_tax_pct,
		@freeze_yr,
		@freeze_ceiling,
		@transfer_dt,
		@use_freeze,
		@transfer_pct
end

close ptd_freeze
deallocate ptd_freeze

GO

