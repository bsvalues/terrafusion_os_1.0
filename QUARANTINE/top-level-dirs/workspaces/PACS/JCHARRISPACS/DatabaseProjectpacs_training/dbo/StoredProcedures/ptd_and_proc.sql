







/****** Object:  Stored Procedure dbo.ptd_and_proc    Script Date: 10/4/2000 9:20:01 AM ******/
/****** Object:  Stored Procedure dbo.ptd_and_proc    Script Date: 6/26/2000 12:38:06 PM ******/
/****** History:
	Date		Who		Reason
	==========	====		=======================================
	09/11/2000	RAA		Make work with as of sup_num
*/


CREATE PROCEDURE ptd_and_proc
	@input_yr  		numeric(4),
	@input_cad_id_code 	char(3),
	@input_sup_num	int = 0

AS

--PTD Variables
declare @ptd_record_type		char(3)
declare @ptd_cad_id_code		char(3)


--Database Variables


--Stored Procedure Variables

--Initialize Variables
select @ptd_record_type 	= 'AND'
--select @ptd_cad_id_code 	= CONVERT(char(3), @input_cad_id_code)
select @ptd_cad_id_code	= @input_cad_id_code

--Begin

--First, delete everything in the ptd_and table
truncate table ptd_and

insert into ptd_and 	(
			record_type,
			cad_id_code,
			account_number,
			name_address_line_1,
			name_address_line_2,
			name_address_line_3,
			name_address_line_4,
			city,
			state,
			zip_code,
			percent_ownership,
			fiduciary_indicator,
			owner_id_code
			)
select 			@ptd_record_type,
			@ptd_cad_id_code,
			cast(prop_id as varchar(25)) + '-' + cast(owner_id as varchar(25)),
			cast(file_as_name as varchar(30)),
			cast(addr_line1 as varchar(30)),
			cast(addr_line2 as varchar(30)),
			cast(addr_line3 as varchar(30)),
			cast(addr_city as varchar(24)),
			cast(addr_state as varchar(2)),
			cast(addr_zip as varchar(12)),
			pct_ownership,
			'N',
			owner_id
from ptd_and_vw
where owner_tax_yr = @input_yr
and sup_num in (select max(owner.sup_num) from owner where owner.sup_num <= @input_sup_num
		and owner.prop_id = ptd_and_vw.prop_id
		and owner.owner_tax_yr = @input_yr)

GO

