












create view recalc_prop_count_vw
as
select pacs_user_id, count(*) num_props from recalc_prop_list group by pacs_user_id

GO

