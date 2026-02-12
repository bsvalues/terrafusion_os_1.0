import arcpy
import numpy as np
import numbers


class PixelBlock:
    def __init__(self, data, extent):
        """
        PixelBlock type that has all the data/information of a pixel block in a raster.

        :param data: numpy array in ({slices}, rows, cols, bands) shape, include {slices} data for multidimensional raster pixel block.
        :param extent: arcpy.Extent
        """
        if not isinstance(data, np.ndarray):
            raise TypeError('data must be numpy array type')
        if not isinstance(extent, arcpy.Extent):
            raise TypeError('extent must be arcpy.Extent type')

        dimensions = len(data.shape)
        if not (3 <= dimensions <= 4):
            raise ValueError('data should have 4 dimensions for (slices, height, width, bands) multidimensional raster '
                             'and 3 dimensions (height, width, bands) for normal raster')

        self._data = data
        self._extent = extent

    def getData(self):
        """
        access the pixel block data as a numpy ndarray array

        :return: numpy.ndarray, a copy of the pixel block data with shape ({slices}, height, width, bands).
        """
        return np.copy(self._data)

    def _get_cell_size(self):
        """
        :return: tuple, pixel block cell size, (cell_width, cell_height)
        """
        if len(self._data.shape) == 3:
            height, width = self._data.shape[0], self._data.shape[1]
        else:
            height, width = self._data.shape[1], self._data.shape[2]

        x_min, y_min, x_max, y_max = self._extent.XMin, self._extent.YMin, self._extent.XMax, self._extent.YMax

        return (x_max - x_min)/width, (y_max-y_min)/height

    cell_size = property(fget=_get_cell_size)

    def _get_spatial_reference(self):
        """
        :return: arcpy.SpatialReference, pixel block's spatial reference
        """
        return self._extent.spatialReference

    spatial_reference = property(fget=_get_spatial_reference)

    def _get_tlc(self):
        """
        :return: arcpy.Point, top left corner
        """
        return arcpy.Point(X=self._extent.XMin, Y=self._extent.YMax)

    tlc = property(fget=_get_tlc)

    @property
    def extent(self):
        return self._extent


class PixelBlockCollection:
    def __init__(self, rasters, pixel_block_size=(512, 512), stride=None, overlay_type='INTERSECTION',
                 nodata_to_values=None):
        """
        pixel block collection that queries or iterates on a single raster or a list of rasters. The iteration or pixel block
        index origin is the top left corner of the extent. The order of iteration is left to right, top to bottom.

        index a pixel block on (y, x) tuple, i.e., collection[1, 2] will get the pixel block in the 2nd row from top to bottom
        and the 3rd col from left to right.

        each pixel block has the shape (Slice, Height, Width, Band) for multidimensional raster dataset and (Height, Width, Band)
        for normal raster dataset.

        :param rasters: arcpy.Raster or a list of arcpy.Raster
        :param pixel_block_size: tuple, pixel block size in height and width
        :param stride: tuple(tuple_y, tuple_x) or None, default is None and stride will be set as pixel_block_size,
        :param overlay_type: "INTERSECTION" or "UNION", default is "INTERSECTION". The overlay type on the list of rasters.
        :param nodata_to_values, None, numeric or list of numeric or None, the value to convert the nodata in a raster to.
                                If any element is set to None, the default NoData value in the raster will be used.
        """
        # validate overlay_type
        if overlay_type not in ['UNION', 'INTERSECTION']:
            raise ValueError("invalid iteration type, must be 'UNION' or 'INTERSECTION'")

        def check_tuple(input, param_name):
            if not isinstance(input, tuple):
                raise TypeError(param_name + ' must be a tuple of length 2')
            if len(input) != 2:
                raise ValueError(param_name + ' must be a tuple of length 2')
            for size in input:
                if not isinstance(size, int) or size <= 0:
                    raise ValueError(param_name + ' must be positive integer')

        check_tuple(pixel_block_size, 'pixel block size')
        if stride is not None:
            check_tuple(stride, 'stride')

        self.rasters = rasters if isinstance(rasters, list) else [rasters]
        self.pixel_block_size = pixel_block_size
        # check spatial reference
        self.spatial_reference = self.rasters[0].spatialReference
        for i in range(1, len(self.rasters)):
            if not self._is_same_sptail_reference(self.rasters[i].spatialReference, self.spatial_reference):
                raise ValueError("The input rasters have different spatial references")

        # check cell size
        mean_cell_height = self.rasters[0].meanCellHeight
        mean_cell_width = self.rasters[0].meanCellWidth
        for i in range(1, len(self.rasters)):
            if mean_cell_height != self.rasters[i].meanCellHeight or mean_cell_width != self.rasters[i].meanCellWidth:
                raise ValueError("The input rasters have different cell height/width")

        self.tlc = (0, 0)
        self.mean_cell_height = self.rasters[0].meanCellHeight
        self.mean_cell_width = self.rasters[0].meanCellWidth
        self.extent = self.rasters[0].extent
        if overlay_type == 'UNION':
            for i in range(1, len(self.rasters)):
                extent = self.rasters[i].extent
                x_min, y_min, x_max, y_max = extent.XMin, extent.YMin, extent.XMax, extent.YMax
                if x_min < self.extent.XMin:
                    self.extent.XMin = x_min
                if x_max > self.extent.XMax:
                    self.extent.XMax = x_max
                if y_min < self.extent.YMin:
                    self.extent.YMin = y_min
                if y_max > self.extent.YMax:
                    self.extent.YMax = y_max
        else:
            for i in range(1, len(self.rasters)):
                extent = self.rasters[i].extent
                x_min, y_min, x_max, y_max = extent.XMin, extent.YMin, extent.XMax, extent.YMax
                if x_min > self.extent.XMin:
                    self.extent.XMin = x_min
                if x_max < self.extent.XMax:
                    self.extent.XMax = x_max
                if y_min > self.extent.YMin:
                    self.extent.YMin = y_min
                if y_max < self.extent.YMax:
                    self.extent.YMax = y_max
        self.height = int((self.extent.YMax - self.extent.YMin)/self.mean_cell_height)
        self.width = int((self.extent.XMax - self.extent.XMin)/self.mean_cell_width)

        self.stride = self.pixel_block_size if stride is None else stride

        self.size = ((self.height+self.stride[0]-1)//self.stride[0],
                     (self.width + self.stride[1]-1)//self.stride[1])

        # generate index array for pixel block access
        self._index_array = np.arange(start=0, stop=self.size[0]*self.size[1])
        self._index_array_iter = np.nditer(self._index_array)

        # check nodata_to_values
        if nodata_to_values is None:
            self._nodata_to_values = [None for i in range(len(self.rasters))]
        else:
            if not isinstance(nodata_to_values, list):
                if not isinstance(nodata_to_values, numbers.Number):
                    raise TypeError('nodata_to_values must be numeric or numeric list')
                self._nodata_to_values = [nodata_to_values for i in range(len(self.rasters))]
            else:
                if len(self.rasters) != len(nodata_to_values):
                    raise ValueError('length of nodata_to_values does not equal to input rasters')
                for i in range(len(nodata_to_values)):
                    if nodata_to_values[i] is not None and not isinstance(nodata_to_values[i], numbers.Number):
                        raise TypeError('nodata_to_values must be numeric of numeric list')
                self._nodata_to_values = nodata_to_values

    def _is_same_sptail_reference(self, spatial_reference1, spatial_reference2):
        """
        compare if two arcpy.SpatailReference's are the same.
        :param spatial_reference1: type: arcpy.SpatialReference
        :param spatial_reference2: type: arcpy.SptailReference
        :return: True if they are the same, False otherwise
        """
        if spatial_reference1.exportToString() == spatial_reference2.exportToString():
            return True
        return False

    def __iter__(self):
        return self

    def __next__(self):
        next_index = next(self._index_array_iter)
        height, width = divmod(next_index, self.size[1])

        return self[(int(height), int(width))]

    def _get_pixel_blocks(self, tlc):
        if tlc[0] >= self.width or tlc[1]>=self.height:
            raise IndexError('top left corner is out of range')

        pixel_blocks = []
        for i, raster in enumerate(self.rasters):
            lower_left_x = tlc[0]*self.mean_cell_width + self.extent.XMin
            lower_left_y = self.extent.YMax - (tlc[1]+self.pixel_block_size[0])*self.mean_cell_height
            if self._nodata_to_values[i] is not None:
                pixel_block = raster.read(tlc,
                                          origin_coordinate=(self.extent.XMin, self.extent.YMax),
                                          ncols=self.pixel_block_size[1],
                                          nrows=self.pixel_block_size[0],
                                          nodata_to_value=self._nodata_to_values[i])
            else:
                pixel_block = raster.read(tlc,
                                          origin_coordinate=(self.extent.XMin, self.extent.YMax),
                                          ncols=self.pixel_block_size[1],
                                          nrows=self.pixel_block_size[0])

            top_left_x = lower_left_x
            top_left_y = self.extent.YMax - tlc[1]*self.mean_cell_height
            extent = arcpy.Extent(XMin = top_left_x, YMin = lower_left_y,
                                  XMax = top_left_x + self.mean_cell_width*self.pixel_block_size[1],
                                  YMax = top_left_y,
                                  spatial_reference=self.spatial_reference)

            pixel_block = PixelBlock(pixel_block, extent)
            pixel_blocks.append(pixel_block)
        return pixel_blocks[0] if len(self.rasters) == 1 else pixel_blocks

    def __getitem__(self, item):
        """
        access the pixel block by giving the block height and width index as a tuple. i.e. pixel_block_collection[height_index, width_index]
        :param item: a tuple (pixel_block_height_index, pixel_block_width_index)
        :return: the pixel block at the index specified as a tuple
        """
        # validation
        incorrect_param_msg = "incorrect parameter error"
        if not isinstance(item, tuple):
            raise TypeError(incorrect_param_msg)
        if len(item) != 2:
            raise TypeError(incorrect_param_msg)
        for index in item:
            if not isinstance(index, int):
                raise ValueError(incorrect_param_msg)

        tlc = (self.stride[1] * item[1], self.stride[0] * item[0])
        return self._get_pixel_blocks(tlc)

    def reset(self):
        """
        reset the cursor of the pixel block collection
        :return: None
        """
        self._index_array_iter = np.nditer(self._index_array)

    def shuffle(self):
        """
        shuffle the current pixel block collection, everytime you iterate the pixel block collection you get a random
        location for the pixel blocks
        :return: None
        """
        np.random.shuffle(self._index_array)
        self._index_array_iter = np.nditer(self._index_array)
