

CREATE PROCEDURE Appr_Val_Cert_Insrt_exemptions 
	@pacs_user_id_ int,
	@prop_id int,    
	@entity_id int,
	@owner_id int,
	@sup_num int,
	@owner_tax_yr int
AS 

--temps
DECLARE 
	@prop_val_yr int,  
	@exempt_type char(5),
	@entity_name varchar(60),
	@amount  int,
	@freeze_ceiling_MK numeric (14,2),
	@freeze_dt int
   
--set the cursor to retrieve all the entities
DECLARE exemptions_cursor CURSOR
FOR
SELECT
	exmpt_type_cd,
	state_amt + local_amt
FROM
	property_entity_exemption_preview with (nolock)
WHERE
	pacs_user_id = @pacs_user_id_
AND	prop_id = @prop_id
AND	owner_id = @owner_id
AND	entity_id = @entity_id



OPEN exemptions_cursor
FETCH NEXT FROM exemptions_cursor
INTO
	@exempt_type,
	@amount

WHILE (@@FETCH_STATUS = 0)
BEGIN

	-- select the freeze date and amount
	select
		@freeze_ceiling_MK = freeze_ceiling,
		@freeze_dt = freeze_yr 
	from
		property_freeze with (nolock)
	where
		prop_id = @prop_id
	and	owner_id = @owner_id
	AND	exmpt_tax_yr = @owner_tax_yr
	AND	owner_tax_yr = @owner_tax_yr
	AND	sup_num = @sup_num
	AND	entity_id = @entity_id
	AND	exmpt_type_cd = @exempt_type
	AND	use_freeze = 'T'


	INSERT INTO value_cert_notice_entity_exempt
	(
		pacs_user_id,
		prop_id,
		sup_num,
		owner_id,
		entity_id,
		exemp_type_id,
		freeze_ceil_mk,
		freeze_dt,
		amount,
		prop_val_yr
	)
	VALUES
	(
		@pacs_user_id_,
		@prop_id,
		@sup_num,
		@owner_id,
		@entity_id,
		@exempt_type,
		@freeze_ceiling_MK,
		@freeze_dt,
		@amount,
		@owner_tax_yr
	)
 
 	set @freeze_ceiling_MK = NULL
	set @freeze_dt = NULL

	FETCH NEXT FROM exemptions_cursor
	INTO
		@exempt_type,
		@amount
END

CLOSE exemptions_cursor
DEALLOCATE exemptions_cursor

GO

