
-----------------------------------------------------------------------------
-- Procedure: CreateTransferPropertyTaxStmntHistory
--
-- Purpose:  Insert tax statement values into the transfer_tax_stmnt_history
--           table and calculate the percentages
-----------------------------------------------------------------------------
CREATE PROCEDURE CreateTransferPropertyTaxStmntHistory
    @input_stmnt_yr			numeric(4),
    @input_sup_num			int,
    @input_prop_id			int,
    @input_owner_id			int,
    @input_event_id			int,
    @input_user_id			int 

AS
 
------------------------------------------------------------------------------
declare @levy_group_id		int
declare @levy_run_id		int
declare @smnt_id            int
------------------------------------------------------------------------------
SELECT @levy_group_id = levy_group_id,
       @levy_run_id   = levy_run_id,
       @smnt_id       = stmnt_id
FROM transfer_tax_stmnt
WHERE levy_group_yr = @input_stmnt_yr
AND sup_num = @input_sup_num
AND prop_id = @input_prop_id
AND owner_id = @input_owner_id
AND event_id = @input_event_id



delete from transfer_tax_stmnt_history
where
 	  levy_group_id = @levy_group_id
    and   levy_group_yr = @input_stmnt_yr
    and   levy_run_id   = @levy_run_id
    and   prop_id       = @input_prop_id	
    AND   stmnt_id      = @smnt_id

delete from transfer_tax_stmnt_history_totals
where
	  levy_group_id = @levy_group_id
    and   levy_group_yr = @input_stmnt_yr
    and   levy_run_id   = @levy_run_id
    and   prop_id       = @input_prop_id	
    AND   stmnt_id      = @smnt_id

delete from transfer_tax_stmnt_fifth_yr_comparison
where
	  levy_group_id = @levy_group_id
    and   levy_group_yr = @input_stmnt_yr
    and   levy_run_id   = @levy_run_id
    and   prop_id       = @input_prop_id	
    AND   stmnt_id      = @smnt_id

delete from transfer_tax_stmnt_school_breakdown
where
	  levy_group_id = @levy_group_id
    and   levy_group_yr = @input_stmnt_yr
    and   levy_run_id   = @levy_run_id
    and   prop_id       = @input_prop_id	
    AND   stmnt_id      = @smnt_id
  
------------------------------------------------------------------------------------------------
declare @form varchar(15)

 
  
select @form = tsfm.szDefaultForm         
    from tax_statement_forms_maint as tsfm with(nolock) 
    LEFT OUTER JOIN entity_tax_statement_run as etsr with(nolock) 
    ON etsr.levy_year   = tsfm.lTaxYr
WHERE 
    etsr.levy_group_id     = @levy_group_id
AND etsr.levy_year     = @input_stmnt_yr
AND etsr.levy_sup_num = @input_sup_num
AND etsr.levy_run     = @levy_run_id
AND etsr.created_date <= isnull(tsfm.dtExpire, getdate() ) 
order by lTaxYr desc, lKey desc
  
IF (@form IS NULL ) 
BEGIN
    SELECT @form=default_tax_statement_form from pacs_system with (nolock) where system_type in ('A','B')     
END--if

IF (@form IS NULL) OR (@form='Form 2005')
BEGIN 
    insert into transfer_tax_stmnt_history
    (levy_group_id,
    levy_group_yr,
    levy_run_id,
    prop_id,
    owner_id,
    sup_num,
    sup_tax_yr,
    stmnt_id,
    hist_yr,
    hist_entity_id,
    hist_entity_name,
    hist_stmnt_id,
    hist_assessed_val,
    hist_taxable_val,
    hist_tax_rate,
    hist_tax_amt,
    hist_pct_change,
    bill_id)
    
    select  distinct
    tts.levy_group_id,
    tts.levy_group_yr,
    tts.levy_run_id,		
    bill.prop_id, 
    bill.owner_id,
    bill.sup_num,
    bill.sup_tax_yr ,
    tts.stmnt_id,
    bill.sup_tax_yr as hist_yr,
    bill.entity_id  as hist_entity_id,
    substring(ac.file_as_name, 1,22) as hist_entity_name,	-- do same as CreateTransferTaxStmntHistory
    bill.stmnt_id   as hist_stmnt_id,
    bill.bill_assessed_value as hist_assessed_val,
    bill.bill_taxable_val as  hist_taxable_val, 
    tax_rate.m_n_o_tax_pct + tax_rate.i_n_s_tax_pct as  hist_tax_rate, 
    bill.bill_adj_m_n_o + bill.bill_adj_i_n_s as  hist_tax_amt, 
    NULL as pct_change,  -- (Will have to be calculated) 
    bill.bill_id
    from  bill, entity with(nolock), tax_rate with(nolock), account ac with(nolock), transfer_tax_stmnt tts with(nolock)
    where bill.entity_id = entity.entity_id
    and   bill.entity_id = tax_rate.entity_id
    and   bill.sup_tax_yr = tax_rate.tax_rate_yr
    and   entity.entity_id = ac.acct_id 
    and   bill.sup_tax_yr BETWEEN (@input_stmnt_yr-4)  AND (@input_stmnt_yr) 
    and   bill.prop_id    = tts.prop_id 
    and   bill.coll_status_cd <> 'RS'
    and   bill.bill_type <> 'R' 
    and   bill.adjustment_code <> 'BPP'
    and   tts.levy_group_id = @levy_group_id
    and   tts.levy_group_yr = @input_stmnt_yr
    and   tts.levy_run_id   = @levy_run_id
    and   tts.sup_num       = @input_sup_num  
    and   tts.prop_id       = @input_prop_id	
    AND   tts.owner_id      = @input_owner_id
    AND   tts.event_id      = @input_event_id	
    AND   tts.stmnt_id      = @smnt_id
    
    ------------------------------------------------------------------------------------------------
    --UPDATE THE PERCENTAGE FOR ALL THE RECORDS IN THE HISTORY TABLE
    UPDATE transfer_tax_stmnt_history  
    SET hist_pct_change =  dbo.fn_CalculatePercentChangeInTax( levy_group_id
                                   ,levy_group_yr 
                                   ,levy_run_id   
                                   ,prop_id       
                                   ,owner_id      
                                   ,sup_num       
                                   ,sup_tax_yr    
                                   ,stmnt_id      
                                   ,hist_yr       
                                   ,hist_entity_id
                                   ,bill_id 
                                   ,hist_tax_amt  )
    WHERE  levy_group_yr = @input_stmnt_yr
    and   sup_num = @input_sup_num  
    and   prop_id = @input_prop_id	
    AND   owner_id = @input_owner_id 
    
    --Insert the History Totals. This step needs to insert 5 records into the 
    --transfer_tax_stmnt_history_totals, one for each year and is the sum of all 
    --the entities tax fields
    INSERT INTO transfer_tax_stmnt_history_totals
    (
    levy_group_id,
    levy_group_yr,
    levy_run_id,
    prop_id,
    owner_id,
    sup_num,
    sup_tax_yr,
    stmnt_id,
    hist_yr,
    hist_stmnt_id,
    hist_tax_rate,
    hist_tax_amnt,
    hist_pct_change 
    ) 
    SELECT DISTINCT 
    ta.levy_group_id,
    ta.levy_group_yr,
    ta.levy_run_id,
    ta.prop_id,
    ta.owner_id,
    ta.sup_num,
    ta.sup_tax_yr,
    ta.stmnt_id,
    ta.hist_yr, 
    ta.hist_stmnt_id,
    tb.hist_tax_rate_sum,
    tb.hist_tax_amt_sum,
    tb.hist_pct_change_sum 
    FROM transfer_tax_stmnt_history ta with(nolock) ,( select prop_id, sup_tax_yr, hist_stmnt_id,  SUM(hist_taxable_val) as hist_taxable_val_sum, 
    sum(hist_tax_rate) as hist_tax_rate_sum , 
    sum(hist_tax_amt) as hist_tax_amt_sum, 
    sum(hist_pct_change) as hist_pct_change_sum 
    FROM transfer_tax_stmnt_history tts with(nolock)  
    WHERE tts.levy_group_id = @levy_group_id
    and   tts.levy_group_yr = @input_stmnt_yr
    and   tts.levy_run_id   = @levy_run_id
    and   tts.sup_num       = @input_sup_num  
    and   tts.prop_id       = @input_prop_id	
    AND   tts.owner_id      = @input_owner_id 
    AND   tts.stmnt_id      = @smnt_id 
    GROUP BY prop_id,  sup_tax_yr ,hist_stmnt_id
    ) tb
    
    WHERE tb.prop_id     = ta.prop_id
    AND tb.sup_tax_yr    = ta.sup_tax_yr
    AND tb.hist_stmnt_id = ta.hist_stmnt_id 
    AND ta.levy_group_yr = @input_stmnt_yr
    and ta.sup_num       = @input_sup_num  
    and ta.prop_id       = @input_prop_id	
    AND ta.owner_id      = @input_owner_id 
	and ta.levy_group_id = @levy_group_id
    and ta.levy_run_id   = @levy_run_id
    ORDER BY ta.prop_id, ta.sup_tax_yr
     
    --Calculate the values for the  transfer_tax_stmnt_fifth_yr_comparison
    INSERT INTO transfer_tax_stmnt_fifth_yr_comparison
    (
    levy_group_id,
    levy_group_yr,
    levy_run_id,
    prop_id,
    owner_id,
    sup_num,
    sup_tax_yr,
    stmnt_id,
    hist_yr,
    hist_entity_id,
    hist_stmnt_id,
    hist_entity_name,
    bill_id,
    prev_bill_id,
    hist_assessed_val,
    hist_taxable_val,
    hist_tax_rate,
    hist_tax_amt
    )
    SELECT 
    tcurrent.levy_group_id,
    tcurrent.levy_group_yr,
    tcurrent.levy_run_id,
    tcurrent.prop_id,
    tcurrent.owner_id,
    tcurrent.sup_num,
    tcurrent.sup_tax_yr,
    tcurrent.stmnt_id,
    tcurrent.hist_yr,
    tcurrent.hist_entity_id,
    tcurrent.hist_stmnt_id,
    tcurrent.hist_entity_name,   
    tcurrent.bill_id as  bill_id ,
    tprev.bill_id    as  prev_bill_id, 
     'total_assessed_val' =
        CASE WHEN (tprev.hist_assessed_val IS NOT NULL) AND (tprev.hist_assessed_val<>0) AND (tcurrent.hist_assessed_val IS NOT NULL )
                   THEN  CAST(  (100* (tcurrent.hist_assessed_val-tprev.hist_assessed_val)/tprev.hist_assessed_val) AS NUMERIC(14,2) )
             WHEN (tprev.hist_assessed_val IS NULL) OR (tcurrent.hist_assessed_val IS NULL ) THEN NULL
        END,
        'total_tax_value' = 
        CASE  WHEN (tprev.hist_taxable_val IS NOT NULL) AND (tprev.hist_taxable_val<>0) AND (tcurrent.hist_taxable_val IS NOT NULL )
                   THEN CAST( (100*( tcurrent.hist_taxable_val-tprev.hist_taxable_val)/tprev.hist_taxable_val) AS NUMERIC(14,2))
              WHEN (tprev.hist_taxable_val IS NULL) OR (tcurrent.hist_assessed_val IS NULL ) THEN NULL 
    
        END,
        'total_tax_rate' = 
        CASE
            WHEN(tprev.hist_tax_rate is NOT NULL) AND (tprev.hist_tax_rate<>0) AND (tcurrent.hist_tax_rate IS NOT NULL ) 
                 THEN  CAST( (100*( tcurrent.hist_tax_rate-tprev.hist_tax_rate)/tprev.hist_tax_rate) AS NUMERIC(14,2) )
            WHEN (tprev.hist_tax_rate is NULL) OR (tcurrent.hist_tax_rate IS NULL ) THEN NULL
        END,
        'total_tax_amnt' = 
        CASE 
            WHEN(tprev.hist_tax_amt IS NOT NULL) AND (tprev.hist_tax_amt <> 0) AND (tcurrent.hist_tax_amt IS NOT NULL)
                 THEN  CAST( (100*( tcurrent.hist_tax_amt-tprev.hist_tax_amt)/tprev.hist_tax_amt) AS NUMERIC(14,2))
            WHEN(tprev.hist_tax_amt IS NULL ) OR ( tcurrent.hist_tax_amt IS NULL ) THEN NULL
        END 
    
    FROM transfer_tax_stmnt_history tcurrent with(nolock)
    INNER JOIN  transfer_tax_stmnt_history tprev with(nolock) ON
          tprev.levy_group_id         = tcurrent.levy_group_id
    AND   tprev.levy_group_yr         = tcurrent.levy_group_yr 
    AND   tprev.levy_run_id           = tcurrent.levy_run_id   
    AND   tprev.prop_id               = tcurrent.prop_id        
    AND   tprev.stmnt_id              = tcurrent.stmnt_id        
    AND   tprev.hist_entity_id        = tcurrent.hist_entity_id    
    
    WHERE 
    	tcurrent.levy_group_id = @levy_group_id
    and tcurrent.levy_group_yr = @input_stmnt_yr
    AND tprev.sup_tax_yr       = (@input_stmnt_yr - 4)
    and tcurrent.levy_run_id   = @levy_run_id
    and tcurrent.sup_tax_yr    = @input_stmnt_yr
    AND tcurrent.levy_group_yr = @input_stmnt_yr
    and tcurrent.sup_num    = @input_sup_num  
    and tcurrent.prop_id    = @input_prop_id	
    AND tcurrent.owner_id   = @input_owner_id

	declare @counter int
	declare @entity_1_name varchar(70)
	declare @entity_1_curr_yr numeric(4,0)
	declare @entity_1_curr_mno_rate numeric(13,10)
	declare @entity_1_curr_ins_rate numeric(13,10)
	declare @entity_1_curr_total_rate numeric(13,10)
	declare @entity_1_prev_yr numeric(4,0)
	declare @entity_1_prev_mno_rate numeric(13,10)
	declare @entity_1_prev_ins_rate numeric(13,10)
	declare @entity_1_prev_total_rate numeric(13,10)
	declare @entity_2_name varchar(70)
	declare @entity_2_curr_yr numeric(4,0)
	declare @entity_2_curr_mno_rate numeric(13,10)
	declare @entity_2_curr_ins_rate numeric(13,10)
	declare @entity_2_curr_total_rate numeric(13,10)
	declare @entity_2_prev_yr numeric(4,0)
	declare @entity_2_prev_mno_rate numeric(13,10)
	declare @entity_2_prev_ins_rate numeric(13,10)
	declare @entity_2_prev_total_rate numeric(13,10)
	declare @entity_3_name varchar(70)
	declare @entity_3_curr_yr numeric(4,0)
	declare @entity_3_curr_mno_rate numeric(13,10)
	declare @entity_3_curr_ins_rate numeric(13,10)
	declare @entity_3_curr_total_rate numeric(13,10)
	declare @entity_3_prev_yr numeric(4,0)
	declare @entity_3_prev_mno_rate numeric(13,10)
	declare @entity_3_prev_ins_rate numeric(13,10)
	declare @entity_3_prev_total_rate numeric(13,10)

	declare @prev_entity_name varchar(70)
	declare @entity_name varchar(70)
	declare @hist_yr numeric(4,0)
	declare @mno_rate numeric(13,10)
	declare @ins_rate numeric(13,10)
	declare @total_rate numeric(13,10)

	set @prev_entity_name = 'X'
	set @counter = 0

	declare cur_entity_breakdown CURSOR FAST_FORWARD
	for select top 3 ttsh.hist_entity_name, ttsh.hist_yr, m_n_o_tax_pct, i_n_s_tax_pct,  
				m_n_o_tax_pct + i_n_s_tax_pct as total_rate 
				from transfer_tax_stmnt_history as ttsh 
				with (nolock) 
				join entity as e 
				with (nolock) 
				on ttsh.hist_entity_id = e.entity_id 
				and e.entity_type_cd = 'S' 
				join tax_rate as tr 
				with (nolock) 
				on ttsh.hist_entity_id = tr.entity_id 
				and ttsh.hist_yr = tr.tax_rate_yr 
				where levy_group_id = @levy_group_id
				and levy_group_yr = @input_stmnt_yr
				and levy_run_id = @levy_run_id
				and stmnt_id = @smnt_id
				and prop_id = @input_prop_id
				and owner_id = @input_owner_id
				and sup_num = @input_sup_num
				and hist_yr >= @input_stmnt_yr - 1
				and hist_yr <= @input_stmnt_yr
	order by ttsh.hist_entity_name, ttsh.hist_yr desc

	open cur_entity_breakdown

	fetch next from cur_entity_breakdown into @entity_name, @hist_yr, @mno_rate, @ins_rate,
						@total_rate

	while @@fetch_status = 0
	begin
		if @prev_entity_name <> @entity_name
		begin
			set @counter = @counter + 1
		end

		if @counter = 1
		begin
			set @entity_1_name = @entity_name

			if @hist_yr = @input_stmnt_yr
			begin
				set @entity_1_curr_yr = @hist_yr
				set @entity_1_curr_mno_rate = @mno_rate
				set @entity_1_curr_ins_rate = @ins_rate
				set @entity_1_curr_total_rate = @total_rate
			end
			else
			begin
				set @entity_1_prev_yr = @hist_yr
				set @entity_1_prev_mno_rate = @mno_rate
				set @entity_1_prev_ins_rate = @ins_rate
				set @entity_1_prev_total_rate = @total_rate
			end
		end
		else if @counter = 2
		begin
			set @entity_2_name = @entity_name

			if @hist_yr = @input_stmnt_yr
			begin
				set @entity_2_curr_yr = @hist_yr
				set @entity_2_curr_mno_rate = @mno_rate
				set @entity_2_curr_ins_rate = @ins_rate
				set @entity_2_curr_total_rate = @total_rate
			end
			else
			begin
				set @entity_2_prev_yr = @hist_yr
				set @entity_2_prev_mno_rate = @mno_rate
				set @entity_2_prev_ins_rate = @ins_rate
				set @entity_2_prev_total_rate = @total_rate
			end
		end
		else
		begin
			set @entity_3_name = @entity_name

			if @hist_yr = @input_stmnt_yr
			begin
				set @entity_3_curr_yr = @hist_yr
				set @entity_3_curr_mno_rate = @mno_rate
				set @entity_3_curr_ins_rate = @ins_rate
				set @entity_3_curr_total_rate = @total_rate
			end
			else
			begin
				set @entity_3_prev_yr = @hist_yr
				set @entity_3_prev_mno_rate = @mno_rate
				set @entity_3_prev_ins_rate = @ins_rate
				set @entity_3_prev_total_rate = @total_rate
			end
		end

		set @prev_entity_name = @entity_name

		fetch next from cur_entity_breakdown into @entity_name, @hist_yr, @mno_rate, @ins_rate,
						@total_rate
	end

	close cur_entity_breakdown
	deallocate cur_entity_breakdown

	insert transfer_tax_stmnt_school_breakdown
	(levy_group_id, levy_group_yr, levy_run_id, prop_id, owner_id, sup_num, sup_tax_yr,
	 stmnt_id, entity_1_name, entity_1_curr_yr, entity_1_curr_mno_rate, entity_1_curr_ins_rate,
	 entity_1_curr_total_rate, entity_1_prev_yr, entity_1_prev_mno_rate, entity_1_prev_ins_rate,
	 entity_1_prev_total_rate, entity_2_name, entity_2_curr_yr, entity_2_curr_mno_rate,
	 entity_2_curr_ins_rate, entity_2_curr_total_rate, entity_2_prev_yr, entity_2_prev_mno_rate,
	 entity_2_prev_ins_rate, entity_2_prev_total_rate, entity_3_name, entity_3_curr_yr,
	 entity_3_curr_mno_rate, entity_3_curr_ins_rate, entity_3_curr_total_rate, entity_3_prev_yr,
	 entity_3_prev_mno_rate, entity_3_prev_ins_rate, entity_3_prev_total_rate)
	values
	(@levy_group_id, @input_stmnt_yr, @levy_run_id, @input_prop_id, @input_owner_id, @input_sup_num,
	 @input_stmnt_yr, @smnt_id, @entity_1_name, @entity_1_curr_yr, @entity_1_curr_mno_rate, @entity_1_curr_ins_rate,
	 @entity_1_curr_total_rate, @entity_1_prev_yr, @entity_1_prev_mno_rate, @entity_1_prev_ins_rate,
	 @entity_1_prev_total_rate, @entity_2_name, @entity_2_curr_yr, @entity_2_curr_mno_rate,
	 @entity_2_curr_ins_rate, @entity_2_curr_total_rate, @entity_2_prev_yr, @entity_2_prev_mno_rate,
	 @entity_2_prev_ins_rate, @entity_2_prev_total_rate, @entity_3_name, @entity_3_curr_yr,
	 @entity_3_curr_mno_rate, @entity_3_curr_ins_rate, @entity_3_curr_total_rate, @entity_3_prev_yr,
	 @entity_3_prev_mno_rate, @entity_3_prev_ins_rate, @entity_3_prev_total_rate)
	
END --if

GO

