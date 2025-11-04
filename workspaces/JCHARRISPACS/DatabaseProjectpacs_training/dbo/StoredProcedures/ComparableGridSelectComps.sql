
create procedure ComparableGridSelectComps
	@lTempPropGridID int,
	@lYear numeric(4,0),
	@lSubjectPropIDAdd int = null
as

set nocount on

	truncate table #comp_sales_property
	truncate table #comp_sales_property_pid
	truncate table #comp_sales_property_saleid

	/* Build the output table */
	insert #comp_sales_property (lID, lPropID, lSaleID)
	select
		c.lID, c.lCompPropID, c.lSaleID
	from comp_sales_temp_property as c with(nolock)
	where
		c.lTempPropGridID = @lTempPropGridID

	/* Build the pid list */
	insert #comp_sales_property_pid (lPropID, lSupNum)
	select distinct c.lPropID, isnull(psa.sup_num, 0)
	from #comp_sales_property as c with(nolock)
	left outer join prop_supp_assoc as psa with(nolock) on
		psa.owner_tax_yr = @lYear and
		psa.prop_id = c.lPropID

	/* Build the sale id list */
	insert #comp_sales_property_saleid (lSaleID)
	select distinct c.lSaleID
	from #comp_sales_property as c with(nolock)
	where
		c.lSaleID > 0

	/* Add the subject pid if requested */
	if (
		@lSubjectPropIDAdd is not null and
		not exists (
			select c.lPropID
			from #comp_sales_property_pid as c with(nolock)
			where
				c.lPropID = @lSubjectPropIDAdd
		)
	)
	begin
		insert #comp_sales_property_pid (lPropID, lSupNum)
		select @lSubjectPropIDAdd, psa.sup_num
		from prop_supp_assoc as psa with(nolock)
		where
			owner_tax_yr = @lYear and
			prop_id = @lSubjectPropIDAdd
	end

set nocount off

	select
		c.lPropID, c.lSaleID, cpp.lSupNum
	from #comp_sales_property as c with(nolock)
	join #comp_sales_property_pid as cpp with(nolock) on
		c.lPropID = cpp.lPropID
	order by c.lID asc

	return( @@rowcount )

GO

