




-- This stored procedure inserts System events for all prop_id's stored in ##pp_rend_prop_list 
-- History:
-- Ross	01/13/2005	Created

CREATE PROCEDURE PopulatePPFILLEvents
	@session_id int
WITH RECOMPILE

AS

declare @next_event_id	int


declare @pid int
declare @count int
declare curevents CURSOR FAST_FORWARD for
	select distinct prop_id 
	from ##pp_rend_prop_list 
	where session_id = @session_id

if exists (select name from tempdb.dbo.sysobjects where name = '##pp_rend_prop_list')
begin

	select @count = count(*) + 1 from ##pp_rend_prop_list where session_id = @session_id

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
			'RENDITION PRINTED',
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

