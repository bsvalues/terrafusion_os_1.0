

CREATE procedure PrepareTaxCert
@input_prop_id	int,
@input_fee_id int,
@input_tax_cert_id int,
@input_effective_date     varchar(100)

as

declare @bill_id    		int
declare @prop_id       		int
declare @sup_tax_yr      	numeric(4)
declare @sup_num		int
declare @show_output      	int
declare @str_penalty_mno     	varchar(100)
declare @str_penalty_ins     	varchar(100)
declare @str_interest_ins    	varchar(100)
declare @str_interest_mno    	varchar(100)
declare @str_attorney_fee    	varchar(100)
declare @str_base_tax		varchar(100)
declare @str_total		varchar(100)
declare @base_tax		numeric(14,2)
declare @total			numeric(14,2)
declare @penalty_mno      	numeric(14,2)
declare @penalty_ins      	numeric(14,2)
declare @interest_mno      	numeric(14,2)
declare @interest_ins      	numeric(14,2)
declare @attorney_fee        	numeric(14,2)
declare @output_str_current_tax_due    varchar(100)
declare @output_str_delinquent_tax_due varchar(100)
declare @output_str_attorney_fee_due   varchar(100)
declare @effective_date		       datetime
declare @entity_cd		char(5)
declare @stmnt_id		int
declare @count			int
declare @owner_id		int
declare @entity_id		int
declare @tax_due		numeric(14,2)
declare @disc_pi		numeric(14,2)
declare @att_fee		numeric(14,2)
declare @tax_due1		numeric(14,2)
declare @disc_pi1		numeric(14,2)
declare @att_fee1		numeric(14,2)
declare @tax_due2		numeric(14,2)
declare @disc_pi2		numeric(14,2)
declare @att_fee2		numeric(14,2)
declare @month 			int
declare @day  			int
declare @year 			int
declare @date_string    	varchar(100)
declare @rend_entity_count	int

	--HS 31663 	    - Personal Property Attorney Fee Changes
	--Modified By	    - Sai K
	--Modified Date	    - 01/16/2006
	--Problem Description - Sum up all the bills on entites with rendition_entity = 1 
		--	    - (all the late rendition penalty bills) as
		  -- 	    - one single line titled late rendition penalty	


DECLARE PROPERTY_BILL SCROLL CURSOR
FOR 
     select distinct e.entity_cd,
	    p.col_owner_id,
	    b.entity_id,
	    b.bill_id,
	    b.stmnt_id,
	    b.prop_id,
	    b.sup_tax_yr,
	    b.sup_num
    from   
	   bill AS b
	   inner join 
	   entity as e
		   on b.entity_id = e.entity_id
		   AND 	isnull(e.rendition_entity, 0) = 0
	   inner join 
	   property as p 
	  	   on b.prop_id=p.prop_id

    where  
	   b.prop_id   = @input_prop_id
	   and b.coll_status_cd <> 'RS'
	   and b.entity_id in (
					select 
						entity_id
					from 
						fee_prop_entity_assoc, 
						fee_tax_cert_assoc
					where 
						fee_prop_entity_assoc.prop_id = fee_tax_cert_assoc.prop_id
						and   fee_prop_entity_assoc.fee_id  = fee_tax_cert_assoc.fee_id
						and   fee_tax_cert_assoc.prop_id = @input_prop_id
						and   fee_tax_cert_assoc.tax_cert_num = @input_tax_cert_id
				)
    and    b.entity_id in	(
					select 
						entity_id 
					from 
						entity_collect_for_vw
				)
	
UNION
	SELECT  
	 	'BPP' AS entity_cd,
		 p.col_owner_id,
	 	 0 AS entity_id,
		 0 AS bill_id,
		 0 AS stmnt_id,
		 b.prop_id,
		 b.sup_tax_yr,
		 NULL as sup_num
	FROM	
		 entity AS e
		 	INNER JOIN bill AS b
			INNER JOIN property AS p
		           ON b.prop_id = @input_prop_id
				AND b.prop_id = p.prop_id
			   ON e.entity_id=b.entity_id
			  	AND isnull(e.rendition_entity, 0) = 1
			INNER JOIN fee_tax_cert_assoc AS ftca
			   ON ftca.prop_id = @input_prop_id
			--	AND ftca.fee_id = @input_fee_id
				AND ftca.tax_cert_num=@input_tax_cert_id
			--INNER JOIN fee_prop_entity_assoc AS fpea
			--   ON fpea.prop_id = ftca.prop_id
			--	AND fpea.fee_id = ftca.fee_id
			--	AND fpea.entity_id = e.entity_id
			INNER JOIN entity_collect_for_vw AS ecf
			   ON ecf.entity_id= e.entity_id 	
	 WHERE 
		 b.coll_status_cd <>'RS'
	

        GROUP BY
		b.stmnt_id,		
		b.prop_id,
		b.sup_tax_yr,
--		b.sup_num,
		p.col_owner_id
		
	
	 
		
		
		

OPEN PROPERTY_BILL
FETCH NEXT FROM  PROPERTY_BILL into @entity_cd, 
	@owner_id, 
	@entity_id,
	@bill_id,  
	@stmnt_id,  
        @prop_id,
       	@sup_tax_yr,
	@sup_num


select @show_output = 0

while (@@FETCH_STATUS = 0)
   begin
	select @count = 0
	
            select @effective_date = convert(datetime, @input_effective_date)

	-- HS 31663/33593 , Sai K 02/09/2006
	-- The Rendition entities i.e Entities with rendition_entity=1 are actually fictitious entities
	-- therefore they would not have any entries in entity_prop_assoc tables. This is the reason that
	-- they would also not figure in the fee_prop_entity_assoc table 
	-- the below snippet is to add an entry for such entities so that inserts into prop_tax_cert_info do 
	-- not break FK constraints on fee_prop_entity_assoc

        ---------------------------------------------------------------------------------------------------------------
	select @rend_entity_count = 0
	
	select 
		@rend_entity_count = COUNT(*)
	from
		fee_prop_entity_assoc
	where
		fee_id=@input_fee_id
		AND
		prop_id=@input_prop_id
		AND
		entity_id=0

	if @rend_entity_count=0		
	BEGIN
		INSERT INTO fee_prop_entity_assoc (fee_id, prop_id, entity_id) VALUES (@input_fee_id, @input_prop_id, 0)
	END
	-----------------------------------------------------------------------------------------------------------------

	
	while (@count < 3)	
        	begin
			if (@entity_cd = 'BPP' and @entity_id = 0)
		
			begin
				exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@effective_date,@str_base_tax OUTPUT,
					@str_penalty_mno  OUTPUT, @str_penalty_ins  OUTPUT, 
					@str_interest_mno OUTPUT, @str_interest_ins OUTPUT,
					@str_attorney_fee OUTPUT, @str_total OUTPUT
			end
			else
			begin
				execute GetBillTaxDue @bill_id, @show_output, 'F', @effective_date,
					@str_base_tax OUTPUT, @str_penalty_mno OUTPUT, @str_penalty_ins OUTPUT, @str_interest_mno OUTPUT, 
					@str_interest_ins OUTPUT, @str_attorney_fee OUTPUT, @str_total OUTPUT
			end

 		select @base_tax       = convert(numeric(14,2), @str_base_tax)
		select @penalty_mno  = convert(numeric(14,2), @str_penalty_mno)
 		select @penalty_ins  = convert(numeric(14,2), @str_penalty_ins)
 		select @interest_ins = convert(numeric(14,2), @str_interest_mno)
 		select @interest_mno = convert(numeric(14,2), @str_interest_ins)
        		select @attorney_fee = convert(numeric(14,2), @str_attorney_fee)
		select @total = convert(numeric(14,2), @str_total)

	
		if (@count = 0)
		begin
 			select @tax_due = @base_tax
			select @disc_pi = @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
			select @att_fee = @attorney_fee

			select @month = DATEPART(month, @effective_date)
			select @day   = DATEPART(day,   @effective_date)
			select @year  = DATEPART(year,  @effective_date)

			if (@month = 12)
			begin
				select @month = 1
				select @year  = @year + 1
			end
			else
			begin
				if (@day > 28)
				begin
				      	select @day = 28
				end

				select @month = @month + 1
			end

			select @date_string = convert(varchar(2), @month)+ '/' + convert(varchar(2),@day) + '/' + convert(varchar(4), @year)
      			select @effective_date = convert(datetime, @date_string)
		end
		else if (@count = 1)
		begin
 			select @tax_due1 = @base_tax
			select @disc_pi1 = @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
			select @att_fee1 = @attorney_fee

			select @month = DATEPART(month, @effective_date)
			select @day   = DATEPART(day,   @effective_date)
			select @year  = DATEPART(year,  @effective_date)

			if (@month = 12)
			begin
				select @month = 1
				select @year  = @year + 1
			end
			else
			begin
				if (@day > 28)
				begin
				      	select @day = 28
				end

				select @month = @month + 1
			end

			select @date_string = convert(varchar(2), @month)+ '/' + convert(varchar(2),@day) + '/' + convert(varchar(4), @year)
       			select @effective_date = convert(datetime, @date_string)
		end
		else if (@count = 2)
		begin
 			select @tax_due2 = @base_tax
			select @disc_pi2 = @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
			select @att_fee2 = @attorney_fee
		end

		select @count = @count + 1	
		
 		
	end
 	
	if (@tax_due > 0)  
	begin

select tax_id = @input_tax_cert_id,
          fee_id =	@input_fee_id,
	 prop_id = 	@input_prop_id,
	owner_id = 	@owner_id,
	tax_yr =  	@sup_tax_yr,
	entity_id =	@entity_id,
	entity_cd = 	@entity_cd,
	 bill_id = 	@bill_id,
	 stmnt_id =	@stmnt_id

		insert into prop_tax_cert_info
		(
	 	tax_cert_id,
		fee_id,
	 	prop_id,
		owner_id,
	 	tax_yr,
		entity_id,
	 	entity_cd,
		bill_id,
	 	stmnt_id,
		tax_due,
		disc_pi,
	 	att_fee,
	 	tax_due1,
	 	disc_pi1,
	 	att_fee1,
	 	tax_due2,
	 	disc_pi2,
	 	att_fee2
		)
		values
		(
	 	@input_tax_cert_id,
		@input_fee_id,
	 	@input_prop_id,
		@owner_id,
	 	@sup_tax_yr,
		@entity_id,
	 	@entity_cd,
	 	@bill_id,
	 	@stmnt_id,
	 	@tax_due,
	 	@disc_pi,
	 	@att_fee,
	 	@tax_due1,
	 	@disc_pi1,
	 	@att_fee1,
	 	@tax_due2,
	 	@disc_pi2,
	 	@att_fee2
		)
	end
 
 FETCH NEXT FROM  PROPERTY_BILL into @entity_cd,  	@owner_id, 
	@entity_id,
	@bill_id,   
	@stmnt_id,
        @prop_id,
       	@sup_tax_yr,
	@sup_num
   end


CLOSE PROPERTY_BILL
DEALLOCATE PROPERTY_BILL

GO

