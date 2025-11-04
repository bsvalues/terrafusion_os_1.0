
create procedure UpdatePropertyOwnership 

@input_prop_id		int,
@input_sup_num 		int,
@input_yr		numeric(4),
@input_new_owner_id	int

as

-- wrap this in a transaction
set nocount on
begin try
begin tran


declare @curr_owner_id	int

select top 1 @curr_owner_id = owner_id
from owner with (nolock)
where prop_id = @input_prop_id
and   sup_num = @input_sup_num
and   owner_tax_yr = @input_yr

declare @udi_parent_prop_id int

select top 1 @udi_parent_prop_id = udi_parent_prop_id
from property_val with (nolock)
where prop_id = @input_prop_id
and sup_num = @input_sup_num
and prop_val_yr = @input_yr

select @udi_parent_prop_id = isnull(@udi_parent_prop_id, -1)

--need to delete existing user_owner record before update
--new record will be generated when it is first needed

delete from user_owner
where prop_id in (@input_prop_id, @udi_parent_prop_id)
and   sup_num = @input_sup_num
and   owner_tax_yr = @input_yr
and   owner_id = @curr_owner_id

update owner set owner_id = @input_new_owner_id
where prop_id in (@input_prop_id, @udi_parent_prop_id)
and   sup_num = @input_sup_num
and   owner_tax_yr = @input_yr
and   owner_id = @curr_owner_id

UPDATE  imprv_owner_assoc SET owner_id = @input_new_owner_id 
WHERE  	prop_id in (@input_prop_id, @udi_parent_prop_id) AND
	sup_num = @input_sup_num AND
	prop_val_yr = @input_yr AND 
	owner_id = @curr_owner_id

UPDATE  land_owner_assoc SET owner_id = @input_new_owner_id 
WHERE  	prop_id in (@input_prop_id, @udi_parent_prop_id) AND
	sup_num = @input_sup_num AND
	prop_val_yr = @input_yr AND 
	owner_id = @curr_owner_id

UPDATE  pers_prop_owner_assoc SET owner_id = @input_new_owner_id 
WHERE  	prop_id in (@input_prop_id, @udi_parent_prop_id) AND
	sup_num = @input_sup_num AND
	prop_val_yr = @input_yr AND 
	owner_id = @curr_owner_id

update agent_assoc set owner_id = @input_new_owner_id
where prop_id in (@input_prop_id, @udi_parent_prop_id)
and   owner_id = @curr_owner_id
and   owner_tax_yr = @input_yr

/*
 * Can't update [property_exemption].owner_id because [property_exemption_income*] tables have FK constraints on it
 */

insert [dbo].[property_exemption]
(
	prop_id,
	owner_id,
	exmpt_tax_yr,
	owner_tax_yr,
	prop_type_cd,
	exmpt_type_cd,
	applicant_nm,
	birth_dt,
	spouse_birth_dt,
	prop_exmpt_dl_num,
	prop_exmpt_ss_num,
	effective_dt,
	termination_dt,
	apply_pct_owner,
	sup_num,
	effective_tax_yr,
	qualify_yr,
	sp_date_approved,
	sp_expiration_date,
	sp_comment,
	sp_value_type,
	sp_value_option,
	absent_flag,
	absent_expiration_date,
	absent_comment,
	deferral_date,
	apply_local_option_pct_only,
	apply_no_exemption_amount,
	exmpt_subtype_cd,
	exemption_pct,
	combined_disp_income,
	exempt_qualify_cd,
	review_request_date,
	review_status_cd,
	review_last_year,
	dor_value_type,
	dor_exmpt_amount,
	dor_exmpt_percent
)
select
	prop_id,
	@input_new_owner_id,
	exmpt_tax_yr,
	owner_tax_yr,
	prop_type_cd,
	exmpt_type_cd,
	applicant_nm,
	birth_dt,
	spouse_birth_dt,
	prop_exmpt_dl_num,
	prop_exmpt_ss_num,
	effective_dt,
	termination_dt,
	apply_pct_owner,
	sup_num,
	effective_tax_yr,
	qualify_yr,
	sp_date_approved,
	sp_expiration_date,
	sp_comment,
	sp_value_type,
	sp_value_option,
	absent_flag,
	absent_expiration_date,
	absent_comment,
	deferral_date,
	apply_local_option_pct_only,
	apply_no_exemption_amount,
	exmpt_subtype_cd,
	exemption_pct,
	combined_disp_income,
	exempt_qualify_cd,
	review_request_date,
	review_status_cd,
	review_last_year,
	dor_value_type,
	dor_exmpt_amount,
	dor_exmpt_percent
from [dbo].[property_exemption]
where prop_id in (@input_prop_id, @udi_parent_prop_id)
and owner_id = @curr_owner_id
and owner_tax_yr = @input_yr
and exmpt_tax_yr = @input_yr
and sup_num = @input_sup_num

insert [dbo].[property_exemption_income]
(
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	prop_id,
	owner_id,
	exmpt_type_cd,
	inc_id,
	active,
	income_year,
	created_date,
	created_by_id,
	tax_return,
	deny_exemption,
	comment
)
select
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	prop_id,
	@input_new_owner_id,
	exmpt_type_cd,
	inc_id,
	active,
	income_year,
	created_date,
	created_by_id,
	tax_return,
	deny_exemption,
	comment
from [dbo].[property_exemption_income]
where prop_id in (@input_prop_id, @udi_parent_prop_id)
and exmpt_tax_yr = @input_yr
and owner_tax_yr = @input_yr
and sup_num = @input_sup_num
and owner_id = @curr_owner_id

insert [dbo].[property_exemption_income_detail]
(
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	prop_id,
	owner_id,
	exmpt_type_cd,
	inc_id,
	inc_detail_id,
	id_flag,
	code,
	amount
)
select
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	prop_id,
	@input_new_owner_id,
	exmpt_type_cd,
	inc_id,
	inc_detail_id,
	id_flag,
	code,
	amount
from [dbo].[property_exemption_income_detail]
where prop_id in (@input_prop_id, @udi_parent_prop_id)
and sup_num = @input_sup_num
and owner_tax_yr = @input_yr
and exmpt_tax_yr = @input_yr
and owner_id = @curr_owner_id

insert [dbo].[property_exemption_dor_detail]
(
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	prop_id,
	owner_id,
	exmpt_type_cd,
	item_type,
	item_id,
	value_type,
	exmpt_amount,
	exmpt_percent
)
select
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	prop_id,
	@input_new_owner_id,
	exmpt_type_cd,
	item_type,
	item_id,
	value_type,
	exmpt_amount,
	exmpt_percent
from [dbo].[property_exemption_dor_detail]
where prop_id in (@input_prop_id, @udi_parent_prop_id)
and sup_num = @input_sup_num
and owner_tax_yr = @input_yr
and exmpt_tax_yr = @input_yr
and owner_id = @curr_owner_id

update property_freeze set owner_id = @input_new_owner_id
where prop_id in (@input_prop_id, @udi_parent_prop_id)
and sup_num = @input_sup_num
and owner_tax_yr = @input_yr
and owner_id = @curr_owner_id

-- It doesn't appear that these deletes aren't necessary, since we're updating
-- existing records with the new owner_id, rather than creating new records
-- with the new owner_id.  However, we'll keep them just in case. We aren't
-- adding @udi_parent_prop_id to the where clause on the deletes, since a
-- UDI parent property could have multiple owner records associated with its'
-- prop_id.

delete from owner
where prop_id = @input_prop_id
and   sup_num = @input_sup_num
and   owner_tax_yr = @input_yr
and   owner_id <> @input_new_owner_id

DELETE FROM imprv_owner_assoc 
WHERE  	prop_id = @input_prop_id AND
	sup_num = @input_sup_num AND
	prop_val_yr = @input_yr AND 
	owner_id = @curr_owner_id

DELETE FROM land_owner_assoc 
WHERE  	prop_id = @input_prop_id AND
	sup_num = @input_sup_num AND
	prop_val_yr = @input_yr AND 
	owner_id = @curr_owner_id

DELETE FROM pers_prop_owner_assoc 
WHERE  	prop_id = @input_prop_id AND
	sup_num = @input_sup_num AND
	prop_val_yr = @input_yr AND 
	owner_id = @curr_owner_id

delete from agent_assoc 
where prop_id = @input_prop_id
and   owner_tax_yr = @input_yr
and   owner_id<> @input_new_owner_id

-- These deletes are necessary as inserts into these and related tables are done above for the new owner id
-- so these deletes will remove the records for the curr owner id

delete from [dbo].[property_exemption_income]
where prop_id = @input_prop_id
and sup_num = @input_sup_num
and owner_tax_yr = @input_yr
and owner_id <> @input_new_owner_id

delete from [dbo].[property_exemption_dor_detail]
where prop_id = @input_prop_id
and sup_num = @input_sup_num
and owner_tax_yr = @input_yr
and owner_id <> @input_new_owner_id

delete from [dbo].[property_exemption]
where prop_id = @input_prop_id
and   sup_num = @input_sup_num
and   owner_tax_yr = @input_yr
and   owner_id <> @input_new_owner_id

delete from property_freeze
where prop_id = @input_prop_id
and sup_num = @input_sup_num
and owner_tax_yr = @input_yr
and owner_id <> @input_new_owner_id


-- commit the transaction if there were no errors
commit tran
end try

-- if an exception was caught, rollback and raise it again
begin catch
	if @@trancount > 0 rollback tran;

	declare @ErrorMessage nvarchar(4000);
	declare @ErrorSeverity int;
	declare @ErrorState int;

	select @ErrorMessage = error_message(),
		@ErrorSeverity = error_severity(),
		@ErrorState = error_state()

	raiserror(@ErrorMessage, @ErrorSeverity, @ErrorState)
end catch

GO

