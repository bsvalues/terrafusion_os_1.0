

create procedure LawsuitInsertEvent
	@lawsuit_id int,
	@event_dt datetime = null,
	@event_cd char(5) = null,
	@event_due_dt datetime = null,
	@event_comment varchar(500) = null

as

set nocount on

	declare @event_id int

	insert lawsuit_event (
		lawsuit_id, event_dt, event_cd, event_due_dt, event_comment
	) values (
		@lawsuit_id, @event_dt, @event_cd, @event_due_dt, @event_comment
	)
	set @event_id = @@identity

set nocount off

	select event_id = @event_id

GO

