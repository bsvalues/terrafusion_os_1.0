
CREATE PROCEDURE CopyLandSched

@from_code	varchar(10),
@from_method	varchar(10),
@from_year	numeric(4),
@from_ls_id	int,
@to_code	varchar(10),
@to_method	varchar(10),
@to_ag_mkt	varchar(10),
@to_year	numeric(4)

as

declare @next_ls_id 	int
exec dbo.GetUniqueID 'land_sched', @next_ls_id output, 1, 0

insert into land_sched
(
ls_id,
ls_year,
ls_code,
ls_ag_or_mkt,
ls_method,
ls_interpolate,
ls_up,
ls_base_price,
ls_std_depth,
ls_plus_dev_ft,
ls_plus_dev_amt,
ls_minus_dev_ft,
ls_minus_dev_amt,
changed_flag,
ls_slope_intercept,
matrix_id
)
select 
@next_ls_id,
@to_year,
@to_code,
@to_ag_mkt,
@to_method,
ls_interpolate,
ls_up,
ls_base_price,
ls_std_depth,
ls_plus_dev_ft,
ls_plus_dev_amt,
ls_minus_dev_ft,
ls_minus_dev_amt,
changed_flag,
ls_slope_intercept,
matrix_id

from  land_sched 
where ls_year      = @from_year
and   ls_code      = @from_code
and   ls_method    = @from_method
and   ls_id	   = @from_ls_id

insert into land_sched_detail
(
ls_detail_id, 
ls_id,       
ls_year, 
ls_range_max,         
ls_range_price,   
ls_range_pc, 
ls_range_adj_price, 
ls_range_interpolate_inc,
[land_price_type]
)
select
ls_detail_id,
@next_ls_id,
@to_year,
ls_range_max,
ls_range_price,
ls_range_pc,
ls_range_adj_price,
ls_range_interpolate_inc,
[land_price_type]
from land_sched_detail
where ls_id   = @from_ls_id
and   ls_year = @from_year

insert into land_sched_ff_detail
(
ls_detail_id,
ls_id,
ls_year,
ls_range_max,
ls_range_price,
ls_range_pc,
ls_range_adj_price,
ls_range_interpolate_inc
)
select
ls_detail_id,
@next_ls_id,
@to_year,
ls_range_max,
ls_range_price,
ls_range_pc,
ls_range_adj_price,
ls_range_interpolate_inc
from land_sched_ff_detail
where ls_id   = @from_ls_id
and   ls_year = @from_year

insert into land_sched_si_detail
(
ls_detail_id,
ls_id,
ls_year,
ls_range_max,
ls_slope,
ls_y_intercept
)
select
ls_detail_id,
@next_ls_id,
@to_year,
ls_range_max,
ls_slope,
ls_y_intercept
from land_sched_si_detail
where ls_id   = @from_ls_id
and   ls_year = @from_year

insert into land_sched_matrix_assoc
(
ls_id,
ls_year,
matrix_id,
matrix_order,
adj_factor
)
select
@next_ls_id,
@to_year,
matrix_id,
matrix_order,
adj_factor
from land_sched_matrix_assoc
where ls_id   = @from_ls_id
and   ls_year = @from_year

GO

