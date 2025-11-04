
CREATE    procedure WAUpdateApprNoticeCaptureValues

@input_yr	 	numeric(4),
@input_prop_type 	varchar(5),
@input_pacs_user_id	int,
@input_action		varchar(1)

as



if object_id('tempdb..#cap_vals_properties') is not null
drop table #cap_vals_properties

select prop_id, prop_type_cd into #cap_vals_properties
from property where prop_type_cd = @input_prop_type

exec WAUpdateApprNoticeCaptureValuesByQuery @input_yr, @input_pacs_user_id, @input_action


-- record that we did a mass ARB capture or undo-capture by property type
if (@input_action = 'C')
begin

	insert into appr_notice_capture_values
	(
		prop_val_yr ,
		prop_type_cd ,
		date_set , 
		pacs_user_id 
	)
	values
	(
		@input_yr,
		@input_prop_type,
		GetDate(),
		@input_pacs_user_id
	)

end
else
begin

	delete from appr_notice_capture_values
	where prop_val_yr = @input_yr
	and   prop_type_cd = @input_prop_type

end


-- ** 'End csp.WAUpdateApprNoticeCaptureValues.sql'



-- ** 'End 1_00_00_47_procs_wash_edvantis.sql'

set ansi_nulls on
set ansi_padding on
set ansi_warnings on
set arithabort on
set concat_null_yields_null on
set quoted_identifier on
set numeric_roundabort off
set nocount on

GO

