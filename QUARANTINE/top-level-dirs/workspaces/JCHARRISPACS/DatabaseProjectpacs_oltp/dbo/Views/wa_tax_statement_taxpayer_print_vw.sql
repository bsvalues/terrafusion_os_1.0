
create view wa_tax_statement_taxpayer_print_vw
as
	select
       wts.group_id,
       wts.year,
       wts.run_id,
       wts.history_id,
       wts.copy_type,
       wts.owner_id,
       wts.segment_number,
       wts.order_seq
from
       wa_tax_statement_print_history_statement_assoc as wts with (nolock)
inner join
(
       select
              wts.group_id, 
              wts.year, 
              wts.run_id, 
              wts.history_id,
              wts.copy_type,
              wts.owner_id,
              min(wts.order_seq) as order_seq
       from
              wa_tax_statement_print_history_statement_assoc as wts with (nolock)
       group by
              wts.group_id, 
              wts.year, 
              wts.run_id, 
              wts.history_id,
              wts.copy_type,
              wts.owner_id
) as min_order_seq
on
       min_order_seq.group_id = wts.group_id
and    min_order_seq.year = wts.year
and    min_order_seq.run_id = wts.run_id
and    min_order_seq.history_id = wts.history_id
and    min_order_seq.copy_type = wts.copy_type
and    min_order_seq.owner_id = wts.owner_id
and    min_order_seq.order_seq = wts.order_seq

GO

