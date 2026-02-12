
create procedure GISUpdateGeocode

	@prop_id int,
	@new_geo_id varchar(50)

as

set nocount on

update property
set geo_id = @new_geo_id
where prop_id = @prop_id

GO

