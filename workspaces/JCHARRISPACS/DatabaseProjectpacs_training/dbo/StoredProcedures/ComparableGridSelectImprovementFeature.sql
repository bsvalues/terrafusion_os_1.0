
create procedure ComparableGridSelectImprovementFeature
	@lYear numeric(4,0),
	@lSubjectPropID int
as

	select
		c.lPropID,

		ia.imprv_id,
		ia.imprv_det_id,
		ia.imprv_attr_id,
		ia.i_attr_val_id,
		upper(rtrim(ia.i_attr_val_cd)),
		ia.imprv_attr_val,
		
		OrderByDummy = case
			when
				c.lPropID = @lSubjectPropID
			then 1
			
			when
				exists ( -- Does subject have same feature
					select *
					from #comp_sales_property_pid as c2 with(nolock)
					join imprv_attr as ia2 with(nolock) on
						ia2.prop_val_yr = @lYear and
						ia2.sup_num = c2.lSupNum and
						ia2.sale_id = 0 and
						ia2.prop_id = @lSubjectPropID and
						ia2.i_attr_val_id = ia.i_attr_val_id
				)
			then
				2
			
			else
				3
		end
	

	from #comp_sales_property_pid as c with(nolock)
	join imprv_attr as ia with(nolock) on
		ia.prop_val_yr = @lYear and
		ia.sup_num = c.lSupNum and
		ia.sale_id = 0 and
		ia.prop_id = c.lPropID
	order by
		c.lPropID asc, ia.imprv_id asc, ia.imprv_det_id asc, OrderByDummy asc, ia.i_attr_val_id asc

	return( @@rowcount )

GO

