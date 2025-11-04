

CREATE    procedure UpdateApprNoticeCaptureValues

@input_yr	 	numeric(4),
@input_prop_type 	varchar(5),
@input_pacs_user_id	int,
@input_action		varchar(1)

as

-- 3/19/06  Sam
-- Mass capture needs to take UDI parents and children into account now.  It seemed
-- simplest to have this procedure call the query version, and do everything there.


if object_id('tempdb..#cap_vals_properties') is not null
drop table #cap_vals_properties

select prop_id, prop_type_cd into #cap_vals_properties
from property where prop_type_cd = @input_prop_type

exec UpdateApprNoticeCaptureValuesByQuery @input_yr, @input_pacs_user_id, @input_action


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

GO

