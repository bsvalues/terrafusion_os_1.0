

/****** Object:  Stored Procedure dbo.ptd_apl_proc    Script Date: 10/4/2000 9:20:01 AM ******/

/****** Object:  Stored Procedure dbo.ptd_apl_proc    Script Date: 6/26/2000 12:38:06 PM ******/
/****** History:
	Date		Who		Reason
	==========	====		=======================================
	09/11/2000	RAA		Allow as of sup_num to work
*/


CREATE PROCEDURE ptd_apl_proc

	@input_yr		int,
	@input_cad_id_code	char(3)

WITH RECOMPILE
AS

--PTD Variables
declare @ptd_record_type		char(3)
declare @ptd_cad_id_code		char(3)
declare @ptd_account_number		varchar(25)
declare @ptd_parcel_address		varchar(50)
declare @ptd_legal_description		varchar(200)
declare @ptd_prev_yr_mkt_value	numeric(11)
declare @ptd_most_recent_sale_price	numeric(11)
declare @ptd_date_of_sale		datetime
declare @ptd_new_prop_ind		char(1)
declare @ptd_verified_sale_by_CAD_ind	char(1)
declare @ptd_second_sale_date		datetime
declare @ptd_prop_id			int
declare @ptd_owner_id			int


--Database Variables for PTD_APL_VW
declare @FS_PTD_APL_VW		int
declare @prop_id			int
declare @legal_desc			varchar(255)
declare @situs_addr		varchar(255)
declare @prop_create_dt		datetime
declare @prev_appraised_val	numeric(9)
declare @new_prop_ind		varchar(1)
declare @account_number		varchar(25)
declare @prev_account_number	varchar(25)
declare @owner_id		int

--Database Variables for PTD_APL_SALES_VW
declare @FS_PTD_APL_SALES_VW	int
declare @sale_price		numeric(18)
declare @sale_date		datetime
declare @sl_conf_id		int

--Stored Procedure Variables

--Initialize Variables
set @ptd_record_type 	= 'APL'

--Begin
--First, delete everything in the ptd_apl table

set nocount on

truncate table ptd_apl

--select @ptd_cad_id_code = CONVERT(char(3), @input_cad_id_code)
set @ptd_cad_id_code = @input_cad_id_code




--Now loop through the ptd_apl and populate the rest of the ptd_apl table

DECLARE PTD_APL CURSOR FORWARD_ONLY
FOR select 
		cast( ptd_apl_vw.prop_id as varchar(25)) + '-' + cast( ptd_apl_vw.owner_id as varchar(25)),
		CAST(isnull(legal_desc,'') as varchar(255)) as legal_desc,
		cast(REPLACE(situs_display, CHAR(13) + CHAR(10), ' ') as varchar(150)) as situs_addr,
		case year(prop_create_dt) when @input_yr then 'Y' else 'N' end as new_prop_ind,
		cast(isnull(prev_appraised_val,0) as numeric(9)) as prev_appraised_val,
		sl_conf_id,
		sl_price,
		sl_dt,
		 ptd_apl_vw.prop_id,
		 ptd_apl_vw.owner_id
	from ptd_apl_vw, ptd_supp_assoc
	where  ptd_apl_vw.owner_tax_yr = @input_yr
	and    ptd_apl_vw.prop_id = ptd_supp_assoc.prop_id
	and    ptd_apl_vw.sup_num = ptd_supp_assoc.sup_num
	and    ptd_apl_vw.owner_tax_yr = ptd_supp_assoc.sup_yr
	and     ptd_apl_vw.prop_inactive_dt is null
	order by  ptd_apl_vw.prop_id,  ptd_apl_vw.owner_id,  ptd_apl_vw.sl_dt desc

OPEN PTD_APL

FETCH NEXT FROM PTD_APL into 	@account_number,
					@legal_desc,
					@situs_addr,
					@new_prop_ind,
					@prev_appraised_val,
					@sl_conf_id,
					@sale_price,
					@sale_date,
					@prop_id,
					@owner_id
				
select @FS_PTD_APL_VW = @@FETCH_STATUS


while (@FS_PTD_APL_VW = 0)
begin

	set @ptd_account_number = @account_number
	set @ptd_legal_description = @legal_desc
	set @ptd_parcel_address = @situs_addr
	set @ptd_new_prop_ind = @new_prop_ind
	set @ptd_prev_yr_mkt_value = @prev_appraised_val
	set @ptd_most_recent_sale_price = @sale_price
	set @ptd_date_of_sale = @sale_date

	if (@sl_conf_id is not null)
	begin
		set @ptd_verified_sale_by_CAD_ind = 'Y'
	end
	else
	begin
		set @ptd_verified_sale_by_CAD_ind = 'N'
	end

	set @prev_account_number = @account_number
	set @ptd_prop_id = @prop_id
	set @ptd_owner_id = @owner_id

	FETCH NEXT FROM PTD_APL into 	@account_number,
						@legal_desc,
						@situs_addr,
						@new_prop_ind,
						@prev_appraised_val,
						@sl_conf_id,

						@sale_price,
						@sale_date,
						@prop_id,
						@owner_id
	
	if (@@FETCH_STATUS = 0)
	begin
		if (@account_number = @prev_account_number)
		begin
			set @ptd_second_sale_date = @sale_date
		end
		else
		begin
			set @ptd_second_sale_date = null
		end

		insert into ptd_apl	(
					record_type,
					cad_id_code,
					account_number,
					parcel_address,
					legal_description,
					prev_yr_cad_mkt_val,
					most_recent_sale_price,
					date_of_sale,
					new_prop_ind,
					verified_sale_by_CAD_ind,
					second_sale_date,
					prop_id,
					owner_id
					)

		values			(
					@ptd_record_type,
					@ptd_cad_id_code,
					@ptd_account_number,
					CAST(@ptd_parcel_address as varchar(50)),
					CAST(@ptd_legal_description as varchar(200)),
					@ptd_prev_yr_mkt_value,
					@ptd_most_recent_sale_price,
					@ptd_date_of_sale,

					@ptd_new_prop_ind,
					@ptd_verified_sale_by_CAD_ind,
					@ptd_second_sale_date,
					@ptd_prop_id,
					@ptd_owner_id
					)

		while (@@FETCH_STATUS = 0 and @account_number = @prev_account_number)
		begin					
			FETCH NEXT FROM PTD_APL into 	@account_number,
								@legal_desc,
								@situs_addr,
								@new_prop_ind,
								@prev_appraised_val,
								@sl_conf_id,
								@sale_price,
								@sale_date,
								@prop_id,
								@owner_id
		end
	end

	/*
	 * This is the last property, just insert it if it's different from the previous
	 * one.
	 */

	else
	begin
		set @ptd_second_sale_date = null

		insert into ptd_apl	(
					record_type,
					cad_id_code,
					account_number,
					parcel_address,
					legal_description,
					prev_yr_cad_mkt_val,
					most_recent_sale_price,
					date_of_sale,
					new_prop_ind,
					verified_sale_by_CAD_ind,
					second_sale_date,
					prop_id,
					owner_id
					)

		values			(
					@ptd_record_type,
					@ptd_cad_id_code,
					@ptd_account_number,
					CAST(@ptd_parcel_address as varchar(50)),
					CAST(@ptd_legal_description as varchar(200)),
					@ptd_prev_yr_mkt_value,
					@ptd_most_recent_sale_price,
					@ptd_date_of_sale,

					@ptd_new_prop_ind,
					@ptd_verified_sale_by_CAD_ind,
					@ptd_second_sale_date,
					@ptd_prop_id,
					@ptd_owner_id
					)
	end

	select @FS_PTD_APL_VW = @@FETCH_STATUS
end

CLOSE PTD_APL
DEALLOCATE PTD_APL



update ptd_apl set legal_description = replace(legal_description, '
', ' ') where legal_description like '%
%'

GO

