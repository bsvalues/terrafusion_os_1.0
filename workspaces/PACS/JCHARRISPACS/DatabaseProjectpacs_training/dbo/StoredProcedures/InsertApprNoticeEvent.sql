
CREATE PROCEDURE InsertApprNoticeEvent

@input_notice_yr	numeric(4),
@input_notice_num	int,
@input_user		varchar(60),
@input_owner_agent	varchar(1),
@input_undeliverable	varchar(1),
@input_user_id	int

AS

declare @prop_id	int
declare @owner_id	int
declare @event_id	int
declare @file_as_name	varchar(60)
declare @event_desc  	varchar(2048)
declare @assessed_val	numeric(14)

if (@input_owner_agent = 'B')
begin
	if (@input_undeliverable = 'I')
	begin
		DECLARE APPR_NOTICE_PROP_LIST_CURSOR SCROLL CURSOR
		FOR select prop_id, owner_id,  file_as_name, an_assessed_val
		        from  appr_notice_prop_list
		        where notice_num = @input_notice_num
		        and   notice_yr = @input_notice_yr
	end
	else if (@input_undeliverable = 'E')
	begin
		DECLARE APPR_NOTICE_PROP_LIST_CURSOR SCROLL CURSOR
		FOR select prop_id, owner_id,  file_as_name, an_assessed_val
		        from  appr_notice_prop_list
		        where notice_num = @input_notice_num
		        and   notice_yr = @input_notice_yr
			and   addr_deliverable = 'Y'
	end
	else if (@input_undeliverable = 'U')
	begin
		DECLARE APPR_NOTICE_PROP_LIST_CURSOR SCROLL CURSOR
		FOR select prop_id, owner_id,  file_as_name, an_assessed_val
		        from  appr_notice_prop_list
		        where notice_num = @input_notice_num
		        and   notice_yr = @input_notice_yr
			and   addr_deliverable = 'N'
	end
end
else if (@input_owner_agent = 'O')
begin
	if (@input_undeliverable = 'I')
	begin
		DECLARE APPR_NOTICE_PROP_LIST_CURSOR SCROLL CURSOR
		FOR select prop_id, owner_id,  file_as_name, an_assessed_val
		        from  appr_notice_prop_list
		        where notice_num = @input_notice_num
		        and   notice_yr = @input_notice_yr
			and   owner_id = notice_owner_id
	end
	else if (@input_undeliverable = 'E')
	begin
		DECLARE APPR_NOTICE_PROP_LIST_CURSOR SCROLL CURSOR
		FOR select prop_id, owner_id,  file_as_name, an_assessed_val
		        from  appr_notice_prop_list
		        where notice_num = @input_notice_num
		        and   notice_yr = @input_notice_yr
			and   owner_id = notice_owner_id
			and   addr_deliverable = 'Y'
	end
	else if (@input_undeliverable = 'U')
	begin
		DECLARE APPR_NOTICE_PROP_LIST_CURSOR SCROLL CURSOR
		FOR select prop_id, owner_id,  file_as_name, an_assessed_val
		        from  appr_notice_prop_list
		        where notice_num = @input_notice_num
		        and   notice_yr = @input_notice_yr
			and   owner_id = notice_owner_id
			and   addr_deliverable = 'N'
	end
end
else if (@input_owner_agent = 'A')
begin
	if (@input_undeliverable = 'I')
	begin
		DECLARE APPR_NOTICE_PROP_LIST_CURSOR SCROLL CURSOR
		FOR select prop_id, owner_id,  file_as_name, an_assessed_val
		        from  appr_notice_prop_list
		        where notice_num = @input_notice_num
		        and   notice_yr = @input_notice_yr
			and   agent_copy = 'F'
	end
	else if (@input_undeliverable = 'E')
	begin
		DECLARE APPR_NOTICE_PROP_LIST_CURSOR SCROLL CURSOR
		FOR select prop_id, owner_id,  file_as_name, an_assessed_val
		        from  appr_notice_prop_list
		        where notice_num = @input_notice_num
		        and   notice_yr = @input_notice_yr
			and   agent_copy = 'F'
			and   addr_deliverable = 'Y'
	end
	else if (@input_undeliverable = 'U')
	begin
		DECLARE APPR_NOTICE_PROP_LIST_CURSOR SCROLL CURSOR
		FOR select prop_id, owner_id,  file_as_name, an_assessed_val
		        from  appr_notice_prop_list
		        where notice_num = @input_notice_num
		        and   notice_yr = @input_notice_yr
			and   agent_copy = 'F'
			and   addr_deliverable = 'N'
	end
end

OPEN APPR_NOTICE_PROP_LIST_CURSOR
FETCH NEXT FROM APPR_NOTICE_PROP_LIST_CURSOR into @prop_id, @owner_id,  @file_as_name, @assessed_val

while (@@FETCH_STATUS = 0)
begin

	exec dbo.GetUniqueID 'event', @event_id output, 1, 0
	
	select @event_desc = convert(varchar(4), @input_notice_yr)  +  ' Appraisal Notice printed for ' + @file_as_name 

	insert into event
	(
		event_id,
		system_type,
		event_type,
		event_date,
		pacs_user,
		event_desc,
		ref_evt_type,
		ref_year,
		ref_num,
		ref_id1,
		ref_id2
	)
	values
	(
		@event_id,
		'A',
		'SYSTEM',
		GetDate(),
		@input_user,
		@event_desc,
		'AN',
		@input_notice_yr,
		@input_notice_num,
		@prop_id,
		@owner_id
	)

	insert into prop_event_assoc
	(
		prop_id,
		event_id
	)
	values
	(
		@prop_id,
		@event_id
	)
	
	FETCH NEXT FROM APPR_NOTICE_PROP_LIST_CURSOR into @prop_id, @owner_id, @file_as_name, @assessed_val
end

CLOSE APPR_NOTICE_PROP_LIST_CURSOR
DEALLOCATE APPR_NOTICE_PROP_LIST_CURSOR

GO

