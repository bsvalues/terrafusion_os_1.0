

CREATE PROCEDURE VITReset
	@input_year	numeric(4,0),
	@input_batch_id	int

WITH RECOMPILE

AS

--RESETS ALL VIT PROCESSING DATA FOR A GIVEN YEAR AND BATCH
--ERICZ; 02/19/2004

SET NOCOUNT ON

--IF ANY TYPE OF PAYMENTS BESIDES VIT PAYMENTS (PAYMENT_TYPE = 'VEP'), ALERT THE USER AND DO NOT CONTINUE
if exists (select payment_id
		from payment
		where batch_id = @input_batch_id
		and payment_type <> 'VEP')
begin
	print 'VITReset cannot continue since there are payments other than VIT payments in this batch'
end
else
begin
	--DECLARE VARIABLES
	declare @event_id 	int
	declare @event_desc 	varchar(255)
	
	--GET EVENT_ID OF VIT PROCESSED
	select top 1 @event_id = event_id
		from event with (nolock)
		where event_desc = 'Special Inventory Payment Processing Completed'
		order by event_id desc
	
	set @event_id = isnull(@event_id, 0)
	
	--RESET BILLS
	update bill set bill_m_n_o_pd = 0,
		bill_i_n_s_pd = 0,
		overage_mno_pd = 0,
		overage_ins_pd = 0
	where bill_id in
	(
		select bill_id
		from payment_trans with (nolock)
		where payment_id in 
		(
			select payment_id
			from payment with (nolock)
			where batch_id = @input_batch_id
		)
	)
	
	--DELETE PAYMENT TRANSACTION RECORDS
	delete from payment_trans
	where payment_id in 
	(
		select payment_id
		from payment with (nolock)
		where batch_id = @input_batch_id
	)
	
	--DELETE PAYMENT RECORDS
	delete from payment
	where batch_id = @input_batch_id
	
	--DELETE APPLIED VIT ESCROW RECORDS
	select escrow_id
	into #tmp_vit_escrow
	from escrow_trans with (nolock)
	where status = 'VEAP'
		and year = @input_year
	
	delete from escrow_trans
	where escrow_id in
	(
		select escrow_id
		from #tmp_vit_escrow
	)
	
	delete from escrow
	where escrow_payment_id in
	(
		select escrow_id
		from #tmp_vit_escrow
	)
	
	drop table #tmp_vit_escrow
	
	--DELETE THE EVENTS ADDED TO THE PROPERTY FOR VIT PROCESSING
	if (@event_id > 0)
	begin
		delete from prop_event_assoc
		where event_id = @event_id
		
		delete from event
		where event_id = @event_id
	end
	
	--ADD SYSTEM EVENT INDICATING THE VIT PROCESS HAS BEEN RESET
	if not exists (select * from system_event_type where event_type_cd = 'VIT')
	begin
		insert into system_event_type (event_type_cd, event_type_desc)
		select 'VIT', 'VIT Processing'
	end
	
	set @event_desc = 'VIT Process Resest for Year ' + cast(@input_year as varchar(4)) + '; Batch ID ' + rtrim(cast(@input_batch_id as varchar(10)))
	
	exec InsertSystemEvent 'VIT', @event_desc
end

GO

