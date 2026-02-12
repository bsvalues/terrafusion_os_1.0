
create procedure sp_PacsfileUpdate
	@szServerSource varchar(255),
	@szEnvironmentSource varchar(255),
	@szServerDest varchar(255),
	@szEnvironmentDest varchar(255),
	@bDelete bit = 0
as

set nocount on

	declare @szSearch varchar(512)
	declare @szReplace varchar(512)

	set @szSearch = '\\' + @szServerSource + '\' + @szEnvironmentSource
	set @szReplace = '\\' + @szServerDest + '\' + @szEnvironmentDest

	update pacs_imaging
	set base_dir = replace(base_dir, @szSearch, @szReplace)

	update pacs_objects
	set base_dir = replace(base_dir, @szSearch, @szReplace)

	update pacs_system
	set
		distribution_path = replace(distribution_path, @szSearch, @szReplace),
		letter_path = replace(letter_path, @szSearch, @szReplace),
		export_path = replace(export_path, @szSearch, @szReplace),
		report_path = replace(report_path, @szSearch, @szReplace)

	update letter
	set letter_path = replace(letter_path, @szSearch, @szReplace)

	update report
	set location = replace(location, @szSearch, @szReplace)

	if ( @bDelete = 1 )
	begin
		delete _arb_event_object with(tablockx)
		delete _arb_letter_history with(tablockx)
		delete event_object with(tablockx)
		delete installment_agreement_letter_history with(tablockx)
		delete litigation_event_objects with(tablockx)
		delete pacs_image with(tablockx)

		update property_val with(tablockx)
		set image_path = null
		where image_path is not null
	end
	else
	begin
		update _arb_event_object with(tablockx)
		set szObjectPath = replace(szObjectPath, @szSearch, @szReplace)
		where charindex(@szSearch, szObjectPath) > 0

		update _arb_letter_history with(tablockx)
		set szPathLocation = replace(szPathLocation, @szSearch, @szReplace)
		where charindex(@szSearch, szPathLocation) > 0

		update event_object with(tablockx)
		set location = replace(location, @szSearch, @szReplace)
		where charindex(@szSearch, location) > 0

		update installment_agreement_letter_history with(tablockx)
		set path_location = replace(path_location, @szSearch, @szReplace)
		where charindex(@szSearch, path_location) > 0

		update litigation_event_objects with(tablockx)
		set object_path = replace(object_path, @szSearch, @szReplace)
		where charindex(@szSearch, object_path) > 0

		update pacs_image with(tablockx)
		set location = replace(location, @szSearch, @szReplace)
		where charindex(@szSearch, location) > 0

		update property_val with(tablockx)
		set image_path = replace(image_path, @szSearch, @szReplace)
		where charindex(@szSearch, image_path) > 0
	end

GO

