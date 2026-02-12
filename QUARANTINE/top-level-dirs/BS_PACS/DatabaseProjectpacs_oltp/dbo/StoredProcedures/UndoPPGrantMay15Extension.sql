

create procedure dbo.UndoPPGrantMay15Extension
	@input_year numeric(4,0),
	@input_processed_dt datetime
as

update
	pp_rendition_tracking
set
	extension1 = 'NR',
	extension1_processed_dt = null,
	extension1_comment = ''
where
	prop_val_yr = @input_year
and	isnull(extension1, 'NR') = 'SG'
and	extension1_processed_dt = @input_processed_dt

GO

