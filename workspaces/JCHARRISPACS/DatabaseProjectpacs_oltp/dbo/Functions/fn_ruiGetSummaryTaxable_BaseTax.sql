

CREATE  FUNCTION fn_ruiGetSummaryTaxable_BaseTax ( @prop_id int,
                                                   @owner_id int,
                                                   @year int,
                                                   @sup_num int,
                                                   @entity_id int )
RETURNS int
AS
BEGIN
	declare @resultVal int
	set @resultVal = 0
	--
	select top 1 @resultVal= sum( bill.bill_adj_m_n_o +  bill.bill_adj_i_n_s)  
    		from bill where 
			bill.prop_id    = @prop_id  AND 
			bill.owner_id   = @owner_id AND   
			bill.sup_tax_yr = @year     AND  
			bill.sup_num    = @sup_num  AND
			bill.entity_id  = @entity_id 
 
	--select @resultVal = ISNULL( @resultVal,0 ) 
	--	 
	RETURN (@resultVal)
END

GO

