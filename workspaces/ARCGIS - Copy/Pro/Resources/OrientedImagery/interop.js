require([
  "esri/core/reactiveUtils",
  "esri/layers/orientedImagery/core/ExposurePoint",
  "esri/widgets/OrientedImageryViewer",
  "esri/widgets/OrientedImageryViewer/OrientedImageryViewerViewModel",
  "esri/widgets/OrientedImageryViewer/symbols",
  "esri/geometry/Point",
  "esri/geometry/SpatialReference",
  "esri/Graphic",
], function (
  reactiveUtils,
  ExposurePoint,
  OrientedImageryViewer,
  OrientedImageryViewerViewModel,
  symbols,
  Point,
  SpatialReference,
  Graphic
) {
  //--------------------------------------------------------------------------
  //
  //  OrientedImageryViewerProViewModel
  //
  //--------------------------------------------------------------------------

  const isAbortError = (error) => error?.name === "AbortError";
  const validateURL = (url) => {
    return new URL(url);
  };
  const OrientedImageryViewerProViewModel =
    OrientedImageryViewerViewModel.createSubclass({
      declaredClass:
        "esri.widgets.orientedImageryViewer.OrientedImageryViewerProViewModel",
      constructor() {
        this.determineWorkflowForFeature = async function (
          newFeature,
          oldFeature
        ) {
          this.clearGraphics();
          if (
            !newFeature ||
            newFeature?.attributes.objectId === oldFeature?.attributes.objectId
          ) {
            return;
          }
          if (oldFeature) {
            window.chrome.webview.hostObjects.interopObject.SwitchCurrentBestImage(
              newFeature.attributes.objectId,
              oldFeature.attributes.objectId
            );
          }
          const {
            imageRotation,
            cameraRoll,
            imagePath,
            cameraHeading,
            cameraPitch,
            viewAngle,
          } = newFeature.attributes;
          this.displayMessage = null;
          delete newFeature.attributes.viewAngle;
          try {
            // this will throw an error if the url is invalid
            validateURL(imagePath);
            await this.loadImageFromSource(imagePath, {
              imageRotation: (cameraRoll ?? 0) + (imageRotation ?? 0),
              yaw: cameraHeading,
              pitch: cameraPitch,
              mode: this.mode,
              viewAngle,
            });
            if (this.mode === "default") {
              await reactiveUtils.once(() => {
                return (
                  this.state === "image-loaded" &&
                  this.imagePointsInView != null
                );
              });
            }
            window.chrome.webview.hostObjects.interopObject.UpdateImageLoadedInViewerState(
              true
            );
            if (this.mode === "default") {
              const { imageSize } = this._imageViewer;
              window.chrome.webview.hostObjects.interopObject.PlotSelectedGroundPointOnImage(
                imageSize[1],
                imageSize[0]
              );
              const pointsX = [0, imageSize[0], imageSize[0], 0];
              const pointsY = [0, 0, imageSize[1], imageSize[1]];
              window.chrome.webview.hostObjects.interopObject.UpdateFootprints(
                false,
                pointsX,
                pointsY
              );
            } else {
              const { imageSize, hfov, vfov, pitch, yaw } =
                this._panoramicViewer;
              window.chrome.webview.hostObjects.interopObject.PlotSelectedGroundPointOnImage(
                imageSize[1],
                imageSize[0]
              );
              window.chrome.webview.hostObjects.interopObject.UpdateFootprints360(
                false,
                yaw,
                pitch,
                hfov,
                vfov
              );
              // disable image enhancement tool for panoramic images
              window.chrome.webview.hostObjects.interopObject.UpdateImageEnhancementEnabledState(
                false
              );
            }
            window.chrome.webview.hostObjects.interopObject.UpdateImageGalleryEnabledState(
              this.imageGalleryEnabled
            );
          } catch (error) {
            window.chrome.webview.hostObjects.interopObject.UpdateImageLoadedInViewerState(
              false
            );
            if (!isAbortError(error)) {
              console.error(error);
              this.loadImageError(error);
            }
          }
          setLoaderGraphic(false);
        };
        this.updateFootprint = function (vertices) {
          vertices.pop();
          const pointsX = vertices.map((d) => d.x),
            pointsY = vertices.map((d) => d.y);
          window.chrome.webview.hostObjects.interopObject.UpdateFootprints(
            true,
            pointsX,
            pointsY
          );
        };
        this.updateFootprintPanorama = function () {
          const { hfov, vfov, pitch, yaw } = this._panoramicViewer;

          window.chrome.webview.hostObjects.interopObject.UpdateFootprints360(
            false,
            yaw,
            pitch,
            hfov,
            vfov
          );
        };
      },
      initialize() {
        this.addHandles(
          reactiveUtils.watch(
            () => [this.state, this.mapImageConversionToolState],
            () => {
              this.removeHandles("view-click");
              this.removeHandles("image-click");
              const { mapImageConversionToolState, mode } = this;
              if (!(!mapImageConversionToolState || mode === "none"))
                switch (mode) {
                  case "default": {
                    this._imageViewer.clickAction = "pixel-location";
                    this.addHandles(
                      this._imageViewer.on(
                        "pixel-location",
                        async (location) => {
                          this.emit("pixel-location", location);
                        }
                      ),
                      "image-click"
                    );
                    break;
                  }
                  case "panoramic": {
                    this._panoramicViewer.clickAction = "pixel-location";
                    this.addHandles(
                      this._panoramicViewer.on(
                        "pixel-location",
                        async (location) => {
                          this.emit("pixel-location", location);
                        }
                      ),
                      "image-click"
                    );
                    break;
                  }
                }
            },
            { sync: true }
          )
        );
      },
      plotSelectedPointGraphicOnImage(selectedPointGraphic) {
        if (this._crossSymbol) {
          this._panoramicViewer.removeGraphic(this._crossSymbol);
          this._imageViewer.removeGraphic(this._crossSymbol);
          this._crossSymbol.destroy();
          this._crossSymbol = null;
        }
        this._crossSymbol = selectedPointGraphic;
        this.mode === "default"
          ? this._imageViewer.addGraphic(this._crossSymbol)
          : this.mode === "panoramic" &&
            this._panoramicViewer.addGraphic(this._crossSymbol);
      },
      properties: {
        imageSize: {
          readOnly: true,
          get: function () {
            switch (this.mode) {
              case "default":
                return this._imageViewer.imageSize;
              case "panoramic":
                return this._panoramicViewer.imageSize;
            }
            return null;
          },
        },

        state: {
          readOnly: true,
          get: function () {
            const { mode } = this;
            if (mode === "none") return "disabled";

            return mode === "default"
              ? this._imageViewer.state
              : this._panoramicViewer.state;
          },
        },
      },
    });

  //--------------------------------------------------------------------------
  //
  //  OrientedImageryViewerPro
  //
  //--------------------------------------------------------------------------

  const OrientedImageryViewerPro = OrientedImageryViewer.createSubclass({
    declaredClass: "esri.widgets.OrientedImageryViewerPro",
    constructor() {
      this._delegatedEventNames = ["pixel-location"];
      this.displayMessage = null;

      this.viewModel = new OrientedImageryViewerProViewModel();
      this.renderImageEnhancementTools =
        this._renderImageEnhancementTools.bind(this);

      this._renderImageEnhancementTools = () => {
        return this.viewModel.state === "image-loaded"
          ? this.renderImageEnhancementTools()
          : null;
      };

      // watch for thumbnails and request a render to update the thumbnails
      this.addHandles(
        reactiveUtils.watch(
          () => this.viewModel.thumbnails,
          () => {
            this.renderNow();
          },
          { sync: true }
        )
      );
    },
    plotSelectedPointGraphicOnImage(graphic) {
      this.viewModel.plotSelectedPointGraphicOnImage(graphic);
    },
    properties: {
      displayMessage: {
        get: function () {
          return this.viewModel.displayMessage;
        },
        set: function (messageObj) {
          this.viewModel.displayMessage = messageObj;
        },
      },

      imageSize: {
        readOnly: true,
        get: function () {
          return this.viewModel.imageSize;
        },
      },

      mode: {
        readOnly: true,
        get: function () {
          return this.viewModel.mode;
        },
      },
    },
  });

  //--------------------------------------------------------------------------
  //
  //  Interop Interactions
  //
  //--------------------------------------------------------------------------

  // set the theme
  setTheme();
  // add pro class to the body to load required styling
  document.body.classList.add("esri-oriented-imagery-viewer__pro");

  // load viewer using the container with id='orientedImageryViewer'
  // disable all ui buttons as pro has tools and set dockEanbled to true
  const viewer = new OrientedImageryViewerPro({
    container: "orientedImageryViewer",
    visibleElements: {
      title: false,
      coverageMenu: false,
      imageMenu: false,
      viewerTools: false,
      closeButton: false,
    },
    dockEnabled: true,
  });

  //--------------------------------------------------------------------------
  //
  //  Interop Methods
  //
  //--------------------------------------------------------------------------

  //--------------------------------
  //  setTheme
  //--------------------------------
  /**
   * Sync theme of Pro and Widget
   */
  function setTheme() {
    window.chrome.webview.hostObjects.interopObject.GetCurrentProTheme();
  }

  //--------------------------------
  //  LocateImagePointOnMap
  //--------------------------------
  /**
   * Plot image to ground graphic
   * @param location
   * @returns
   */
  function LocateImagePointOnMap(location) {
    if (!viewer.imageSize || !viewer.mapImageConversionToolState) {
      return;
    }

    const [imageWidth, imageHeight] = viewer.imageSize;

    let { x, y } = location;
    const xInRange = 0 <= x && x <= imageWidth;
    const yInRange = 0 <= y && y <= imageHeight;

    if (!xInRange || !yInRange) return;

    viewer.plotReferencePointOnImage(location);

    window.chrome.webview.hostObjects.interopObject.DrawImagePointOnGround(
      x,
      y
    );
  }

  //--------------------------------------------------------------------------
  //
  //  Global Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Global Methods are the functions called by pro using the interop object
   */

  //--------------------------------
  //  setFeaturesOnViewer
  //--------------------------------
  /**
   * Initialize features in viewer
   * @param bestImage
   * @param additionalImages
   * @returns
   * @global
   */
  window.setFeaturesOnViewer = function (bestImage, additionalImages) {
    viewer.currentBestFeature = null;
    viewer.features.removeAll();

    // if no image returned from best image search
    if (!bestImage) {
      viewer.resetImage();
      viewer.displayMessage = { key: "noImageError", type: "error" };
      window.chrome.webview.hostObjects.interopObject.UpdateImageLoadedInViewerState(
        false
      );
      setLoaderGraphic(false);
      return;
    }

    const suitabilityList = [bestImage];
    if (additionalImages?.length > 0) {
      suitabilityList.push(...additionalImages);
    }

    viewer.updateSuitabilities(
      suitabilityList.map((item) => {
        item.feature.attributes = new ExposurePoint(item.feature.attributes);
        return item;
      })
    );
  };

  //--------------------------------
  //  addPointOverlayOnImage
  //--------------------------------
  /**
   * Adds a graphic with a point geometry in Imagespace
   * @param imagePointX
   * @param imagePointY
   * @param symbolReference
   * @global
   */
  window.addPointOverlayOnImage = function (
    imagePointX,
    imagePointY,
    symbolReference
  ) {
    const x = isNaN(imagePointX) ? 0 : imagePointX;
    const y = isNaN(imagePointY) ? 0 : imagePointY;

    let symbol = null;
    if (symbolReference === "redCross") {
      symbol = symbols.crossSymbol;

      const graphicSymbol = new Graphic({
        geometry: new Point({
          x: +x,
          y: -y,
          spatialReference: SpatialReference.WebMercator,
        }),
        symbol,
      });
      viewer.plotSelectedPointGraphicOnImage(graphicSymbol);
    } else if (symbolReference === "redDiamond") {
      const mapPoint = new Point({
        x,
        y,
        spatialReference: SpatialReference.WebMercator,
      });

      viewer.plotReferencePointOnImage(mapPoint);
    }
  };

  //--------------------------------
  //  setMapImageConversionToolState
  //--------------------------------
  /**
   * Toggle viewer transformation tool state
   * @param value
   * @global
   */
  window.setMapImageConversionToolState = function (value) {
    viewer.mapImageConversionToolState = value;
    if (value)
      document.body.style.cursor =
        "url(OrientedImageryMapToImage.cur) 14 13, auto";
    else document.body.style.cursor = "default";
  };

  //--------------------------------
  //  toggleNavigationTool
  //--------------------------------
  /**
   * Toggle viewer navigation tool state
   * @param value
   * @global
   */
  window.toggleNavigationTool = function (value) {
    viewer.navigationToolActive = value;
    if (value)
      viewer.imageEnhancementToolActive = viewer.galleryOpened = !value;
  };

  //--------------------------------
  //  toggleImageEnhancements
  //--------------------------------
  /**
   * Toggle image enhancement tool state
   * @param value
   * @global
   */
  window.toggleImageEnhancements = function (value) {
    viewer.imageEnhancementToolActive = value;
    if (value) {
      viewer.navigationToolActive = viewer.galleryOpened = false;
      reactiveUtils
        .whenOnce(() => !viewer.imageEnhancementToolActive)
        .then(() => {
          window.chrome.webview.hostObjects.interopObject.DeselectViewerButton(
            "ImageEnhancements"
          );
        });
    }
  };

  //--------------------------------
  //  toggleImageGallery
  //--------------------------------
  /**
   * Toggle image gallery tool state
   * @param value
   * @global
   */
  window.toggleImageGallery = function (value) {
    viewer.galleryOpened = value;
    if (value) {
      viewer.imageEnhancementToolActive = viewer.navigationToolActive = false;
      reactiveUtils
        .whenOnce(() => !viewer.galleryOpened)
        .then(() => {
          window.chrome.webview.hostObjects.interopObject.DeselectViewerButton(
            "ImageGallery"
          );
        });
    }
  };

  //--------------------------------
  //  resetViewer
  //--------------------------------
  /**
   * Clears image and graphics in viewer
   * @global
   */
  window.resetViewer = function () {
    if (viewer.galleryOpened) {
      viewer.galleryOpened = false;
    }
    if (viewer.navigationToolActive) {
      viewer.navigationToolActive = false;
      window.chrome.webview.hostObjects.interopObject.DeselectViewerButton(
        "NavigationTool"
      );
    }
    if (viewer.imageEnhancementToolActive) {
      viewer.imageEnhancementToolActive = false;
    }
    window.chrome.webview.hostObjects.interopObject.UpdateImageLoadedInViewerState(
      false
    );

    viewer?.resetImage();

    viewer.features.removeAll();

    // stop loader
    setLoaderGraphic(false);
  };

  // to store global handles and remove on exit
  const handles = [];

  //--------------------------------
  //  onbeforeunload
  //--------------------------------
  /**
   * Called just before window unload to cleanup resources
   * @global
   */
  window.onbeforeunload = function () {
    window.chrome.webview.hostObjects.interopObject.UpdateViewerInitialized(
      false
    );
    handles.forEach((handle) => handle.remove());
  };

  //--------------------------------
  //  setViewerTheme
  //--------------------------------
  /**
   * Method to set the theme
   * @param theme
   * @global
   */
  window.setViewerTheme = function (theme) {
    const isDark = theme === "dark";
    if (isDark) {
      document.body.classList.toggle("calcite-mode-dark");
    }
    // ArcGIS Maps SDK theme
    const dark = document.getElementById("arcgis-maps-sdk-theme-dark");
    const light = document.getElementById("arcgis-maps-sdk-theme-light");

    dark && (dark.disabled = !isDark);

    light && (light.disabled = isDark);
  };

  // to store viewer panel
  let viewerPanel = null;

  //--------------------------------
  //  setLoaderGraphic
  //--------------------------------
  window.setLoaderGraphic = function (value) {
    if (viewerPanel == null)
      viewerPanel = document.querySelector(
        ".esri-oriented-imagery-viewer--docked"
      );

    if (viewerPanel == null) return;

    if (value) viewer.displayMessage = null;

    viewerPanel.loading = value;
  };

  //--------------------------------------------------------------------------
  //
  //  Viewer Handles
  //
  //--------------------------------------------------------------------------

  reactiveUtils
    .whenOnce(() => viewer.displayMessage?.key === "onLoadMessage")
    .then(() => {
      window.chrome.webview.hostObjects.interopObject.UpdateViewerInitialized(
        true
      );
    });

  handles.push(
    ...[
      reactiveUtils.on(() => viewer, "pixel-location", LocateImagePointOnMap),
      reactiveUtils.watch(
        () => viewer.displayMessage?.key != null,
        (displayMessageExists) => {
          if (!displayMessageExists) {
            return;
          }

          setLoaderGraphic(false);
        }
      ),
    ]
  );
});