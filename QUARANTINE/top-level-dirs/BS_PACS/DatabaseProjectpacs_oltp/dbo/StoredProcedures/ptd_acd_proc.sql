






/****** Object:  Stored Procedure dbo.ptd_acd_proc    Script Date: 10/4/2000 9:20:01 AM ******/

/****** Object:  Stored Procedure dbo.ptd_acd_proc    Script Date: 6/26/2000 12:38:06 PM ******/

CREATE PROCEDURE ptd_acd_proc
@input_yr		numeric(4,0),
@input_cad_id_code	char(3)

AS

--Declare PTD Variables
declare @ptd_record_type	varchar(3)
declare @ptd_account_number	varchar(25)
declare @prop_id		int
declare @prop_sic_cd		char(5)
declare @error_text		varchar(50)

--Initialize PTD Variables
select @ptd_record_type = 'ACD'

--Get rid of all the records in the ptd_acd table
delete from ptd_acd

--Get rid of all the ACD errors in the ptd_errors table
delete from ptd_errors where record_type = @ptd_record_type

--Go insert the rows
insert into ptd_acd
(
	record_type,
	cad_id_code,
	account_number,
	comptrollers_category_code,
	standard_industrial_code,
	sq_footage_improvement,
	number_of_bedrooms,
	number_of_bathrooms,
	cach_indicator,
	year_built,
	construction_type_class,
	number_of_stories,
	subdivision_hood_cd
)
select
@ptd_record_type,
@input_cad_id_code,
CAST(ptd_acd_vw.prop_id as varchar(20)) + '-' + CAST(ptd_acd_vw.owner_id as varchar(20)),
cast(ptd_acd_vw.state_cd as char(2)),
ISNUMERIC(ptd_acd_vw.prop_sic_cd),
IsNull(ptd_acd_vw.area, 0),
0,
0.0,
'N',
IsNull(ptd_acd_vw.year_built, 0),
NULL,
1.0,
ptd_acd_vw.hood_cd
from 	ptd_acd_vw
where 	ptd_acd_vw.year = @input_yr
and	ptd_acd_vw.prop_sic_cd is not null
and	ptd_acd_vw.prop_sic_cd <> 'N'

--Update the ptd_acd.standard_industrial_code...
update 	ptd_acd
set 	ptd_acd.standard_industrial_code = ptd_acd_vw.prop_sic_cd
from 	ptd_acd_vw
where 	ptd_acd.account_number = CAST(ptd_acd_vw.prop_id as varchar(20)) + '-' + CAST(ptd_acd_vw.owner_id as varchar(20))
and 	ptd_acd.standard_industrial_code = 1

--If any of the ptd_acd.standard_industrial_code's are 0, then report an error because the code is not numeric...
DECLARE SIC_CODE CURSOR FORWARD_ONLY
FOR	select 	ptd_acd_vw.prop_id,
		ptd_acd_vw.prop_sic_cd
	from 	ptd_acd_vw
	where 	ISNUMERIC(ptd_acd_vw.prop_sic_cd) = 0
	and	ptd_acd_vw.prop_sic_cd <> 'N'

OPEN SIC_CODE

FETCH NEXT FROM SIC_CODE into @prop_id, @prop_sic_cd

while (@@FETCH_STATUS = 0)
begin
	
	select @error_text = 'SIC Code : ('
	select @error_text = @error_text + CAST(@prop_sic_cd as varchar(5))
	select @error_text = @error_text + ') is not numeric.'

	exec ptd_insert_error @ptd_record_type, @prop_id, @prop_sic_cd, @error_text

	FETCH NEXT FROM SIC_CODE into @prop_id, @prop_sic_cd
end

CLOSE SIC_CODE
DEALLOCATE SIC_CODE

GO

