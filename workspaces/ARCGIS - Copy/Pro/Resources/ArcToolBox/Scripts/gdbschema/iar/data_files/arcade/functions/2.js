function two_point_list_to_angles(two_point_list) {
  var all_angles = [];
  var calc_angle;
  for (var i in two_point_list) {
    var from_point = two_point_list[i][0];
    var to_point = two_point_list[i][1];
    calc_angle = Angle(from_point, to_point);
    // Add 360 to make angle positive, then mod by 180 so angle is always the same direction
    calc_angle = Round((calc_angle + 360) % 180);
    Push(all_angles, {
      'angle': calc_angle,
      'points': [from_point, to_point]
    });
  }
  return all_angles;
}

function line_to_two_list(line_geo) {
  if (TypeOf(line_geo) == 'Feature') {
    line_geo = Geometry(line_geo);
  }
  var two_point_list = [];
  for (var p = 0; p < Count(line_geo.paths); p++) {
    for (var j = 0; j < Count(line_geo.paths[p]) - 1; j++) {
      Push(two_point_list, [
        line_geo.paths[p][j],
        line_geo.paths[p][j + 1]
      ]);
    }
  }
  return two_point_list;
}

function find_intersecting_lines_by_angle(current_feat, search_distance, feat_set) {
  // percent inspected as a decimal
  var factor_to_include = 0.30;
  // Values are in the linear unit of the data
  var alway_eval_length = 5;
  var tolerance_degree = 15;
  var two_point_list = line_to_two_list(Geometry(current_feat));
  var current_feature_angle_info = two_point_list_to_angles(two_point_list);
  var intersecting_ids = {};
  var buff_geo = Buffer(current_feat, search_distance, 'meters');
  for (var intersect_feat in Intersects(feat_set, buff_geo)) {
    var intersect_geo = Geometry(intersect_feat);
    var intersect_length = length(intersect_geo);
    // If the feature is smaller than the threshold, alway include it, this supports a segment with visual distance
    if (intersect_length <= alway_eval_length) {
      intersecting_ids[intersect_feat.globalid] = {
        'inspect_length': intersect_length,
        'total_length': intersect_length,
        'always_eval_criteria': true,
        'percentage': 100
      };
      //Push(intersecting_ids, {'globalid': intersect_feat.globalid, 'length': intersect_length});
      continue;
    }
    // Intersect to clip the line with the buffer
    var clipped_feat = Intersection(intersect_geo, buff_geo);
    var clipped_length = length(clipped_feat);
    // If the clipped segment is smaller original by a factor, continue
    var use_percent = false;
    if (use_percent == true && (clipped_length / intersect_length < factor_to_include)) {
      continue;
    } else if (use_percent == false && intersect_length < alway_eval_length) {
      continue;
    }
    // Get the list of angles and points for each segment in the target
    var target_feature_angle_info = two_point_list_to_angles(line_to_two_list(clipped_feat));
    var id_stored = false;
    // Loop over the segments in edited feature and the target candidates, if a segment follows the same plane and
    // is with the distance, add the globalid
    for (var i in target_feature_angle_info) {
      if (id_stored) {
        id_stored = false;
        break;
      }
      for (var j in current_feature_angle_info) {
        var angle_dif = Abs(target_feature_angle_info[i].angle - current_feature_angle_info[j].angle);
        if (angle_dif <= tolerance_degree || angle_dif >= (180 - tolerance_degree)) {
          var dist_apart = Distance(target_feature_angle_info[i].points, current_feature_angle_info[j].points);

          if (dist_apart > search_distance * 2) {
            continue;
          }
          intersecting_ids[intersect_feat.globalid] = {
            'inspect_length': clipped_length,
            'total_length': intersect_length,
            'always_eval_criteria': false,
            'percentage': Round(clipped_length / intersect_feat * 100, 2)
          };
          //Push(intersecting_ids,  {'globalid': intersect_feat.globalid, 'length': clipped_length});
          id_stored = true;
          break;
        }
      }
    }
  }
  return intersecting_ids;
}

function transpose_feature_set(feature_set) {
  // Converts a feature set (row-store) to a dictionary of rows (column-store)

  // Get the field names from the FeatureSet and create an array of arrays of the same length.
  var columns = [];
  var fields = [];
  var field_info = Schema(feature_set).fields;
  for (var i in field_info) {
    Push(columns, []);
    Push(fields, field_info[i].name);
  }

  for (var row in feature_set) {
    for (var j in fields) {
      Push(columns[j], row[fields[j]]);
    }
  }

  var lookup = {};
  for (var k in fields) {
    lookup[fields[k]] = columns[k];
  }
  return lookup;
}


function apply_merge_rule(rule, delimiter, data) {
  // Applies rule to data array

  // Nulls are always excluded from calculations.
  data = Filter(data, not_null);
  if (IsEmpty2(data)) {
    return null;
  }

  // Assume array is a homogenous data type.
  var first_val = data[0];
  var data_type = TypeOf(data[0]);

  var DateFunc = Decode(data_type, 'Date', Date, 'DateOnly', DateOnly, 'Time', Time, null);
  var StatFunc = Decode(rule, 'Min', Min, 'Max', Max, 'Mean', Average, null);

  if (rule == 'Count') {
    return Count(data);
  } else if (rule == 'First') {
    return data[0];
  } else if (rule == 'Last') {
    return data[-1];
  } else if (rule == 'Join') {
    return Concatenate(data, delimiter);
  } else if (StatFunc != null) {
    if (data_type == 'Number') {
      return StatFunc(data);
    } else if (DateFunc != null) {
      // Convert dates to number for statistic and then back to date.
      var date_val = DateFunc(StatFunc(Map(data, Number)));
      if (data_type == 'Date') {
        // Remove timezone if input is naïve, otherwise convert to UTC.
        return IIf(
          TimeZone(first_val) == 'Unknown',
          ChangeTimeZone(ToUTC(date_val), 'Unknown'),
          ToUTC(date_val)
        );
      } else {
        return date_val;
      }
    } else {
      return null;
    }
  } else if (rule == 'Range') {
    if (data_type == 'Number') {
      return Max(data) - Min(data);
    } else if (data_type == 'Time') {
      var total_ms = Map(data, Number);
      return Time(Max(total_ms) - Min(total_ms));
    } else {
      return null;
    }
  } else if (rule == 'Sum') {
    if (data_type == 'Number') {
      return Sum(data);
    } else {
      return null;
    }
  }

  if (data_type != 'Number') {
    return null;
  }

  var val;
  if (rule == 'StDev') {
    val = StDev(data);
  } else if (rule == 'Median') {
    data = Sort(data);
    var n = Count(data);
    val = IIf(n % 2 == 0, Average(data[n / 2 - 1], data[n / 2]), data[(n - 1) / 2]);
  } else if (rule == 'Mode') {
    data = Sort(data);
    var counter = 0;
    var prev = data[0];
    var hi_count = 1;
    var hi_val = prev;
    for (var i in data) {
      if (data[i] == prev) {
        if (++counter > hi_count) {
          hi_count = counter;
          hi_val = data[i];
        }
      } else {
        counter = 1;
      }
      prev = data[i];
    }
    val = hi_val;
  } else {
    return null;
  }

  return IIf(IsNan(val), null, val);

}

function find_closest_feature(fs, search_details) {
  var candidates = Intersects(fs, Buffer($feature, search_details.distance, search_details.units));
  var shortest = [Infinity, null];

  for (var feat in candidates) {
    var d = Distance($feature, feat);
    if (d < shortest[0]) {
      shortest = [d, feat];
    }
  }
  //TODO Return a dict with feat and distnace
  return shortest[-1];
}


function get_point_along_location(pull_back, is_proportional, from_start) {
  //This only works on 2 point lines

  // Calculate the location of the distance, using percentage.  Return the point and the distance from the start
  var percent_along;
  if (is_proportional == true || is_proportional == 1) {
    percent_along = pull_back / 100;
  } else {
    percent_along = Min([1, pull_back / lateral_line_length]);
  }
  var a = start_point;
  var b = end_point;

  var x1 = a.X;
  var y1 = a.Y;
  var z1 = a.Z;
  var x2 = b.X;
  var y2 = b.Y;
  var z2 = b.z;
  var dx = (x2 - x1) * percent_along;
  var dy = (y2 - y1) * percent_along;
  var dz = (z2 - z1) * percent_along;
  if (from_start) {
    return [Point({
      x: x1 + dx,
      y: y1 + dy,
      z: z1 + dz,
      spatialReference: spat_ref
    }), lateral_line_length * percent_along];
  } else {
    return [Point({
      x: x2 - dx,
      y: y2 - dy,
      z: z2 - dz,
      spatialReference: spat_ref
    }), lateral_line_length - (lateral_line_length * percent_along)];
  }
}

function create_line(point_list) {
  var path_coords = [];
  for (var i in point_list) {
    var pnt = point_list[i];
    Push(path_coords, [pnt.X, pnt.Y, pnt.Z]);
  }
  return Polyline({
    'paths': [path_coords],
    'hasZ': true,
    'spatialReference': spat_ref
  });

}

function distance_to_coord(x, y, x1, y1) {

  var dx = x - x1;
  var dy = y - y1;
  return Sqrt(dx * dx + dy * dy);
}

function pDistance_with_ZM(x, y, x1, y1, z1, m1, x2, y2, z2, m2) {
  // adopted from https://stackoverflow.com/a/6853926
  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = -1;
  if (len_sq != 0) //in case of 0 length line
    param = dot / len_sq;

  var line_length = Sqrt(len_sq);
  var xx, yy, zz, mm;
  var is_vertex = true;
  mm = null;

  if (param < 0) {
    //Start of the line
    xx = x1;
    yy = y1;
    zz = z1;
    mm = m1;
  } else if (param > 1) {
    //End  of the line
    xx = x2;
    yy = y2;
    zz = z2;
    mm = m2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
    dx = xx - x1;
    dy = yy - y1;
    var distance_to_coord = Sqrt(Abs(dx * dx + dy * dy));
    zz = Round((z2 - z1) * (distance_to_coord / line_length), round_Z_value_factor);
    if (m1 == null || IsNan(m1) || m2 == null || IsNan(m2)) {
      mm = null;
    } else {
      mm = (m2 - m1) * (distance_to_coord / line_length);
    }
    is_vertex = false;
  }

  var dx = x - xx;
  var dy = y - yy;
  // Note, this distance is the distance the point away from the line
  return [Sqrt(dx * dx + dy * dy), [xx, yy, zz, mm], is_vertex];
}

function coordinate_to_xyzm(coordinate, hasZ, hasM) {
  var x, y;
  var z = 0;
  var m = null;

  if (TypeOf(coordinate) == 'Point') {
    x = coordinate.x;
    y = coordinate.y;
    if (hasZ) {
      z = coordinate.z;
    }
    if (hasM) {
      m = coordinate.m;
    }
  } else {
    x = coordinate[0];
    y = coordinate[1];
    if (hasZ) {
      z = coordinate[2];
    }
    if (hasM && hasZ) {
      m = coordinate[3];
    } else if (hasM) {
      m = coordinate[2];
    }
  }
  return [x, y, z, m];
}

function pad_string(val, pad) {
  if (IsEmpty(pad) || IsEmpty(val)) {
    return Text(val);
  }
  return Right(Text(pad) + Text(val), Max([Count(Text(pad)), Count(Text(val))]));
}


function apply_sql_spatial_filter(feature_set, options) {
  // Applies optional spatial/attribute filters and OrderBy clause to feature_set.
  var spatialFilter = Decode(
    Lower(DefaultValue(options, 'spatial_operator', '')),
    'intersects', Intersects,
    'contains', Contains,
    'crosses', Crosses,
    'envelopeintersects', EnvelopeIntersects,
    'intersects', Intersects,
    'overlaps', Overlaps,
    'touches', Touches,
    'within', Within,
    null
  );

  var geo = DefaultValue(options, 'input_geometry', null);
  if (!IsEmpty(spatialFilter) && !IsEmpty2(geo)) {
    if (!IsEmpty(DefaultValue(options, 'search_distance', null))) {
      geo = Buffer(geo, options.search_distance, get_unit_code(options.search_units));
    }
    feature_set = spatialFilter(feature_set, geo);
  }
  if (!IsEmpty(DefaultValue(options, 'where_clause', null))) {
    feature_set = Filter(feature_set, options.where_clause);
  }
  if (!IsEmpty(DefaultValue(options, 'order_by_clause', null))) {
    feature_set = OrderBy(feature_set, options.order_by_clause);
  }
  return feature_set;
}

function apply_match_fields_filter(fs, match_fields) {
  for (var i in match_fields) {
    var match_field = match_fields[i];
    var field_value = $feature[match_field['input_field']];
    fs = Filter(fs, `${match_field['target_field']} = @field_value`);
  }
  return fs;
}

function points_coincident(a, b) {
  // Coincidence check with tolerances. Assumes a and b are in the same spatial reference.
  var xy_tol = ~XY_TOL;
  var z_tol = ~Z_TOL;
  if (Abs(b.Z - a.Z) >= z_tol) return false;
  var dist = Sqrt(Pow(b.X - a.X, 2) + Pow(b.Y - a.Y, 2));
  return dist <= xy_tol;
}
