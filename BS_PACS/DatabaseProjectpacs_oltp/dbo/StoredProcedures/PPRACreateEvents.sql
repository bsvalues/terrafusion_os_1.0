
-- Insert system events for the properties in a Personal Property
-- Rendition Applications print run.
-- Adapted from the 8.0 version, PopulatePPFILEEvents

CREATE PROCEDURE PPRACreateEvents
	@dataset_id int,
	@event_description varchar(2048) = 'Rendition application printed'
AS

set nocount on

declare @next_event_id	int
declare @pid int
declare @count int

declare curevents CURSOR FAST_FORWARD for
	select distinct prop_id 
	from ##ppra_property_list 
	where dataset_id = @dataset_id

if exists (select name from tempdb.dbo.sysobjects where name = '##ppra_property_list')
begin

	select @count = count(*) from ##ppra_property_list where dataset_id = @dataset_id
	exec dbo.GetUniqueID 'event', @next_event_id output, @count, 0

	open curevents
	fetch next from curevents into @pid

	while @@fetch_status = 0
	begin

		insert into event
		(
			event_id,
			system_type,
			event_type,
			event_date,
			pacs_user,
			event_desc,
			pacs_user_id
		)
		values
		(
			@next_event_id,
			'A',
			'RENDITION',
			GetDate(),
			'System',
			@event_description,
			1
		)

		insert into prop_event_assoc
		(
			prop_id,
			event_id
		)
		values
		(
			@pid,
			@next_event_id
		)

		set @next_event_id = @next_event_id + 1

		fetch next from curevents into @pid
	end

	close curevents
	deallocate curevents
end

GO

