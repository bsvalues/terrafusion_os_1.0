import numpy as np


class Rotation_Angle:
    """
    Attributes
    ---------------
    angle : float
         Rotation around a specific axis
    axis : str
        Should be specified as 'x','y' or 'z' based on the axis of single rotation
    counter_clockwise : bool
        default value True, if clockwise then False
    unit_degree : bool
        default value True, if value of angle already in radians then False

    Methods
    ---------------

    _get_angle__() -> float
        Returns the value of angle based on it's direction of rotation and in unit radians

    _elementary_rotation_matrix() -> float dtype
        Returns the rotation matrix around the specified axis and angle

    """

    def __init__(self, angle, axis, counter_clockwise=True, unit_degree=True):
        self.angle = angle
        self.axis = axis
        self.counter_clockwise = counter_clockwise
        self.degree = unit_degree

    def __get_angle(self):
        if self.degree:
            angle_value = np.radians(self.angle)
        else:
            angle_value = self.angle

        if self.counter_clockwise:
            return angle_value
        else:
            return -angle_value

    def elementary_rotation_matrix(self):
        """
        returns: Rotation matrix for specified axis (Rx,Ry or Rz)

        """
        angle = self.__get_angle()

        if self.axis == "x":
            elementary_rm = np.matrix(
                [
                    [1, 0, 0],
                    [0, np.cos(angle), -np.sin(angle)],
                    [0, np.sin(angle), np.cos(angle)],
                ]
            )
        elif self.axis == "y":
            elementary_rm = np.matrix(
                [
                    [np.cos(angle), 0, np.sin(angle)],
                    [0, 1, 0],
                    [-np.sin(angle), 0, np.cos(angle)],
                ]
            )
        elif self.axis == "z":
            elementary_rm = np.matrix(
                [
                    [np.cos(angle), -np.sin(angle), 0],
                    [np.sin(angle), np.cos(angle), 0],
                    [0, 0, 1],
                ]
            )
        else:
            raise ValueError(
                "Defined axis does not match. Please specify with x,y or z"
            )

        return elementary_rm


class OrientedImagery:
    def __init__(self):
        pass

    def __set_rotation_angle(
        self, angle: float, axis: str, counter_clockwise=True, unit_degree=True
    ):
        """Returns a Rotation angle object"""
        angle_obj = Rotation_Angle(angle, axis, counter_clockwise, unit_degree)
        return angle_obj

    def get_fov(
        self, width: float, height: float, focal_length: float, rotation: float = 0.0
    ) -> tuple:
        """Returns (hfov,vfov)"""
        new_width = abs(width * np.cos(rotation) - height * np.sin(rotation))
        new_height = abs(width * np.sin(rotation) + height * np.cos(rotation))
        hfov = 2 * np.arctan(new_width / (2 * focal_length))  # hfov in radians
        vfov = 2 * np.arctan(new_height / (2 * focal_length))
        return (np.degrees(hfov), np.degrees(vfov))

    def get_hfov(self, width: float, focal_length: float) -> float:
        """Returns the Horizontal filed of View in degrees wrt the width"""
        hfov = 2 * np.atan(width / (2 * focal_length))  # hfov in radians
        return np.degrees(hfov)

    def get_vfov(self, height: float, focal_length: float) -> float:
        """Returns the Vertical filed of View in degrees wrt the height"""
        vfov = 2 * np.atan(height / (2 * focal_length))  # vfov in radians
        return np.degrees(vfov)

    def get_neardistance(
        self, camera_height: float, camera_pitch: float, vfov: float
    ) -> float:
        """Returns the near distance value in meters"""
        if (camera_pitch - vfov / 2) <= 0:  # nadir images
            return 0
        else:
            return camera_height / np.cos(np.radians(camera_pitch - vfov / 2))

    def get_fardistance(
        self, camera_height: float, camera_pitch: float, vfov: float
    ) -> float:
        """Returns the far distance value in meters"""
        if (
            camera_pitch + vfov / 2
        ) >= 87.134:  # far distance can become asymptotically higher if image is looking near horizon
            return 20 * camera_height  # value is fixed to 20*camera_height in this case
        else:
            return camera_height / np.cos(np.radians(camera_pitch + vfov / 2))

    def rotation_matrix(self, rotation_angles: list, degree_unit=True) -> np.ndarray:
        """
        Input:  rotation_angles: List;
                     Should be specified in the sequence of order of rotation Eg: [[First_Angle...] , [Second_Angle...], [Third_Angle,...]]
                     Rotation angle around a specific axis \n
                     Axis should be specified as 'x','y' or 'z' based on the axis of single rotation\n
                     If Counter_Clockwise then provide True,else Clockwise then False\n
                     Eg: [[heading,"z",False],[pitch,"x",True],[roll,"z",False]]\n
                 rotation_unit: bool;
                     True if unit of angles is in Degrees, False if Radians

         Output: [3x3] numpy array of resultant Rotation Matrix
        """
        rmFinal = 1
        if len(rotation_angles) != 3:
            raise ValueError(
                "3 angles required to be passed, only got {}".format(len(angle))
            )

        for angle in rotation_angles:
            if len(angle) != 3:
                raise ValueError(
                    "3 parameters expected for each angle, got only {}".format(
                        len(angle)
                    )
                )
            try:
                rot_angle = self.__set_rotation_angle(
                    angle[0], angle[1], angle[2], degree_unit
                )
                elementary_rm = rot_angle.elementary_rotation_matrix()
            except UnboundLocalError:
                print("Values specified for each angle is not correct")

            rmFinal = rmFinal * elementary_rm

        return rmFinal

    def get_OPK(self, rotation_matrix: np.ndarray) -> dict:
        """Output: {"omega":<>,"phi":<>,"kappa":<>}"""
        R02 = rotation_matrix[0, 2]

        R22 = rotation_matrix[2, 2]
        R12 = rotation_matrix[1, 2]

        R01 = rotation_matrix[0, 1]
        R00 = rotation_matrix[0, 0]

        phi = np.degrees(np.arcsin(R02))

        omega = np.degrees(np.arctan2(-R12, R22))

        kappa = np.degrees(np.arctan2(-R01, R00))

        return {"omega": omega, "phi": phi, "kappa": kappa}

    def get_HPR(self, rotation_matrix: np.ndarray) -> dict:
        """Output: {"heading":<>,"pitch":<>,"roll":<>}"""
        R22 = rotation_matrix[2, 2]
        R00 = rotation_matrix[0, 0]
        R01 = rotation_matrix[0, 1]

        R02 = rotation_matrix[0, 2]
        R12 = rotation_matrix[1, 2]

        R20 = rotation_matrix[2, 0]
        R21 = rotation_matrix[2, 1]

        pitch = np.degrees(np.arccos(R22))
        if np.sin(pitch) == 0:
            roll = 0
            heading = np.degrees(np.arctan2(R01, R00))
        else:
            heading = np.degrees(np.arctan2(-R02, -R12))
            roll = np.degrees(np.arctan2(-R20, R21))

        if heading < 0:
            heading = np.mod(heading, 360)

        return {"heading": heading, "pitch": pitch, "roll": roll}

    def get_affines(
        self, image_width: float, image_height: float, pixel_size: float
    ) -> dict:
        """Output: {"A0":<>,"A1":<>,"A2":<>,"B0":<>,"B1":<>,"B2":<>}"""
        a0 = image_width / 2 - 0.5
        a1 = 1 / pixel_size
        a2 = 0
        b0 = image_height / 2 - 0.5
        b1 = 0
        b2 = -1 / pixel_size

        return {"A0": a0, "A1": a1, "A2": a2, "B0": b0, "B1": b1, "B2": b2}
