

































CREATE                        procedure IncomeRecalcPF
@input_rounding_factor	numeric(1),
@show_detail	char(1),		-- if 'T', then indicates calling from client app, so display data
@gba		numeric(14,0) OUTPUT,		-- gross building area
@nra		numeric(14,0) OUTPUT,		-- net rentable area
@la		numeric(14,0) OUTPUT,  	-- leased area
@va		numeric(14,0) OUTPUT, 	-- vacant area
@be		numeric(5,2)  OUTPUT, 	-- building efficiency
@or      	numeric(5,2)  OUTPUT, 	-- occupancy rate
@vr		numeric(5,2)  OUTPUT, 	-- vacancy rate
@la_rate	numeric(14,2) OUTPUT,		-- leased rate
@va_rate	numeric(14,2) OUTPUT,		-- vacancy rate
@li		numeric(14,0) OUTPUT,	-- leased income
@vi      	numeric(14,0) OUTPUT,	-- vacant income
@gpi		numeric(14,0) OUTPUT,	-- gross potential income
@gpi_vr		numeric(5,2)  OUTPUT,		-- gpi vacancy rate
@gpi_vi		numeric(14,0) OUTPUT,	-- gpi vacancy income
@gpi_clr	numeric(5,2)  OUTPUT,		-- collection loss rate
@gpi_cli	numeric(14,0) OUTPUT,	-- collection loss income

@gpi_rer	numeric(5,2)  output,	-- reimbursed expense rate
@gpi_re		numeric(14,0) OUTPUT,	-- reimbursed expense
@gpi_sir	numeric(5,2) output,   -- secondary income rate
@gpi_si		numeric(14,0) OUTPUT,	-- secondary income

@egi		numeric(14,0) OUTPUT,	-- effective gross income
@exp_oei	numeric(14,0) OUTPUT, 		-- operating expense income
@exp_taxi	numeric(14,2) OUTPUT,	-- real estate taxes income
@exp_mgmtr	numeric(5,2)  OUTPUT,		-- management rate
@exp_mgmti	numeric(14,0) OUTPUT,   -- management income
@exp_rrr	numeric(5,2)   OUTPUT,           -- reserve for replacement rate
@exp_rri	numeric(14,0) OUTPUT,   -- reserve for replacement income
@exp_tir	numeric(5,2)   OUTPUT,		-- tenant improvement rate
@exp_tii	numeric(14,0) OUTPUT,   -- tenant improvement income
@exp_lcr	numeric(5,2)   OUTPUT,		-- leasing costs rate
@exp_lci	numeric(14,0) OUTPUT,   -- leasing costs income
@exp		numeric(14,0) OUTPUT,   -- total expenses
@noi		numeric(14,0) OUTPUT,   -- net operating income
@cap_rate_r	numeric(5,2)   OUTPUT,		-- cap rate rate
@cap_rate_i	numeric(14,0) OUTPUT,   -- cap rate income
@excess_land	numeric(14,0)  OUTPUT,		-- excess land value
@pers_value	numeric(14,0)  OUTPUT,		-- personal property value
@ind_value	numeric(14,0) OUTPUT,   -- indicated value

-- rsf = rate per sqft
@gpi_rsf	numeric(14,2) OUTPUT,   -- gpi rsf
@gpi_v_rsf	numeric(14,2) OUTPUT,   -- gpi vacancy rsf
@gpi_cl_rsf     numeric(14,2) OUTPUT,   -- gpi collection loss rsf
@gpi_re_rsf	numeric(14,2) OUTPUT,   -- gpi reimbursed expense rsf
@gpi_si_rsf	numeric(14,2) OUTPUT,   -- gpi secondary income rsf
@egi_rsf	numeric(14,2) OUTPUT,   -- egi rsf
@egi_pct_rev	numeric(5,2)  OUTPUT,   -- egi percent of revenue
@exp_oe_rsf	numeric(14,2) OUTPUT,   -- exp operating expense rsf
@exp_tax_rsf	numeric(14,2) OUTPUT,   -- exp taxes rsf
@exp_mgmt_rsf	numeric(14,2) OUTPUT, 	-- exp management rsf
@exp_rr_rsf	numeric(14,2) OUTPUT,	-- exp reserver replacement rsf
@exp_ti_rsf	numeric(14,2) OUTPUT, 	-- exp tenant improvement rsf
@exp_lc_rsf	numeric(14,2) OUTPUT,   -- exp leasing costs rsf
@exp_rsf	numeric(14,2) OUTPUT,   -- exp total rsf
@exp_pct_rev	numeric(5,2)  OUTPUT,	-- exp percent of revenue
@noi_rsf	numeric(14,2) OUTPUT,   -- net operating income rsf
@noi_pct_rev	numeric(5,2)  OUTPUT,    -- net operating income percent of revenue

-- pf inputs
@input_pf_ocr 		numeric(5, 2)  OUTPUT ,
@input_pf_mgmtr 	numeric(5, 2)  OUTPUT ,
@input_pf_exp_rsf 	numeric(14, 2) OUTPUT ,
@input_pf_si_rsf	numeric(14, 2)  OUTPUT ,
@input_pf_tir 		numeric(5, 2)  OUTPUT ,
@input_pf_rrr 		numeric(5, 2)  OUTPUT ,
@input_pf_capr 		numeric(5, 2)  OUTPUT ,
@input_pf_lease_rsf 	numeric(14, 2) OUTPUT ,
@input_pf_VARate	numeric(14, 2) OUTPUT ,
@input_pf_clr		numeric(5, 2) OUTPUT ,
@input_pf_rer		numeric(5, 2) OUTPUT, 
@input_pf_lcr		numeric(5, 2) OUTPUT ,

@income_id	int,
@sup_num	int,
@income_yr	int,
@tax_override	char(1),
@leaseup_costs	numeric(14,0),
@ind_rsf	numeric(14,2) output,
@ocr_rsf	numeric(14,2) output,
@ind_runit  	numeric(14,2) output,	
@ocr_runit  	numeric(14,2) output,
@num_units	numeric(14,0) output

as


-- set pro format inputs 

set @la_rate 	 = @input_pf_lease_rsf
set @va_rate     = @input_pf_VARate
set @or	     	 = @input_pf_ocr

set @gpi_clr	 = @input_pf_clr
set @gpi_rer	 = @input_pf_rer
set @gpi_si_rsf  = @input_pf_si_rsf
set @exp_tir     = @input_pf_tir
set @exp_mgmtr   = @input_pf_mgmtr
set @exp_rrr     = @input_pf_rrr
set @cap_rate_r  = @input_pf_capr
set @exp_oe_rsf  = @input_pf_exp_rsf
set @exp_lcr	 = @input_pf_lcr

set @vr 	 = 100 - @input_pf_ocr
set @gpi_vr	= 100 - @input_pf_ocr


declare @recalc_count 	int
declare @num_recalc	int

set @recalc_count = 0

if (@tax_override = 'T')
begin
	set @num_recalc = 1
end
else
begin	
	set @num_recalc = 2
end

-- we have to recalculate the property twice... The first time calculates the indicated value
-- without tax, the second time includes the tax

while (@recalc_count < 6)
begin
	if ((@recalc_count = 0) and (@tax_override = 'F'))
	begin
		set @exp_taxi = 0
	end

	-- building efficiency
	
	if ((@gba > 0) and 
	    (@nra/@gba * 100) <= 100)
	begin
		set @be = (@nra/@gba * 100)
	end
	else
	begin
		set @be = 0
	end
	
	
	-- leased area 
	set @la  = @nra * (@or/100)
	
	-- vacant area
	set @va  = @nra * (@vr/100)
	
	
	
	-- leased income
	set @li  = @la  * @la_rate
	
	-- vacancy income 
	set @vi  = @va * @va_rate
	
	-- gross potential income
	set @gpi = @li + @vi
	
	-- gpi vacancy income
	set @gpi_vi  = (@gpi_vr/100) * @gpi
	
	-- gpi collection loss
	set @gpi_cli = (@gpi_clr/100) * @gpi
	
	
	-- gpi reimbursed expense
	set @gpi_re  = (@gpi_rer/100) * @gpi
	
	-- gpi secondary income
	set @gpi_si  = @gpi_si_rsf * @nra
	
	if (@gpi > 0)
	begin
		set @gpi_sir = @gpi_si/@gpi * 100
	end
	else
	begin
		set @gpi_sir = 0
	end

	
	-- effective gross income
	set @egi = @gpi - @gpi_vi - @gpi_cli + @gpi_re + @gpi_si
	
	
	/* operating expense */
	set @exp_oei = @exp_oe_rsf * @nra
	
	-- management 
	set @exp_mgmti = (@exp_mgmtr/100) * @egi
	
	-- reserve for replacement
	set @exp_rri = (@exp_rrr/100) * @egi
	
	-- tenant improvement
	set @exp_tii = (@exp_tir/100) * @egi	
	
	-- leasing costs
	set @exp_lci = (@exp_lcr/100) * @egi

-- total expenses
	if (@tax_override = 'F')
	begin
		if ((@recalc_count < 6) and (@tax_override = 'F'))
		begin
			-- go ahead and calculate the tax
	
			exec IncomeCalculateTax @income_id, @sup_num, @income_yr, @cap_rate_i, @exp_taxi output
		
			set @exp = @exp_oei + @exp_taxi + @exp_mgmti + @exp_rri + @exp_tii + @exp_lci
		
		end 
	end
	else
	begin
		set @exp     = @exp_oei + @exp_taxi + @exp_mgmti + @exp_rri + @exp_tii + @exp_lci
	end

		

	-- net operating income
	set @noi = @egi - @exp
	
	-- cap rate income
	if (@cap_rate_r > 0)
	begin
		set @cap_rate_i = @noi/(@cap_rate_r/100)
	end
	else
	begin
		set @cap_rate_i = 0
	end
	
	-- indicated value
	set @ind_value = @cap_rate_i - @pers_value + @excess_land - @leaseup_costs

	if (@cap_rate_i = 0)
	begin
		set @ind_value = 0
	end
	
	-- apply rounding factor
	set @ind_value = round(@ind_value, @input_rounding_factor)
	
	/******************************************/
	/* calculate the rsf & percent of revenue */
	/******************************************/
	 -- gpi rsf
	if (@nra > 0)
	begin
		set @gpi_rsf      = @gpi/@nra	
		set @gpi_v_rsf    = @gpi_vi/@nra
		set @gpi_cl_rsf	  = @gpi_cli/@nra
		set @gpi_re_rsf	  = @gpi_re/@nra
		set @gpi_si_rsf	  = @gpi_si/@nra
		set @egi_rsf	  = @egi/@nra
		set @egi_pct_rev  = 100		
		set @exp_tax_rsf  = @exp_taxi/@nra
		set @exp_mgmt_rsf = @exp_mgmti/@nra
		set @exp_rr_rsf	  = @exp_rri/@nra
		set @exp_ti_rsf	  = @exp_tii/@nra
		set @exp_lc_rsf	  = @exp_lci/@nra
		set @exp_rsf	  = @exp/@nra
		set @noi_rsf	  = @noi/@nra
		set @ind_rsf	  = @ind_value/@nra

		set @ocr_rsf	  = @cap_rate_i/@nra
		
	end
	else
	begin
		set @gpi_rsf 	  = 0	
		set @gpi_v_rsf	  = 0
		set @gpi_cl_rsf	  = 0
		set @gpi_re_rsf	  = 0
		set @gpi_si_rsf	  = 0
		set @egi_rsf	  = 0
		set @egi_pct_rev  = 0	
		set @exp_tax_rsf  = 0	
		set @exp_mgmt_rsf = 0	
		set @exp_rr_rsf   = 0	
		set @exp_ti_rsf	  = 0
		set @exp_lc_rsf	  = 0
		set @exp_rsf      = 0	
		set @noi_rsf      = 0	
		set @ind_rsf	  = 0
		set @ocr_rsf	  = 0
	end

	if (@num_units > 0)
	begin
		set @ind_runit = @ind_value/@num_units
		set @ocr_runit = @cap_rate_i/@num_units
	end
	else
	begin
		set @ind_runit = 0
		set @ocr_runit = 0
	end
	
	
	if (@egi > 0)
	begin
		set @exp_pct_rev  = (@exp/@egi) * 100
		set @noi_pct_rev  = (@noi/@egi) * 100
	end
	else
	begin
		set @exp_pct_rev  = 0	
		set @noi_pct_rev  = 0	
	end

	
	set @recalc_count = @recalc_count + 1

end


-- send output to screen so pacs can pick it up:



if (@show_detail = 'T')
begin

	select 	pf_gba 	   = @gba,		
		pf_nra 	   = @nra,		
		pf_la  	   = @la,		
		pf_va  	   = @va,		
		pf_be  	   = @be,		
		pf_or  	   = @or,      	
		pf_vr  	   = @vr,		
		pf_la_rate = @la_rate,	
		pf_va_rate = @va_rate,	
		pf_li	   = @li,		
		pf_vi	   = @vi,      	
		pf_gpi	   = @gpi,		
		pf_gpi_vr  = @gpi_vr,		
		pf_gpi_vi  = @gpi_vi,		
		pf_gpi_clr = @gpi_clr,	
		pf_gpi_cli = @gpi_cli,	
		pf_gpi_rer = @gpi_rer,
		pf_gpi_re  = @gpi_re,
		pf_gpi_sir = @gpi_sir,		
		pf_gpi_si  = @gpi_si,		
		pf_egi     = @egi,
		pf_exp_oei   = @exp_oei,
		pf_exp_taxi  = @exp_taxi,	
		pf_exp_mgmtr = @exp_mgmtr,	
		pf_exp_mgmti = @exp_mgmti,
		pf_exp_rrr   = @exp_rrr,	
		pf_exp_rri   = @exp_rri,	
		pf_exp_tir   = @exp_tir,	
		pf_exp_tii   = @exp_tii,	
		pf_exp_lcr   = @exp_lcr,	
		pf_exp_lci   = @exp_lci,	
		pf_exp       = @exp,	
		pf_noi	     = @noi,		
		pf_capr	     = @cap_rate_r,	
		pf_capi	     = @cap_rate_i,	
		pf_pers	     = @pers_value,	
		pf_ind	     = @ind_value,

		pf_gpi_rsf      = @gpi_rsf,	
		pf_gpi_v_rsf    = @gpi_v_rsf,
		pf_gpi_cl_rsf   = @gpi_cl_rsf,
		pf_gpi_re_rsf   = @gpi_re_rsf,
		pf_gpi_si_rsf   = @gpi_si_rsf,
		pf_egi_rsf      = @egi_rsf,	
		pf_egi_pct_rev  = @egi_pct_rev,	
		pf_exp_oe_rsf   = @exp_oe_rsf,	
		pf_exp_tax_rsf  = @exp_tax_rsf,	
		pf_exp_mgmt_rsf = @exp_mgmt_rsf,	
		pf_exp_rr_rsf   = @exp_rr_rsf,	
		pf_exp_ti_rsf   = @exp_ti_rsf,	
		pf_exp_lc_rsf   = @exp_lc_rsf,	
		pf_exp_rsf      = @exp_rsf,	
		pf_exp_pct_rev  = @exp_pct_rev,	
		pf_noi_rsf      = @noi_rsf,	
		pf_noi_pct_rev  = @noi_pct_rev,

		pf_ind_rsf	= @ind_rsf,

		pf_ocr_rsf	= @ocr_rsf,
		pf_ind_runit	= @ind_runit,	
		pf_ocr_runit    = @ocr_runit,

		pf_num_units    = @num_units

	

end

GO

