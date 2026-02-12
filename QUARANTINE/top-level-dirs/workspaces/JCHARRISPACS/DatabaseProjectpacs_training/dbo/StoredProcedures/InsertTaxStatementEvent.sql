
CREATE PROCEDURE InsertTaxStatementEvent  

@input_group_id		int,
@input_run_id		int,
@input_stmnt_yr		numeric(4),
@input_sup_num		int,
@input_user_id		int

AS

declare @prop_id	int
declare @owner_id	int
declare @sup_num	int
declare @sup_tax_yr	numeric(4)
declare @stmnt_id	int
declare @entity_1_cd	char(10)
declare @entity_2_cd	char(10)
declare @entity_3_cd	char(10)
declare @entity_4_cd	char(10)
declare @entity_5_cd	char(10)
declare @entity_6_cd	char(10)
declare @entity_7_cd	char(10)
declare @entity_8_cd	char(10)
declare @entity_9_cd	char(10)
declare @entity_10_cd	char(10)

declare @event_id	int
declare @event_desc  	varchar(2048)



DECLARE TAX_STMNT_LIST_CURSOR SCROLL CURSOR
FOR select prop_id, owner_id,  sup_num, sup_tax_yr,
	   entity_1_cd, entity_2_cd, entity_3_cd, entity_4_cd,
	   entity_5_cd, entity_6_cd, entity_7_cd, entity_8_cd,
	   entity_9_cd, entity_10_cd, stmnt_id
        from    transfer_tax_stmnt
        where 	levy_group_id = @input_group_id
        and     levy_group_yr = @input_stmnt_yr
	and     levy_run_id   = @input_run_id
	
OPEN TAX_STMNT_LIST_CURSOR
FETCH NEXT FROM TAX_STMNT_LIST_CURSOR into @prop_id, @owner_id,  @sup_num, @sup_tax_yr,
					   @entity_1_cd, @entity_2_cd, @entity_3_cd, @entity_4_cd, @entity_5_cd,
					   @entity_6_cd, @entity_7_cd, @entity_8_cd, @entity_9_cd, @entity_10_cd, @stmnt_id
					  

while (@@FETCH_STATUS = 0)
begin

	exec dbo.GetUniqueID 'event', @event_id output, 1, 0
	
	select @event_desc = convert(varchar(4), @input_stmnt_yr)  +  ' Tax Statement created for Entities: '

	if (@entity_1_cd <> ' ')
	begin
		select @event_desc = @event_desc +  @entity_1_cd
	end
	if (@entity_2_cd <> ' ')
	begin
		select @event_desc = @event_desc + ', ' + @entity_2_cd
	end
	if (@entity_3_cd <> ' ')
	begin
		select @event_desc = @event_desc + ', ' + @entity_3_cd
	end
	 if (@entity_4_cd <> ' ')
	begin
		select @event_desc = @event_desc + ', ' + @entity_4_cd
	end
	if (@entity_5_cd <> ' ')
	begin
		select @event_desc = @event_desc + ', ' + @entity_5_cd
	end
	if (@entity_6_cd <> ' ')
	begin
		select @event_desc = @event_desc + ', ' + @entity_6_cd
	end
	if (@entity_7_cd <> ' ')
	begin
		select @event_desc = @event_desc + ', ' + @entity_7_cd
	end
	if (@entity_8_cd <> ' ')
	begin
		select @event_desc = @event_desc + ', ' + @entity_8_cd
	end
	if (@entity_9_cd <> ' ')
	begin
		select @event_desc = @event_desc + ', ' + @entity_9_cd
	end
	
	if (@entity_10_cd <> ' ')
	begin
		select @event_desc = @event_desc + ', ' + @entity_10_cd
	end

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
	ref_id1,
	ref_id2,
	ref_id3,
	ref_id4,
	ref_id5,
	ref_id6,
	pacs_user_id
	)
	values
	(
	@event_id,
	'C',
	'SYSTEM',
	GetDate(),
	@input_user_id,
	@event_desc,
	'TS',
	@input_stmnt_yr,
	@input_group_id,
	@sup_num,
	@input_run_id,
	@prop_id,
	@owner_id,
	@stmnt_id,
	@input_user_id
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
	
 

	FETCH NEXT FROM TAX_STMNT_LIST_CURSOR into @prop_id, @owner_id,  @sup_num, @sup_tax_yr,
					   @entity_1_cd, @entity_2_cd, @entity_3_cd, @entity_4_cd, @entity_5_cd,
					   @entity_6_cd, @entity_7_cd, @entity_8_cd, @entity_9_cd, @entity_10_cd, @stmnt_id
					  
end

CLOSE TAX_STMNT_LIST_CURSOR
DEALLOCATE TAX_STMNT_LIST_CURSOR

GO

