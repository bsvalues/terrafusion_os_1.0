

CREATE PROCEDURE [dbo].[InsertPayoutStatementEvent]
	@run_id	int,
	@userid int,
	@reportDate datetime = null
AS
BEGIN
	SET NOCOUNT ON;
	declare @numOfProp int
	select @numOfProp = count(*) from wa_payout_statement_vw
	where run_id = @run_id
	if (@numOfProp > 0)
	begin	
		declare @prop_id int
		DECLARE @UserName	varchar(50)
		declare @EventID	int

		exec dbo.GetUniqueID 'event', @EventID output, 1, 0
		set @reportDate = isnull(@reportDate, getdate())
		select @UserName = pacs_user_name
		from   pacs_user with(nolock)
		where  pacs_user_id = @userid

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
					ref_id2,
					ref_id3,
					ref_id4,
					ref_id5,
					ref_id6,
					litigation_recheck_date,
					pacs_user_id,
					litigation_recheck_complete
				)
				values
				(
					@EventID,
					'C',
					'PAS',
					@reportDate,
					@UserName,
					'Payout Agreement Statement',
					'PAS',
					null,
					@run_id,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					@UserID,
					null
				)

		declare payoutPropCursor CURSOR FAST_FORWARD
		for 
		select distinct prop_id 
		from   wa_payout_statement_vw
		where run_id = @run_id
		
		OPEN payoutPropCursor
		FETCH NEXT FROM payoutPropCursor
			INTO @prop_id
			WHILE @@FETCH_STATUS = 0
			BEGIN
				insert into prop_event_assoc
				(
					prop_id,
					event_id
				)
				values
				(
					@prop_id,
					@EventID
				)
				
			FETCH NEXT FROM payoutPropCursor INTO @prop_id				
			END
		CLOSE payoutPropCursor
		DEALLOCATE payoutPropCursor
	end
END

GO

