
 
CREATE  FUNCTION fn_CalculatePercentChangeInTax  ( @levy_group_id int,
                                                   @levy_group_yr numeric(4,0)   ,
                                                   @levy_run_id int   ,
                                                   @prop_id int   ,
                                                   @owner_id int   ,
                                                   @sup_num int   ,
                                                   @sup_tax_yr numeric(4,0)   ,
                                                   @stmnt_id int   ,
                                                   @hist_yr numeric(4,0)   ,
                                                   @hist_entity_id int   ,
                                                   @bill_id int, 
                                                   @current_yr_tax_amnt NUMERIC(14,2) )    
RETURNS NUMERIC(10,2)
AS
BEGIN
	declare @resultVal NUMERIC(10,2)
    declare @prev_yr_tax_amnt NUMERIC(14,2)
	set @resultVal = NULL
	--
    SELECT @prev_yr_tax_amnt = hist_tax_amt
    FROM transfer_tax_stmnt_history
    WHERE 
    levy_group_id = @levy_group_id
    AND levy_group_yr  = @levy_group_yr
    AND levy_run_id    = @levy_run_id
    AND prop_id        = @prop_id 
    AND sup_tax_yr     = @sup_tax_yr-1
    AND stmnt_id       = @stmnt_id 
    AND hist_entity_id = @hist_entity_id  

    if (@prev_yr_tax_amnt IS NULL OR @current_yr_tax_amnt IS NULL ) 
    BEGIN
        select @resultVal = NULL
    END
    ELSE
    IF (@prev_yr_tax_amnt=0)
        BEGIN
            IF (@current_yr_tax_amnt=0)
            BEGIN
               SELECT @resultVal = 0.00
            END
            ELSE
            BEGIN
               SELECT @resultVal = 100.00
            END
        END
    ELSE 
    IF (@current_yr_tax_amnt=0)
        BEGIN
            select @resultVal = (-100.00)
        END
    ELSE
        BEGIN
            select @resultVal = (100* (@current_yr_tax_amnt - @prev_yr_tax_amnt) / @prev_yr_tax_amnt)
        END
    

    
    /*
    if (@prev_yr_tax_amnt IS NOT NULL AND @prev_yr_tax_amnt <>0 AND 
        @current_yr_tax_amnt IS NOT NULL ) 
    BEGIN
        select @resultVal = (100* (@current_yr_tax_amnt - @prev_yr_tax_amnt) / @prev_yr_tax_amnt)
    END
    ELSE
    IF (@prev_yr_tax_amnt IS NULL AND @current_yr_tax_amnt IS NOT NULL )
    BEGIN 
        select @resultVal = 100.00
        --If the current year is Levy_group_yr - 4 we should set it to 0
        if( @sup_tax_yr = (@levy_group_yr-4))
        begin
            select  @resultVal = 0.00
        end
    END */
    
	--	 
	RETURN (@resultVal)
END

GO

