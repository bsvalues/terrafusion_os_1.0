

create procedure ProfileGetSuggestedPct

@input_detail_id	int,
@output_pct		numeric(18,2) output

as

declare @median_sale_ratio	numeric(18,2)

select @median_sale_ratio = sale_price_mid_pct 
from profile_sale_stats 
where detail_id = @input_detail_id

if (@median_sale_ratio > 0)
begin
	set @output_pct = (1/@median_sale_ratio) * 100
end
else
begin
	set @output_pct = 0
end

GO

