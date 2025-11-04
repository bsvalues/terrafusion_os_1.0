/*
where_clause (Text): The expression to filter with.
options (Array): The rotation options.
  where_clause (Text): The SQL expression to apply rotation to.
  is_geographic (Boolean): Set to true if the rotation setting is set to geographic in the layer properties.
  additional_rotation (Number): Set the counter-clockwise spin angle used for the symbol in the symbology options.
  rotate_towards (Text): When there are 2 intersecting lines, sort by orientation_field and use the min/max value.
  line_classes (Array): The classes to query.
    class_name (Text): The name of the feature set to query.
    where_clause (Text): The SQL expression to filter class_name.
    orientation_field (Text): The field to orient towards.
*/
~EXPECTS;

if (!IsEmpty(~GLOBAL_ASSIGNED_FIELD)) {
  return;
}

var feature_geometry = Geometry($feature);
if (IsEmpty2(feature_geometry)) {
  return;
}

function extract_angles(line_class) {
  var envelope = Extent(Buffer($feature, 0.01, 'meter')); // Buffer by small amount to extract segment.
  var line_fs = apply_sql_spatial_filter(
    get_feature_set(line_class.class_name), {
      'spatial_operator': 'Intersects',
      'input_geometry': Geometry($feature),
      'where_clause': line_class.where_clause,
      'order_by_clause': 'ObjectID ASC',
    }
  )

  var found_angles = [];
  var angle_value;
  var null_val = IIf(rule_settings.rotate_towards == 'max', -Infinity, Infinity);
  for (var line in line_fs) {
    var segment = Clip(line, envelope).paths[0];
    if (Equals(segment[0], feature_geometry)) {
      angle_value = Angle(segment[0], segment[1]); // start point
    } else if (Equals(segment[-1], feature_geometry)) {
      angle_value = Angle(segment[-2], segment[-1]); // end point
    } else {
      angle_value = Angle(segment[0], segment[-1]); // midspan
    }

    if (rule_settings.is_geographic) {
      angle_value = (450 - angle_value) % 360;
    }
    angle_value = (angle_value + rule_settings.additional_rotation) % 360;
    Push(found_angles, {
      'angle': angle_value,
      'orientation': DefaultValue(line[line_class.orientation_field], null_val)
    });
  }
  return found_angles;
}

function collect_angles() {
  var all_angles = [];
  var fs = features_to_featureset([$feature]);

  for (var i in rule_settings.options) {
    var options = rule_settings.options[i];
    if (count_features(fs, options.where_clause) == 1) {
      rule_settings.is_geographic = options.is_geographic;
      rule_settings.additional_rotation = options.additional_rotation;
      rule_settings.rotate_towards = options.rotate_towards;
      for (var j in options.line_classes) {
        all_angles = Splice(all_angles, extract_angles(options.line_classes[j]));
      }
      break;
    }
  }
  return all_angles
}

function angle_sort(a, b) {
  return When(
    a.orientation < b.orientation, -1,
    a.orientation > b.orientation, 1,
    0 // equal
  );
}

function main() {
  var angles = Sort(collect_angles(), angle_sort);
  if (IsEmpty2(angles)) {
    return;
  }
  return angles[IIf(rule_settings.rotate_towards == 'min', 0, -1)]['angle'];
}

return main();
