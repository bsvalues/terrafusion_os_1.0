

CREATE PROCEDURE AddRoofAdj

as
declare @imprv_yr int
declare @imprv_det_meth_cd char(5)
declare @imprv_det_type_cd char(10)
declare @imprv_det_class_cd char(10)

	declare scheds CURSOR FAST_FORWARD
	FOR	SELECT imprv_yr, imprv_det_meth_cd, imprv_det_type_cd, imprv_det_class_cd
		FROM imprv_sched
		where imprv_yr = 2003 
		and exists (select * from imprv_attr_val iav
				where imprv_sched.imprv_yr = iav.imprv_yr
				and imprv_sched.imprv_det_meth_cd = iav.imprv_det_meth_cd
				and imprv_sched.imprv_det_type_cd = iav.imprv_det_type_cd
				and imprv_sched.imprv_det_class_cd = iav.imprv_det_class_cd
				and iav.imprv_attr_id = 6)
			--and imprv_det_class_cd = 'RSB11'
			--and imprv_det_type_cd = 'MA'
			--and imprv_det_meth_cd = 'R'
		

	OPEN Scheds

	FETCH NEXT FROM Scheds INTO @imprv_yr, @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd

	WHILE @@FETCH_STATUS = 0
	BEGIN
		delete from imprv_attr_val
		where imprv_yr = @imprv_yr and
			imprv_det_meth_cd = @imprv_det_meth_cd and
			imprv_det_type_cd = @imprv_det_type_cd and
			imprv_det_class_cd = @imprv_det_class_cd and
			imprv_attr_id = 6

		select @imprv_yr, @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd

		insert into imprv_attr_val (imprv_attr_id, imprv_attr_val_cd, imprv_det_meth_cd, imprv_det_type_cd, imprv_det_class_cd, imprv_yr, imprv_attr_base_up, imprv_attr_up)
		select 6, imprv_attr_val_cd, @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, imprv_attr_base_up, imprv_attr_up from _roof_adj


		FETCH NEXT FROM Scheds INTO @imprv_yr, @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd
	END

	CLOSE Scheds
	DEALLOCATE Scheds

GO

