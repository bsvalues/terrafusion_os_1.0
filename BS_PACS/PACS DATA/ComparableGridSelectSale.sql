
create procedure ComparableGridSelectSale

as

	select
		
		c.lSaleID,

		s.sl_dt,
		s.sl_price,
		s.sl_adj_sl_amt,
		s.sl_adj_sl_pct,
		upper(rtrim(s.sl_adj_rsn)),
		isnull(s.adjusted_sl_price, isnull(s.sl_price, 0)),
		upper(rtrim(s.sl_financing_cd)),
		upper(rtrim(s.sl_type_cd)),
		upper(rtrim(sc.buyer_conf_lvl_cd)),
		upper(rtrim(sc.seller_conf_lvl_cd)),
		upper(rtrim(s.sl_ratio_type_cd))

	from #comp_sales_property_saleid as c with(nolock)
	join sale as s with(nolock) on
		s.chg_of_owner_id = c.lSaleID
	left outer join sale_conf as sc with(nolock) on
		sc.chg_of_owner_id = c.lSaleID
	order by
		c.lSaleID asc

	return( @@rowcount )

GO

