import os
import math
import pandas as pd
import arcpy
from utils import OrientedImagery


class SampleInputType:

    def input_data_schema(self) -> dict:
        """Define the input data for the tool."""
        return {
            "CSV File": {"required": True},
            "Image Folder": {"required": True},
            "Image Extension": {"required": True},
        }

    def auxiliary_parameters(self) -> dict:
        """Define the auxiliary parameters for the tool."""
        return {
            "Average Ground Elevation": "0",
        }

    def oriented_imagery_fields(
        self, params: dict, aux_params: dict
    ) -> tuple[list[str], list[dict]]:
        """Define the input schema for the tool."""
        standard_fields = [
            "SHAPE@",
            "Name",
            "ImagePath",
            "AcquisitionDate",
            "CameraHeading",
            "CameraPitch",
            "CameraRoll",
            "HorizontalFieldOfView",
            "VerticalFieldOfView",
            "CameraHeight",
            "FarDistance",
            "NearDistance",
            "OrientedImageryType",
            "CameraOrientation",
            "ImageRotation",
        ]
        additional_fields = [{"field_name": "CameraDirection", "field_type": "TEXT"}]
        return standard_fields, additional_fields

    def oriented_imagery_properties(self, params: dict, aux_params: dict) -> dict:
        """Define the default properties for the tool."""
        return {
            "orientedImageryType": "Oblique",
            "cameraPitch": 45,
            "cameraRoll": 0,
            "cameraHeight": 200,
            "horizontalFieldOfView": 60,
            "verticalFieldOfView": 40,
            "nearDistance": 1,
            "farDistance": 500,
            "maximumDistance": 2000,
        }

    def oriented_imagery_records(self, params: dict, aux_params: dict):
        """Generate the oriented imagery records."""
        oi = OrientedImagery()
        input_data = params["CSV File"]
        image_folder = params["Image Folder"]
        image_extension = str(params["Image Extension"]).lower().lstrip(".")

        input_records = pd.read_csv(input_data)

        for record_ind in input_records.index:
            epsg_code = input_records["SRS"][record_ind]
            srs = arcpy.SpatialReference(int(input_records["SRS"][record_ind]))
            image_type = input_records["OrientedImageryType"][record_ind]

            image_name = str(input_records["Name"][record_ind])
            image_name = image_name + "." + image_extension
            ext_rotation = input_records["Rotation"][record_ind]

            in_omega = float(input_records["Omega"][record_ind])
            in_phi = float(input_records["Phi"][record_ind])
            in_kappa = float(input_records["Kappa"][record_ind]) - ext_rotation
            direction = input_records["Camera Direction"][record_ind]

            if "http" in image_folder:
                image_path = image_folder+"/"+direction+"/"+image_name
            else:
                image_path = os.path.join(image_folder,direction,image_name)

            x = float(input_records["X"][record_ind])
            y = float(input_records["Y"][record_ind])
            z = float(input_records["Z"][record_ind])

            camera_point = arcpy.Point(x, y, z)
            camera_point_geom = arcpy.PointGeometry(camera_point, srs)

            rotation_matrix = oi.rotation_matrix(
                [[in_omega, "x", True], [in_phi, "y", True], [in_kappa, "z", True]],
                True,
            )

            out_HPR = oi.get_HPR(rotation_matrix)
            heading = out_HPR["heading"]
            pitch = out_HPR["pitch"]
            roll = out_HPR["roll"]

            hfov, vfov = oi.get_fov(
                input_records["Width"][record_ind],
                input_records["Height"][record_ind],
                input_records["Focal Length"][record_ind],
                ext_rotation,
            )

            if aux_params["Average Ground Elevation"]:
                ground_elevation = float(aux_params["Average Ground Elevation"])
            else:
                ground_elevation = 0

            if "Relative Altitude" in input_records.columns:
                camera_height = float(input_records["Relative Altitude"][record_ind])
            else:
                camera_height = z * srs.metersPerUnit - ground_elevation
            near_distance = oi.get_neardistance(camera_height, pitch, vfov)
            far_distance = oi.get_fardistance(camera_height, pitch, vfov)

            out_OPK = oi.get_OPK(rotation_matrix)
            omega = out_OPK["omega"]
            phi = out_OPK["phi"]
            kappa = out_OPK["kappa"]

            camera_intrinsics = self._get_camera_intrinsics(
                record_ind, input_records, ext_rotation
            )
            camera_orientation = (
                f"2|{epsg_code}||{x}|{y}|{z}|{omega}|{phi}|{kappa}|" + camera_intrinsics
            )

            yield {
                "SHAPE@": camera_point_geom,
                "Name": str(input_records["Name"][record_ind]),
                "ImagePath": image_path,
                "AcquisitionDate": input_records["AcquisitionDate"][record_ind],
                "CameraHeading": heading,
                "CameraPitch": pitch,
                "CameraRoll": roll,
                "HorizontalFieldOfView": hfov,
                "VerticalFieldOfView": vfov,
                "CameraHeight": camera_height,
                "FarDistance": far_distance,
                "NearDistance": near_distance,
                "CameraOrientation": camera_orientation,
                "OrientedImageryType": image_type,
                "ImageRotation": ext_rotation,
                "CameraDirection": direction,
            }

    def _get_camera_intrinsics(self, record_ind, input_records, ext_rotation):
        pixel_size = input_records["PixelSize"][record_ind]
        width = input_records["Width"][record_ind]
        height = input_records["Height"][record_ind]
        ppa_x = input_records["PPA_X"][record_ind]
        ppa_y = input_records["PPA_Y"][record_ind]

        image_width = abs(
            width * math.cos(ext_rotation) - height * math.sin(ext_rotation)
        )
        image_height = abs(
            width * math.sin(ext_rotation) + height * math.cos(ext_rotation)
        )

        focal_length = input_records["Focal Length"][record_ind]

        ppx = ppa_x * math.cos(ext_rotation) - ppa_y * math.sin(ext_rotation)
        ppy = ppa_x * math.sin(ext_rotation) + ppa_y * math.cos(ext_rotation)
        a0 = image_width / (2 * pixel_size)
        a1 = 1 / pixel_size
        a2 = 0
        b0 = image_height / (2 * pixel_size)
        b1 = 0
        b2 = -1 / pixel_size

        return f"{a0}|{a1}|{a2}|{b0}|{b1}|{b2}|{focal_length}|{ppx}|{ppy}|0|0|0|0|0"
