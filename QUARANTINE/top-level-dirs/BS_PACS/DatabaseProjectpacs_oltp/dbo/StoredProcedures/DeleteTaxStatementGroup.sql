
CREATE procedure DeleteTaxStatementGroup

@input_group_id int,
@input_group_yr numeric(4,0),
@input_run	int

as

delete from entity_tax_statement_prop_type with(tablock)
where
	levy_group_id = @input_group_id and
	levy_group_yr = @input_group_yr and
	levy_run = @input_run

delete from entity_tax_statement_run_print_history with(tablock)
where
	levy_group_id = @input_group_id and
	levy_year = @input_group_yr and
	levy_run = @input_run

delete from entity_tax_statement_run with(tablock)
where
	levy_group_id = @input_group_id and
	levy_year = @input_group_yr and
	levy_run = @input_run

delete from transfer_tax_stmnt_school_breakdown with(tablock)
where
	levy_group_id = @input_group_id	and
	levy_group_yr = @input_group_yr	and
	levy_run_id = @input_run

delete from transfer_tax_stmnt_entity_totals_temp with(tablock)
where
	levy_group_id = @input_group_id and
	levy_group_yr = @input_group_yr and
	levy_run_id = @input_run

delete from transfer_tax_stmnt_entity_totals with(tablock)
where
	levy_group_id = @input_group_id and
	levy_group_yr = @input_group_yr and
	levy_run_id = @input_run

delete from transfer_tax_stmnt_history with(tablock)
where
	levy_group_id = @input_group_id and
	levy_group_yr = @input_group_yr and
	levy_run_id = @input_run

delete from transfer_tax_stmnt_history_totals with(tablock)
where
	levy_group_id = @input_group_id and
	levy_group_yr = @input_group_yr and
	levy_run_id = @input_run

delete from transfer_tax_stmnt_fifth_yr_comparison with(tablock)
where
	levy_group_id = @input_group_id and
	levy_group_yr = @input_group_yr and
	levy_run_id = @input_run

delete from transfer_tax_stmnt with(tablock)
where
	levy_group_id = @input_group_id and
	levy_group_yr = @input_group_yr and
	levy_run_id = @input_run


-- Set all of the bill IDs in the bill table that are related to the specified tax statement levy group/year/run id to 0
-- Get the list of related entity IDs
select
	entity_1_id,entity_2_id,entity_3_id,entity_4_id,entity_5_id,entity_6_id,entity_7_id,entity_8_id,entity_9_id,entity_10_id
into
	#temp 
from
	transfer_tax_stmnt with(tablock)
where
	levy_group_id = @input_group_id and
	levy_group_yr = @input_group_yr and
	levy_run_id = @input_run 

-- Update the stmnt_id field
update bill with(tablock) set stmnt_id = 0 where bill_id in (
	select bill_id from bill where
	sup_tax_yr = @input_group_yr and
	stmnt_id <> 0 and
	entity_id in  ( 
		select distinct entity_1_id  from #temp union
		select distinct entity_2_id  from #temp union
		select distinct entity_3_id  from #temp union
		select distinct entity_4_id  from #temp union
		select distinct entity_5_id  from #temp union
		select distinct entity_6_id  from #temp union
		select distinct entity_7_id  from #temp union
		select distinct entity_8_id  from #temp union
		select distinct entity_9_id  from #temp union
		select distinct entity_10_id from #temp 
	)
)


-- Select and then delete any events associated with the statements being deleted
SELECT
	event_id INTO #delete_events
FROM
	event with(tablock)
WHERE
	(event.ref_evt_type = 'TS' or event.ref_evt_type = 'STS') and
	event.ref_year		= @input_group_yr and
	event.ref_id1		= @input_group_id and
	event.ref_id3		= @input_run

DELETE FROM prop_event_assoc	with(tablock)	WHERE event_id IN (SELECT event_id FROM #delete_events)
DELETE FROM event		with(tablock)	WHERE event_id IN (SELECT event_id FROM #delete_events)

GO

