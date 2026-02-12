


CREATE procedure ptd_set_actual_tax 

@input_tax_yr	numeric(4)

as

set nocount on

/*
Revision History
1.0 - Creation
1.1 - EricZ, HelpSTAR #12498
*/

declare @prop_id	    int
declare @owner_id	    int
declare @entity_id	    int
declare @sup_num	    int
declare @sup_yr		    numeric(4)
declare @frz_assessed	    numeric(14,0)
declare @frz_taxable	    numeric(14,0)
declare @m_n_o_tax_pct	    numeric(13,10)
declare @i_n_s_tax_pct	    numeric(13,10)
declare @prot_i_n_s_tax_pct numeric(13,10)
declare @freeze_yr	    numeric(4)
declare @freeze_ceiling	    numeric(14,2)

declare @curr_ptd_actual_tax numeric(14,2)
declare @ptd_actual_tax		numeric(14,2)
declare @bill_freeze_m_n_o	numeric(14,2)
declare @bill_freeze_i_n_s	numeric(14,2)
declare @bill_m_n_o		numeric(14,2)
declare @bill_i_n_s		numeric(14,2)

declare ptd_freeze CURSOR FAST_FORWARD
for
select poev.prop_id,
       poev.owner_id,
       poev.entity_id,
       poev.sup_num,
       poev.sup_yr,
       (poev.imprv_hstd_val +  poev.land_hstd_val - poev.ten_percent_cap) as frz_assessed,
       (poev.imprv_hstd_val +  poev.land_hstd_val - poev.ten_percent_cap) - (poev.assessed_val - poev.taxable_val) as frz_taxable,
       IsNull(tax_rate.m_n_o_tax_pct, 0),
       IsNull(tax_rate.i_n_s_tax_pct, 0),
       IsNull(tax_rate.prot_i_n_s_tax_pct, 0),
       pe.freeze_yr,
       pe.freeze_ceiling,
	   poev.ptd_actual_tax
from prop_owner_entity_val poev with (nolock),
     property_exemption pe with (nolock),
     tax_rate with (nolock),
     ptd_supp_assoc psa with (nolock),
     entity with (nolock)
where pe.prop_id = poev.prop_id
and   pe.owner_id = poev.owner_id
and   pe.sup_num  = poev.sup_num
and   pe.owner_tax_yr = poev.sup_yr
and   poev.entity_id = tax_rate.entity_id
and   poev.sup_yr    = tax_rate.tax_rate_yr
and   (pe.exmpt_type_cd = 'OV65' or pe.exmpt_type_cd = 'OV65S' or pe.exmpt_type_cd = 'DP')
and   pe.use_freeze is not null and pe.use_freeze = 'T'
and   pe.freeze_ceiling is not null
and   psa.prop_id = poev.prop_id
and   psa.sup_num = poev.sup_num
and   psa.sup_yr  = poev.sup_yr
and   tax_rate.entity_id = entity.entity_id
and   entity.entity_type_cd = 'S'
and   psa.sup_yr  = @input_tax_yr

open ptd_freeze
fetch next from ptd_freeze into @prop_id, @owner_id, @entity_id, @sup_num, @sup_yr,
				 @frz_assessed, @frz_taxable, @m_n_o_tax_pct, @i_n_s_tax_pct, @prot_i_n_s_tax_pct,
				 @freeze_yr, @freeze_ceiling, @curr_ptd_actual_tax

while (@@FETCH_STATUS = 0)
begin
	
	set @bill_freeze_m_n_o = @frz_taxable/100 *  @m_n_o_tax_pct
	set @bill_freeze_i_n_s = @frz_taxable/100 *  @i_n_s_tax_pct

	/* check to see if current taxes are greater then freeze taxes if so, use the freeze values */

	if ((@freeze_ceiling < (@bill_freeze_m_n_o + @bill_freeze_i_n_s))
     	    and (convert(int, @freeze_yr) <= @input_tax_yr))
	begin
			set @bill_m_n_o = @freeze_ceiling * ((@m_n_o_tax_pct)/(@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct))
			set @bill_i_n_s = @freeze_ceiling * ((@i_n_s_tax_pct)/(@m_n_o_tax_pct + @i_n_s_tax_pct + @prot_i_n_s_tax_pct))

	end
	else
	begin
		set @bill_m_n_o = @bill_freeze_m_n_o
		set @bill_i_n_s = @bill_freeze_i_n_s

	end

	set @ptd_actual_tax = @bill_m_n_o + @bill_i_n_s

	
	if (@ptd_actual_tax < 0 or @ptd_actual_tax is null)
	begin
		set @ptd_actual_tax = 0
	end

	--if @ptd_actual_tax <> @curr_ptd_actual_tax  ***OLD VERSION
	if isnull(@ptd_actual_tax, 0) <> isnull(@curr_ptd_actual_tax, 0) --***NEW VERSION - HelpSTAR #12498, EricZ
	begin
		update prop_owner_entity_val
		set ptd_actual_tax = @ptd_actual_tax
		where prop_id   = @prop_id
		and   owner_id  = @owner_id
		and   sup_num   = @sup_num
		and   sup_yr    = @sup_yr
		and   entity_id = @entity_id
	end

	fetch next from ptd_freeze into @prop_id, @owner_id, @entity_id, @sup_num, @sup_yr,
				 @frz_assessed, @frz_taxable, @m_n_o_tax_pct, @i_n_s_tax_pct,@prot_i_n_s_tax_pct,
				 @freeze_yr, @freeze_ceiling, @curr_ptd_actual_tax
end

close ptd_freeze
deallocate ptd_freeze

		
		-- process transfer information
		/*if (@entity_type = 'S' and @use_transfer = 'T' and @use_frz = 'F')
		begin
			set @transfer_freeze_assessed	 = ((@improv_hstd_val + @land_hstd_val - @ten_percent_cap))
			set @transfer_freeze_taxable	 = @transfer_freeze_assessed - @entity_exmpt_local_amt - @entity_exmpt_state_amt
			set @transfer_entity_taxable	 = @transfer_freeze_taxable * (@transfer_pct/100)
			set @transfer_taxable_adjustment = @transfer_freeze_taxable - @transfer_entity_taxable
		end*/

GO

