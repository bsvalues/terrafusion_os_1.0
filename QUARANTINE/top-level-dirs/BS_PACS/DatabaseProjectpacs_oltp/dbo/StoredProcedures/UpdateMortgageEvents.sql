
CREATE PROCEDURE UpdateMortgageEvents
@input_run_id	int,
@input_user_id	int

AS

declare @next_event_id	int
declare @tax_year	numeric(4)
declare @text		varchar(50)
declare @prop_id	int

--Get next event ID
exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0

--Get Tax Year
select @tax_year = tax_yr from pacs_system

--Generate event description
select @text = 'Mortgage Company Payment Processed for ' + cast(@tax_year as char(4))

--Create an event for the mortgage run
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
	pacs_user_id
)
values
(
	@next_event_id,
	'C',
	'SYSTEM',
	GetDate(),
	@input_user_id,
	@text,
	'MCP',
	@tax_year,
	@input_user_id
)

--Now insert a row into the prop_event_assoc table for each property in the mortgage payment run
DECLARE MORTGAGE_PAYMENT_RUN SCROLL CURSOR
FOR
select mortgage_payment.prop_id
from   mortgage_payment
where  mortgage_payment.mortgage_run_id = @input_run_id
and    mortgage_payment.status = 'AP'

OPEN MORTGAGE_PAYMENT_RUN
FETCH NEXT FROM  MORTGAGE_PAYMENT_RUN into @prop_id

while (@@FETCH_STATUS = 0)
begin
	insert into prop_event_assoc
	(
		prop_id,
		event_id
	)
	values
	(
		@prop_id,
		@next_event_id
	)

	FETCH NEXT FROM  MORTGAGE_PAYMENT_RUN into @prop_id
end

CLOSE MORTGAGE_PAYMENT_RUN
DEALLOCATE MORTGAGE_PAYMENT_RUN

GO

