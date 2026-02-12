import os

import arcpy

from ..field_map import SimpleFieldMappings


class SpatialJoin:
    def __init__(self, classes: list, field_map: SimpleFieldMappings | arcpy.FieldMappings):
        self.classes = classes
        if isinstance(field_map, arcpy.FieldMappings):
            field_map = SimpleFieldMappings.from_arcpy(field_map)
        self.fms = field_map

        self.feature_sets: dict = {}

    def create_field_map(self) -> dict[str, dict]:
        lookup = {}
        for fm in self.fms.fieldMappings:
            field_map = {}
            for field in fm.inputFields:
                field_map.setdefault(os.path.basename(field.table), []).append(field.field)

            if field_map:  # Need at least 1 input field.
                lookup[fm.outputField.name] = dict(action=fm.mergeRule, delimiter=fm.delimiter, target_fields=field_map)
        return lookup

    def rule_settings(self) -> dict:
        fm = []
        for source_field, mapping in self.create_field_map().items():
            target: dict[str, list[str]] = mapping.pop("target_fields")
            target_fields = [dict(class_name=k, target_fields=v) for k, v in target.items()]
            fm.append(dict(source_field=source_field, **mapping, field_map=target_fields))

        classes = []
        for fs, fs_info in self.create_feature_sets().items():
            classes.append(dict(class_name=fs, **fs_info))

        return dict(field_mappings=fm, target_classes=classes)

    @staticmethod
    def convert_geom_type(geometry: str):
        from .. import template

        geo = template.Geometry()

        if geometry == "START":
            return geo.paths[0][0]
        elif geometry == "END":
            return geo.paths[-1][-1]
        elif geometry == "CENTROID":
            return template.ArcadeFunction("Centroid", geo)

        return geo

    def create_feature_sets(self) -> dict[str, dict]:
        from .. import template
        from locale import atof

        # Find all unique fields from join classes
        field_lookup: dict[str, set[str]] = {}
        for info in self.create_field_map().values():
            for fc, mapping in info["target_fields"].items():
                field_lookup.setdefault(fc, set()).update(mapping)

        lookup = {}
        for row in self.classes:
            if isinstance(row, list | tuple):
                fc, geom_type, operator, search = row
            else:
                fc = row
                geom_type = "GEOMETRY"
                operator = "INTERSECTS"
                search = None

            if search:
                radius, units = search.split(" ")
                radius = atof(radius)
            else:
                radius = units = None

            desc = arcpy.Describe(fc, "FeatureClass")
            key = table_name = desc.name
            if not isinstance(fc, str):
                key = fc.longName  # Layer
            if key not in field_lookup:
                continue
            lookup[key] = dict(
                where_clause=None,
                order_by_clause=f"{getattr(desc, 'oidFieldName', '').casefold()} ASC",
                spatial_operator=operator.title(),
                search_distance=radius,
                search_units=units,
                input_geometry=self.convert_geom_type(geom_type),
            )
            self.feature_sets[key] = template.FeatureSetByName(table_name, fields=sorted(field_lookup[key]))

        return lookup
