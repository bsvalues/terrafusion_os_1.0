
CREATE PROCEDURE CopyShared
 @input_prop_id      int,
 @input_supp         int,
 @input_tax_yr       int,
 @input_new_prop_id  int,
 @input_new_supp     int,
 @input_new_tax_yr   int

AS

if exists (
	select * from shared_prop with (nolock)
	where pacs_prop_id = @input_prop_id
	and shared_year = @input_tax_yr
	and sup_num = @input_supp
)
begin  	/* start shared property supplement  */

	-- shared_prop
	-- Find shared_prop records for the old property and make copies of them for
	-- the new one.  Don't include records with a shared CAD code matching one
	-- that's assigned to the new property already.

	insert shared_prop with (rowlock)
	(
		pacs_prop_id,
		shared_year,
		shared_cad_code,
		shared_prop_id,
		tape_run_dt,
		tape_load_dt,
		link_dt,
		deed_dt,
		situs_city,
		legal,
		map_id,
		prev_tax_unfrozen,
		owner_name,
		owner_addr,
		owner_state,
		owner_zip,
		ag_use,
		special_exmpt_entity_cd,
		situs_street_num,
		dv_exemption_amount,
		cad_name,
		exmpt,
		deed_volume,
		ref_id,
		prorated_qualify_dt,
		prorated_remove_dt,
		arb_hearing_dt,
		oa_qual_dt,
		owner_addr2,
		owner_city,
		prorated_exmpt_flg,
		productivity_code,
		oa_remove_dt,
		situs_zip,
		situs_state,
		prev_tax_due,
		special_exmpt_amt,
		arb_indicator,
		deed_page,
		special_exemption_cd,
		situs_street,
		dba_name,
		new_hs_value,
		owner_addr_line1,
		owner_addr_line2,
		owner_addr_line3,
		cad_sup_num,
		cad_sup_code,
		num_imprv_segs,
		imprv_ptd_code,
		imprv_class,
		num_land_segs,
		land_ptd_code,
		size_acres,
		mineral_ptd_code,
		personal_ptd_code,
		entities,
		freeze_transfer_flag,
		transfer_pct,
		imprv_hs_val,
		imprv_non_hs_val,
		land_hs,
		land_non_hs,
		ag_market,
		timber_use,
		timber_market,
		market,
		appraised_val,
		cad_ten_percent_cap,		
		cad_assessed_val,
		arb_status,
		arb_dt,
		sales_dt,
		sales_price,
		appraiser,
		cad_sup_comment,
		exempt_prev_tax,
		exempt_prev_tax_unfrozen,
		ag_use_val,
		sup_num,
		multi_owner,
		imp_new_value,
		land_new_value,
		run_id,
		productivity_loss
	)
	select 
		@input_new_prop_id,
		@input_new_tax_yr, 
		shared_cad_code,
		shared_prop_id,
		tape_run_dt,
		tape_load_dt,
		link_dt,
		deed_dt,
		situs_city,
		legal,
		shared_prop.map_id,
		prev_tax_unfrozen,
		owner_name,
		owner_addr,
		owner_state,
		owner_zip,
		ag_use,
		special_exmpt_entity_cd,
		situs_street_num,
		dv_exemption_amount,
		cad_name,
		exmpt,
		deed_volume,
		ref_id,
		prorated_qualify_dt,
		prorated_remove_dt,
		arb_hearing_dt,
		oa_qual_dt,
		owner_addr2,
		owner_city,
		prorated_exmpt_flg,
		productivity_code,
		oa_remove_dt,
		situs_zip,
		situs_state,
		prev_tax_due,
		special_exmpt_amt,
		arb_indicator,
		deed_page,
		special_exemption_cd,
		situs_street,
		dba_name,
		new_hs_value,
		owner_addr_line1,
		owner_addr_line2,
		owner_addr_line3,
		cad_sup_num,
		cad_sup_code,
		num_imprv_segs,
		imprv_ptd_code,
		imprv_class,
		num_land_segs,
		land_ptd_code,
		size_acres,
		mineral_ptd_code,
		personal_ptd_code,
		entities,
		freeze_transfer_flag,
		transfer_pct,
		imprv_hs_val,
		imprv_non_hs_val,
		land_hs,
		land_non_hs,
		ag_market,
		timber_use,
		timber_market,
		market,
		appraised_val,
		cad_ten_percent_cap,		
		cad_assessed_val,
		arb_status,
		arb_dt,
		sales_dt,
		sales_price,
		appraiser,
		cad_sup_comment,
		exempt_prev_tax,
		exempt_prev_tax_unfrozen,
		ag_use_val,
		@input_new_supp,
		multi_owner,
		imp_new_value,
		land_new_value,
		run_id,
		productivity_loss

	from shared_prop with (nolock)
	where pacs_prop_id = @input_prop_id 
	and shared_year = @input_tax_yr 
	and sup_num = @input_supp

	and not shared_cad_code in (
		select shared_cad_code from shared_prop with (nolock)
		where pacs_prop_id = @input_new_prop_id
		and shared_year = @input_new_tax_yr
		and sup_num = @input_new_supp
	)


	-- shared_prop_value
	-- Copy all the shared property value records from the old property to the new.
	-- If there were duplicate CAD codes, the value records should all still be
	-- copied - they'll all be associated with the one new shared_prop record.

declare @shared_cad_code varchar(5)
declare @state_code varchar(5)
declare @shared_value numeric(14,0)
declare @acres numeric(14,4)
declare @ag_use_code varchar(5)
declare @record_type varchar(2)
declare @land_type_code char(5)
declare @homesite_flag char(1)
declare @ag_use_value numeric(14,0)
declare @hs_pct numeric(13,10)

declare @new_shared_value_id int
declare @new_shared_prop_id varchar(30)


declare shared_prop_value_cursor scroll cursor
for select
	shared_cad_code,
	state_code,
	shared_value,
	acres,
	ag_use_code,
	record_type,
	land_type_code,
	homesite_flag,
	ag_use_value,
	hs_pct
from shared_prop_value
where pacs_prop_id = @input_prop_id 
and shared_year = @input_tax_yr 
and sup_num = @input_supp

open shared_prop_value_cursor
fetch next from shared_prop_value_cursor into
	@shared_cad_code,
	@state_code,
	@shared_value,
	@acres,
	@ag_use_code,
	@record_type,
	@land_type_code,
	@homesite_flag,
	@ag_use_value,
	@hs_pct

while (@@FETCH_STATUS = 0)
begin
	-- get the next shared_value_id
	exec dbo.GetUniqueID 'shared_prop_value', @new_shared_value_id output, 1, 0

	-- get the correct shared_prop_id from the already copied base record
	select @new_shared_prop_id = shared_prop_id
	from shared_prop with (nolock)
	where pacs_prop_id = @input_new_prop_id 
	and shared_year = @input_new_tax_yr 
	and sup_num = @input_new_supp
	and shared_cad_code = @shared_cad_code

	-- insert this record
	insert shared_prop_value with (rowlock)
	(
		pacs_prop_id,
		shared_prop_id,
		shared_year,
		shared_cad_code,
		shared_value_id,
		state_code,
		shared_value,
		acres,
		ag_use_code,
		record_type,
		land_type_code,
		homesite_flag,
		ag_use_value,
		sup_num,
		hs_pct
	)
	values
	(
		@input_new_prop_id,
		@new_shared_prop_id,
		@input_new_tax_yr,
		@shared_cad_code,
		@new_shared_value_id,
		@state_code,
		@shared_value,
		@acres,
		@ag_use_code,
		@record_type,
		@land_type_code,
		@homesite_flag,
		@ag_use_value,
		@input_new_supp,
		@hs_pct
	)

fetch next from shared_prop_value_cursor into
	@shared_cad_code,
	@state_code,
	@shared_value,
	@acres,
	@ag_use_code,
	@record_type,
	@land_type_code,
	@homesite_flag,
	@ag_use_value,
	@hs_pct

end -- shared_prop_value loop

close shared_prop_value_cursor
deallocate shared_prop_value_cursor

end -- if any shared property 

GO

