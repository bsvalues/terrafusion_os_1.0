

CREATE PROCEDURE SetHB366Exemption
@input_yr	numeric(4)

AS


exec dbo.TriggerEnable 'property_exemption', 0


--Declare stored procedure variables
declare	@exmpt_type_cd		varchar(5)
declare @owner_id		int
declare @main_owner_id		int
declare @child_owner_id		int
declare @owner_assessed_val	int
declare @sum_amt		int
declare @entity_id		int

--Initialize stored procedure variables
set @exmpt_type_cd 	= 'EX366'
set @sum_amt		= 0

--First delete all of the exemption records with a exmpt_type_cd = 'EX366' for a given year...
delete from property_special_entity_exemption
from	prop_supp_assoc
where	prop_supp_assoc.owner_tax_yr			= @input_yr
and	property_special_entity_exemption.prop_id	= prop_supp_assoc.prop_id
and	property_special_entity_exemption.owner_tax_yr	= prop_supp_assoc.owner_tax_yr
and	property_special_entity_exemption.sup_num	= prop_supp_assoc.sup_num
and 	property_special_entity_exemption.exmpt_type_cd = @exmpt_type_cd

delete from property_exemption
from	prop_supp_assoc
where	prop_supp_assoc.owner_tax_yr		= @input_yr
and	property_exemption.prop_id		= prop_supp_assoc.prop_id
and	property_exemption.owner_tax_yr		= prop_supp_assoc.owner_tax_yr
and	property_exemption.sup_num		= prop_supp_assoc.sup_num
and 	property_exemption.exmpt_type_cd 	= @exmpt_type_cd

insert into property_exemption
(
	prop_id,
	owner_id,
	exmpt_tax_yr,
	owner_tax_yr,
	sup_num,
	prop_type_cd,
	exmpt_type_cd,
	sp_value_type,
	sp_value_option
)
select 	distinct
	prop_supp_assoc.prop_id,
      	owner.owner_id,
	@input_yr,
	@input_yr,
	prop_supp_assoc.sup_num,
	property.prop_type_cd,
	'EX366',
	'P',
	'M'
from	hb366_vw, prop_supp_assoc, owner, property, property_val, entity_prop_assoc
where	hb366_vw.owner_tax_yr		= @input_yr
and     hb366_vw.owner_id 		= owner.owner_id
and	hb366_vw.owner_tax_yr		= owner.owner_tax_yr
and	owner.prop_id			= prop_supp_assoc.prop_id
and	owner.sup_num			= prop_supp_assoc.sup_num
and	owner.owner_tax_yr		= prop_supp_assoc.owner_tax_yr
and	prop_supp_assoc.prop_id         = property.prop_id		
and	(property.prop_type_cd		= 'MN' OR property.prop_type_cd = 'P')
and	property_val.prop_id		= prop_supp_assoc.prop_id
and	property_val.sup_num		= prop_supp_assoc.sup_num
and	property_val.prop_val_yr	= prop_supp_assoc.owner_tax_yr
and	property_val.prop_inactive_dt is null
and     property_val.prop_id = entity_prop_assoc.prop_id
and     property_val.sup_num = entity_prop_assoc.sup_num
and     property_val.prop_val_yr = entity_prop_assoc.tax_yr
and     entity_prop_assoc.entity_id = hb366_vw.entity_id
and	not exists (select *
		   from property_exemption
		   where prop_id         = prop_supp_assoc.prop_id
		   and     owner_id      = hb366_vw.owner_id
		   and     exmpt_tax_yr  = hb366_vw.owner_tax_yr
		   and     owner_tax_yr  = hb366_vw.owner_tax_yr
		   and     sup_num 	 = prop_supp_assoc.sup_num
           and     exmpt_type_cd = 'EX'
		   and     effective_dt is null and termination_dt is null) 


insert into property_special_entity_exemption
(
	prop_id,     
	owner_id,    
	sup_num,     
	exmpt_tax_yr, 
	owner_tax_yr, 
	exmpt_type_cd, 
	entity_id,   
	sp_amt,           
	sp_pct
)
select 	distinct
	prop_supp_assoc.prop_id,
      	owner.owner_id,
	prop_supp_assoc.sup_num,
	@input_yr,
	@input_yr,
	'EX366',
	hb366_vw.entity_id,
	0,
	100
from	hb366_vw, prop_supp_assoc, owner, property, property_val, entity_prop_assoc
where	hb366_vw.owner_tax_yr		= @input_yr
and     hb366_vw.owner_id 		= owner.owner_id
and	hb366_vw.owner_tax_yr		= owner.owner_tax_yr
and	owner.prop_id			= prop_supp_assoc.prop_id
and	owner.sup_num			= prop_supp_assoc.sup_num
and	owner.owner_tax_yr		= prop_supp_assoc.owner_tax_yr
and	prop_supp_assoc.prop_id         = property.prop_id		
and	(property.prop_type_cd		= 'MN' OR property.prop_type_cd = 'P')
and	property_val.prop_id		= prop_supp_assoc.prop_id
and	property_val.sup_num		= prop_supp_assoc.sup_num
and	property_val.prop_val_yr	= prop_supp_assoc.owner_tax_yr
and	property_val.prop_inactive_dt is null
and     property_val.prop_id = entity_prop_assoc.prop_id
and     property_val.sup_num = entity_prop_assoc.sup_num
and     property_val.prop_val_yr = entity_prop_assoc.tax_yr
and     entity_prop_assoc.entity_id = hb366_vw.entity_id
/*and	exists 	(select *
          	from entity_prop_assoc
         	where prop_id    = prop_supp_assoc.prop_id
        	and     sup_num = prop_supp_assoc.sup_num
             	and     tax_yr      = prop_supp_assoc.owner_tax_yr
		and     entity_id  = hb366_vw.entity_id) */
and	exists (select *
		   from property_exemption
		   where prop_id         = prop_supp_assoc.prop_id
		   and     owner_id      = hb366_vw.owner_id
		   and     exmpt_tax_yr  = hb366_vw.owner_tax_yr
		   and     owner_tax_yr  = hb366_vw.owner_tax_yr
		   and     sup_num 	 = prop_supp_assoc.sup_num
           and     exmpt_type_cd = 'EX366')	 


/*
--Now go get all the owner who do have links and update the properties a necessary.
DECLARE HB366_W_LINKS_VW SCROLL CURSOR
FOR select main_owner_id, owner_assessed_val, entity_id
from HB366_W_LINKS_VW
where owner_tax_yr	= @input_yr

OPEN HB366_W_LINKS_VW
FETCH NEXT FROM HB366_W_LINKS_VW into @main_owner_id, @owner_assessed_val, @entity_id

while (@@FETCH_STATUS = 0)
begin
	set @sum_amt = @sum_amt + @owner_assessed_val

	if (@sum_amt < 500)
	begin
		select 	@owner_assessed_val = owner_assessed_val
		from 	HB366_MAIN_OWNER_VW
		where  	owner_id 	= @main_owner_id
		and	owner_tax_yr	= @input_yr
		and       entity_id		= @entity_id

		set @sum_amt = @sum_amt + @owner_assessed_val

		if (@sum_amt < 500)
		begin
			--If we made it this far then the sum of the children plus the main owner is <= $500.
			--Therefore we need to place an exemption on all the appropriate property.

			--select comment = 'Granting EX366 Exemption'			
			--select owner_id = @main_owner_id
			
			insert into property_exemption
			(
				prop_id,
				owner_id,
				exmpt_tax_yr,
				owner_tax_yr,
				sup_num,
				prop_type_cd,
				exmpt_type_cd,
				sp_value_type,
				sp_value_option
			)
			select 	prop_supp_assoc.prop_id,
		      		@main_owner_id,
				@input_yr,
				@input_yr,
				prop_supp_assoc.sup_num,
				property.prop_type_cd,
				@exmpt_type_cd,
				'M',
				'P'
			from	prop_supp_assoc, owner, property, property_val
			where	owner.owner_id			= @main_owner_id
			and	owner.owner_tax_yr		= @input_yr
			and	owner.prop_id			= prop_supp_assoc.prop_id
			and	owner.sup_num			= prop_supp_assoc.sup_num
			and	owner.owner_tax_yr		= prop_supp_assoc.owner_tax_yr
			and	prop_supp_assoc.prop_id         = property.prop_id		
			and	(property.prop_type_cd		= 'MN' OR property.prop_type_cd = 'P')
			and	property_val.prop_id		= prop_supp_assoc.prop_id
			and	property_val.sup_num		= prop_supp_assoc.sup_num
			and	property_val.prop_val_yr	= prop_supp_assoc.owner_tax_yr
			and	property_val.prop_inactive_dt is null
			and	exists 	(select *
		          			from entity_prop_assoc
		         			where prop_id    = prop_supp_assoc.prop_id
		        			and     sup_num = prop_supp_assoc.sup_num
		         		   	and     tax_yr      = prop_supp_assoc.owner_tax_yr
					and     entity_id  = @entity_id)
			and	not exists (select *
			   		    from property_exemption
			   		where prop_id = prop_supp_assoc.prop_id
			   		and     owner_id = @main_owner_id
			  		and     exmpt_tax_yr = @input_yr
			   		and     owner_tax_yr = @input_yr
			   		and     sup_num = prop_supp_assoc.sup_num
		                		and     exmpt_type_cd = @exmpt_type_cd)
	

			insert into property_special_entity_exemption
			(
				prop_id,
				owner_id,
				sup_num,
				exmpt_tax_yr,
				owner_tax_yr,
				exmpt_type_cd,
				entity_id,
				sp_amt,
				sp_pct
			)
			select 	prop_supp_assoc.prop_id,
	      			@main_owner_id,
				prop_supp_assoc.sup_num,
				@input_yr,
				@input_yr,
				@exmpt_type_cd,
				@entity_id,
				0,
				100
			from	prop_supp_assoc, owner, property, property_val
			where	owner.owner_id			= @main_owner_id
			and	owner.owner_tax_yr		= @input_yr

			and	owner.prop_id			= prop_supp_assoc.prop_id
			and	owner.sup_num			= prop_supp_assoc.sup_num
			and	owner.owner_tax_yr		= prop_supp_assoc.owner_tax_yr
			and	prop_supp_assoc.prop_id         = property.prop_id		
			and	(property.prop_type_cd		= 'MN' OR property.prop_type_cd = 'P')
			and	property_val.prop_id		= prop_supp_assoc.prop_id
			and	property_val.sup_num		= prop_supp_assoc.sup_num
			and	property_val.prop_val_yr	= prop_supp_assoc.owner_tax_yr
			and	property_val.prop_inactive_dt is null
			and	exists 	(select *
		          			from entity_prop_assoc
		         			where prop_id    = prop_supp_assoc.prop_id
		        			and     sup_num = prop_supp_assoc.sup_num
		             			and     tax_yr      = prop_supp_assoc.owner_tax_yr
					and     entity_id  = @entity_id)
			and	exists (select *
			   		from property_exemption
			   		where prop_id = prop_supp_assoc.prop_id
			   		and     owner_id = @main_owner_id
			  		and     exmpt_tax_yr = @input_yr
			   		and     owner_tax_yr = @input_yr
			   		and     sup_num = prop_supp_assoc.sup_num
		                		and     exmpt_type_cd = @exmpt_type_cd)


			--Now go update all the owners who are linked to this main_owner_id with the EX366 exemption...			
			DECLARE OWNER_LINKS_VW SCROLL CURSOR
			FOR select child_owner_id
			from owner_links
			where main_owner_id = @main_owner_id

			OPEN OWNER_LINKS_VW
			FETCH NEXT FROM OWNER_LINKS_VW into @child_owner_id

			while (@@FETCH_STATUS = 0)
			begin
				--Now go find all the properties that the owner belongs to and put an exemption on each owner.  Credit to JC for the SQL...
				
				insert into property_exemption
				(
					prop_id,
					owner_id,
					exmpt_tax_yr,
					owner_tax_yr,
					sup_num,
					prop_type_cd,
					exmpt_type_cd,
					sp_value_type,
					sp_value_option
				)
				select 	prop_supp_assoc.prop_id,
		      			@child_owner_id,
					@input_yr,
					@input_yr,
					prop_supp_assoc.sup_num,
					property.prop_type_cd,
					@exmpt_type_cd,
					'M',
					'P'
				from	prop_supp_assoc, owner, property, property_val
				where	owner.owner_id			= @child_owner_id
				and	owner.owner_tax_yr		= @input_yr
				and	owner.prop_id			= prop_supp_assoc.prop_id
				and	owner.sup_num			= prop_supp_assoc.sup_num
				and	owner.owner_tax_yr		= prop_supp_assoc.owner_tax_yr
				and	prop_supp_assoc.prop_id         = property.prop_id		
				and	(property.prop_type_cd		= 'MN' OR property.prop_type_cd = 'P')
				and	property_val.prop_id		= prop_supp_assoc.prop_id
				and	property_val.sup_num		= prop_supp_assoc.sup_num
				and	property_val.prop_val_yr	= prop_supp_assoc.owner_tax_yr
				and	property_val.prop_inactive_dt is null
				and	exists 	(select *
		          				from entity_prop_assoc
		         				where prop_id    = prop_supp_assoc.prop_id
		        				and     sup_num = prop_supp_assoc.sup_num
		         		   		and     tax_yr      = prop_supp_assoc.owner_tax_yr
						and     entity_id  = @entity_id)
				and	not exists (select *
			   		   	 from property_exemption
			   			where prop_id = prop_supp_assoc.prop_id
			   			and     owner_id = @child_owner_id
			  			and     exmpt_tax_yr = @input_yr
			   			and     owner_tax_yr = @input_yr
			   			and     sup_num = prop_supp_assoc.sup_num
		                			and     exmpt_type_cd = @exmpt_type_cd)
	

				insert into property_special_entity_exemption
				(
					prop_id,
					owner_id,
					sup_num,
					exmpt_tax_yr,
					owner_tax_yr,
					exmpt_type_cd,
					entity_id,
					sp_amt,
					sp_pct
				)
				select 	prop_supp_assoc.prop_id,
		      			@child_owner_id,
					prop_supp_assoc.sup_num,
					@input_yr,
					@input_yr,
					@exmpt_type_cd,
					@entity_id,
					0,
					100
				from	prop_supp_assoc, owner, property, property_val

				where	owner.owner_id			= @child_owner_id
				and	owner.owner_tax_yr		= @input_yr
				and	owner.prop_id			= prop_supp_assoc.prop_id
				and	owner.sup_num			= prop_supp_assoc.sup_num
				and	owner.owner_tax_yr		= prop_supp_assoc.owner_tax_yr
				and	prop_supp_assoc.prop_id         = property.prop_id		
				and	(property.prop_type_cd		= 'MN' OR property.prop_type_cd = 'P')
				and	property_val.prop_id		= prop_supp_assoc.prop_id
				and	property_val.sup_num		= prop_supp_assoc.sup_num
				and	property_val.prop_val_yr	= prop_supp_assoc.owner_tax_yr
				and	property_val.prop_inactive_dt is null
				and	exists 	(select *
		          				from entity_prop_assoc
		         				where prop_id    = prop_supp_assoc.prop_id
		        				and     sup_num = prop_supp_assoc.sup_num
		             				and     tax_yr      = prop_supp_assoc.owner_tax_yr
						and     entity_id  = @entity_id)
				and	exists (select *
			   			from property_exemption
			   			where prop_id = prop_supp_assoc.prop_id
			   			and     owner_id = @owner_id
			  			and     exmpt_tax_yr = @input_yr
			   			and     owner_tax_yr = @input_yr
			   			and     sup_num = prop_supp_assoc.sup_num
		                			and     exmpt_type_cd = @exmpt_type_cd)


				--Get the next child_owner_id if there are any left...
				FETCH NEXT FROM OWNER_LINKS_VW into @child_owner_id
			end
		
			CLOSE OWNER_LINKS_VW
			DEALLOCATE OWNER_LINKS_VW
		end
	end

	set @sum_amt = 0

	FETCH NEXT FROM HB366_W_LINKS_VW into @main_owner_id, @owner_assessed_val, @entity_id
end

CLOSE HB366_W_LINKS_VW
DEALLOCATE HB366_W_LINKS_VW

*/

--Update the effective_tax_yr column if the EX366 exemption is new for this year
--EricZ 08/08/2002
update pe
set pe.effective_tax_yr = @input_yr
from property_exemption as pe
where pe.exmpt_type_cd = 'EX366'
and pe.exmpt_tax_yr = @input_yr
and not exists
(
	select pe1.prop_id
	from property_exemption as pe1, prop_supp_assoc as psa
	where psa.prop_id = pe1.prop_id
	and psa.sup_num = pe1.sup_num
	and psa.owner_tax_yr = pe1.owner_tax_yr
	and pe1.prop_id = pe.prop_id
	and pe1.exmpt_tax_yr = (@input_yr - 1)
	and pe.exmpt_type_cd = pe1.exmpt_type_cd
)

exec dbo.TriggerEnable 'property_exemption', 1

GO

