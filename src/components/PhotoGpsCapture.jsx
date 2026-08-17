import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  MapPin,
  Loader2,
  X,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

import { useUploadPhotosMutation } from "../redux/api.jsx";

/*
|--------------------------------------------------------------------------
| REQUIRED PHOTO SLOTS
|--------------------------------------------------------------------------
| Worker present hone par ye photos required rahenge.
|
| Har photo:
| 1. Direct camera se capture hoga
| 2. Current GPS location li jayegi
| 3. Backend / Cloudinary par upload hoga
| 4. URL + latitude + longitude parent ko milega
|--------------------------------------------------------------------------
*/

export const PHOTO_SLOTS = [
  {
    key: "morningDishPhoto",
    label: "Morning dish photo",
    description: "Today's morning meal / dish",
  },
  {
    key: "childrenEatingBreakfastPhoto",
    label: "Children eating morning meal",
    description: "Children having morning breakfast",
  },
  {
    key: "afternoonDishPhoto",
    label: "Afternoon dish photo",
    description: "Today's afternoon meal / dish",
  },
  {
    key: "childrenEatingAfternoonPhoto",
    label: "Children eating afternoon meal",
    description: "Children having afternoon meal",
  },
  {
    key: "preEducationPhoto",
    label: "Pre-education photo",
    description: "Pre-primary education activity",
  },
  {
    key: "photoBeneficiariesNutrition",
    label: "Poshan Sudha beneficiary photo",
    description: "Poshan Sudha beneficiaries",
  },
];

/*
|--------------------------------------------------------------------------
| CAMERA CONSTRAINTS
|--------------------------------------------------------------------------
*/

const CAMERA_CONSTRAINTS = {
  video: {
    facingMode: {
      ideal: "environment",
    },
    width: {
      ideal: 1280,
    },
    height: {
      ideal: 720,
    },
  },
  audio: false,
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function PhotoGpsCapture({
  onLocationChange,
  onPhotosChange,
  photos = [],
  disabled = false,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [location, setLocation] =
    useState(null);

  const [locError, setLocError] =
    useState("");

  const [cameraError, setCameraError] =
    useState("");

  const [uploadError, setUploadError] =
    useState("");

  const [locLoading, setLocLoading] =
    useState(false);

  const [cameraOpen, setCameraOpen] =
    useState(false);

  const [cameraLoading, setCameraLoading] =
    useState(false);

  const [capturing, setCapturing] =
    useState(false);

  const [activeSlot, setActiveSlot] =
    useState(null);

  const [
    uploadPhotos,
    { isLoading: uploading },
  ] = useUploadPhotosMutation();

  /*
  |--------------------------------------------------------------------------
  | FIND PHOTO
  |--------------------------------------------------------------------------
  */

  const getPhoto = (key) => {
    return photos.find(
      (photo) =>
        photo?.key === key
    );
  };

  /*
  |--------------------------------------------------------------------------
  | STOP CAMERA
  |--------------------------------------------------------------------------
  */

  const stopCamera = () => {
    try {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error(
        "Stop camera error:",
        error
      );
    }

    setCameraOpen(false);
    setCameraLoading(false);
    setCapturing(false);
    setActiveSlot(null);
  };

  /*
  |--------------------------------------------------------------------------
  | COMPONENT UNMOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | GET CURRENT GPS LOCATION
  |--------------------------------------------------------------------------
  */

  const captureLocation = () => {
    return new Promise(
      (resolve, reject) => {
        if (!navigator.geolocation) {
          const error =
            "GPS is not available on this device/browser.";

          setLocError(error);
          reject(new Error(error));
          return;
        }

        setLocLoading(true);
        setLocError("");

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords =
              position.coords;

            const loc = {
              latitude:
                Number(
                  coords.latitude
                ),

              longitude:
                Number(
                  coords.longitude
                ),

              accuracy:
                Number(
                  coords.accuracy || 0
                ),

              timestamp:
                new Date().toISOString(),
            };

            setLocation(loc);

            onLocationChange?.(
              loc
            );

            setLocLoading(false);

            resolve(loc);
          },

          (error) => {
            let message =
              "Could not get current GPS location.";

            if (error?.code === 1) {
              message =
                "Location permission denied. Please allow location access.";
            }

            if (error?.code === 2) {
              message =
                "Current location is unavailable.";
            }

            if (error?.code === 3) {
              message =
                "Location request timed out. Please try again.";
            }

            setLocError(message);
            setLocLoading(false);

            reject(
              new Error(message)
            );
          },

          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | START CAMERA
  |--------------------------------------------------------------------------
  */

  const startCamera = async (
    slot
  ) => {
    if (disabled) return;

    if (cameraOpen) {
      return;
    }

    setActiveSlot(slot);
    setCameraError("");
    setUploadError("");
    setLocError("");
    setCameraLoading(true);

    try {
      /*
       * First get GPS.
       * Camera will NOT open if GPS is unavailable.
       */
      const currentLocation =
        await captureLocation();

      if (
        !currentLocation?.latitude ||
        !currentLocation?.longitude
      ) {
        throw new Error(
          "Valid GPS location is required before taking a photo."
        );
      }

      /*
       * Browser camera support
       */
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera is not supported by this browser."
        );
      }

      /*
       * Request rear camera
       */
      const stream =
        await navigator.mediaDevices.getUserMedia(
          CAMERA_CONSTRAINTS
        );

      streamRef.current =
        stream;

      setCameraOpen(true);

      /*
       * Attach camera stream to video
       */
      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;

        try {
          await videoRef.current.play();
        } catch (error) {
          console.log(
            "Video autoplay:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Camera open error:",
        error
      );

      setCameraError(
        error?.message ||
        "Unable to open camera."
      );

      stopCamera();
    } finally {
      setCameraLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CONVERT CANVAS TO FILE
  |--------------------------------------------------------------------------
  */

  const canvasToFile = (
    canvas,
    fileName
  ) => {
    return new Promise(
      (resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  "Could not create image file."
                )
              );
              return;
            }

            const file =
              new File(
                [blob],
                fileName,
                {
                  type: "image/jpeg",
                  lastModified:
                    Date.now(),
                }
              );

            resolve(file);
          },
          "image/jpeg",
          0.82
        );
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CAPTURE PHOTO
  |--------------------------------------------------------------------------
  */

  const capturePhoto = async () => {
    if (
      !videoRef.current ||
      !activeSlot ||
      !location ||
      capturing ||
      uploading
    ) {
      return;
    }

    setCapturing(true);
    setUploadError("");

    try {
      const video =
        videoRef.current;

      /*
       * Make sure camera has actual video
       */
      if (
        !video.videoWidth ||
        !video.videoHeight
      ) {
        throw new Error(
          "Camera is not ready yet. Please wait a moment and try again."
        );
      }

      /*
       * Canvas
       */
      const canvas =
        document.createElement(
          "canvas"
        );

      const maxWidth = 1280;

      const scale = Math.min(
        1,
        maxWidth /
        video.videoWidth
      );

      canvas.width = Math.round(
        video.videoWidth * scale
      );

      canvas.height = Math.round(
        video.videoHeight * scale
      );

      const context =
        canvas.getContext("2d");

      if (!context) {
        throw new Error(
          "Could not process camera image."
        );
      }

      /*
       * Draw camera frame
       */
      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      /*
       * Create File
       */
      const file =
        await canvasToFile(
          canvas,
          `${activeSlot.key}-${Date.now()}.jpg`
        );

      /*
       * Stop camera before upload
       */
      stopCamera();

      /*
       * Upload through existing API mutation
       *
       * Existing code already uses:
       * uploadPhotos(files)
       *
       * so we keep the same API contract.
       */
      const response =
        await uploadPhotos([
          file,
        ]);

      /*
       * RTK Query response
       *
       * Existing code expects:
       * response.data.files
       *
       * We also support:
       * response.files
       */
      const uploadedFiles =
        response?.data?.files ||
        response?.files ||
        response?.data?.data?.files ||
        [];

      if (
        !Array.isArray(
          uploadedFiles
        ) ||
        uploadedFiles.length === 0
      ) {
        throw new Error(
          "Photo upload failed. Server did not return an image URL."
        );
      }

      const uploaded =
        uploadedFiles[0];

      if (!uploaded?.url) {
        throw new Error(
          "Photo uploaded but image URL was not returned."
        );
      }

      /*
       * Final photo object
       *
       * Parent will receive:
       *
       * {
       *   key,
       *   label,
       *   url,
       *   latitude,
       *   longitude,
       *   accuracy,
       *   capturedAt
       * }
       */
      const photoData = {
        key: activeSlot.key,

        label: activeSlot.label,

        url: uploaded.url,

        latitude:
          location.latitude,

        longitude:
          location.longitude,

        accuracy:
          location.accuracy,

        capturedAt:
          new Date().toISOString(),
      };

      /*
       * Replace old photo if retaking.
       */
      const updatedPhotos =
        photos.filter(
          (photo) =>
            photo?.key !==
            activeSlot.key
        );

      updatedPhotos.push(
        photoData
      );

      onPhotosChange?.(
        updatedPhotos
      );
    } catch (error) {
      console.error(
        "Capture/upload error:",
        error
      );

      setUploadError(
        error?.data?.message ||
        error?.message ||
        "Could not upload photo. Please try again."
      );
    } finally {
      setCapturing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE PHOTO
  |--------------------------------------------------------------------------
  */

  const removePhoto = (key) => {
    const updatedPhotos =
      photos.filter(
        (photo) =>
          photo?.key !== key
      );

    onPhotosChange?.(
      updatedPhotos
    );
  };

  /*
  |--------------------------------------------------------------------------
  | RECAPTURE LOCATION
  |--------------------------------------------------------------------------
  */

  const handleRecaptureLocation =
    async () => {
      try {
        await captureLocation();
      } catch (error) {
        console.error(
          "Location error:",
          error
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | PHOTO COUNT
  |--------------------------------------------------------------------------
  */

  const capturedCount =
    PHOTO_SLOTS.filter(
      (slot) =>
        !!getPhoto(slot.key)
    ).length;

  const totalPhotos =
    PHOTO_SLOTS.length;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-surface/60 p-4 sm:p-5">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-2">

            <Camera
              size={20}
              className="text-primary"
            />

            <h3 className="text-base font-bold text-ink">
              Camera & GPS Proof
            </h3>

          </div>

          <p className="mt-1 text-xs text-muted">
            Take every required photo directly
            from the camera. Image selection from
            gallery is disabled.
          </p>

        </div>

        <div className="rounded-lg bg-primary/10 px-3 py-2">

          <p className="text-xs font-bold text-primary-dark">
            {capturedCount} /{" "}
            {totalPhotos} Photos
          </p>

        </div>

      </div>

      {/* =====================================================
          LOCATION
      ===================================================== */}

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">

            <div className="rounded-lg bg-primary/10 p-2">

              <MapPin
                size={18}
                className="text-primary"
              />

            </div>

            <div>

              <p className="text-sm font-bold text-ink">
                GPS Location
              </p>

              {!location ? (
                <p className="mt-0.5 text-xs text-muted">
                  GPS will automatically be
                  captured before opening camera.
                </p>
              ) : (
                <div className="mt-1 space-y-0.5 text-xs text-primary-dark">

                  <p>
                    Latitude:{" "}
                    {location.latitude.toFixed(
                      6
                    )}
                  </p>

                  <p>
                    Longitude:{" "}
                    {location.longitude.toFixed(
                      6
                    )}
                  </p>

                  {location.accuracy ? (
                    <p>
                      Accuracy:{" "}
                      {Math.round(
                        location.accuracy
                      )}{" "}
                      meters
                    </p>
                  ) : null}

                </div>
              )}

            </div>

          </div>

          <button
            type="button"
            onClick={
              handleRecaptureLocation
            }
            disabled={
              locLoading ||
              cameraOpen ||
              disabled
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary-dark transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {locLoading ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <MapPin size={14} />
            )}

            {location
              ? "Recapture GPS"
              : "Get GPS"}

          </button>

        </div>

        {locError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-coral/20 bg-coral-light px-3 py-2">

            <AlertCircle
              size={15}
              className="mt-0.5 shrink-0 text-coral"
            />

            <p className="text-xs font-medium text-coral">
              {locError}
            </p>

          </div>
        )}

      </div>

      {/* =====================================================
          UPLOAD ERROR
      ===================================================== */}

      {uploadError && (
        <div className="flex items-start gap-2 rounded-xl border border-coral/20 bg-coral-light px-4 py-3">

          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0 text-coral"
          />

          <div>

            <p className="text-sm font-bold text-coral">
              Photo upload failed
            </p>

            <p className="mt-0.5 text-xs text-coral">
              {uploadError}
            </p>

          </div>

        </div>
      )}

      {/* =====================================================
          PHOTO SLOTS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {PHOTO_SLOTS.map(
          (slot) => {

            const photo =
              getPhoto(slot.key);

            return (
              <div
                key={slot.key}
                className={`overflow-hidden rounded-xl border bg-surface transition ${photo
                    ? "border-green-200"
                    : "border-line"
                  }`}
              >

                {/* CARD HEADER */}

                <div className="flex items-start justify-between gap-3 p-4">

                  <div>

                    <div className="flex items-center gap-2">

                      {photo ? (
                        <CheckCircle2
                          size={17}
                          className="text-green-600"
                        />
                      ) : (
                        <Camera
                          size={17}
                          className="text-primary"
                        />
                      )}

                      <p className="text-sm font-bold text-ink">
                        {slot.label}
                      </p>

                    </div>

                    <p className="mt-1 text-xs text-muted">
                      {slot.description}
                    </p>

                  </div>

                  {!photo && (
                    <span className="shrink-0 rounded-full bg-coral-light px-2 py-1 text-[10px] font-bold text-coral">
                      Required
                    </span>
                  )}

                  {photo && (
                    <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
                      Captured
                    </span>
                  )}

                </div>

                {/* IMAGE PREVIEW */}

                {photo ? (
                  <div className="relative">

                    <img
                      src={photo.url}
                      alt={slot.label}
                      className="h-52 w-full object-cover"
                    />

                    {/* GPS OVERLAY */}

                    <div className="absolute bottom-0 left-0 right-0 bg-black/65 px-3 py-2 text-[10px] text-white">

                      <div className="flex items-center gap-1">

                        <MapPin
                          size={11}
                        />

                        <span>
                          {Number(
                            photo.latitude
                          ).toFixed(5)}
                          ,{" "}
                          {Number(
                            photo.longitude
                          ).toFixed(5)}
                        </span>

                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="flex h-52 items-center justify-center bg-bg">

                    <div className="text-center">

                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">

                        <Camera
                          size={26}
                          className="text-primary"
                        />

                      </div>

                      <p className="mt-3 text-xs font-semibold text-muted">
                        No photo captured
                      </p>

                    </div>

                  </div>
                )}

                {/* ACTIONS */}

                <div className="p-4">

                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        startCamera(
                          slot
                        )
                      }
                      disabled={
                        disabled ||
                        cameraLoading ||
                        cameraOpen ||
                        uploading ||
                        capturing
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {cameraLoading ? (
                        <>
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />

                          Getting GPS...
                        </>
                      ) : uploading &&
                        activeSlot?.key ===
                        slot.key ? (
                        <>
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />

                          Uploading...
                        </>
                      ) : photo ? (
                        <>
                          <RotateCcw
                            size={15}
                          />

                          Retake Photo
                        </>
                      ) : (
                        <>
                          <Camera
                            size={15}
                          />

                          Open Camera
                        </>
                      )}

                    </button>

                    {photo && (
                      <button
                        type="button"
                        onClick={() =>
                          removePhoto(
                            slot.key
                          )
                        }
                        disabled={
                          disabled ||
                          uploading
                        }
                        className="inline-flex items-center justify-center rounded-lg border border-line px-3 py-2.5 text-coral transition hover:bg-coral-light disabled:opacity-50"
                        title="Remove photo"
                      >
                        <X
                          size={16}
                        />
                      </button>
                    )}

                  </div>

                </div>

              </div>
            );
          }
        )}

      </div>

      {/* =====================================================
          CAMERA MODAL
      ===================================================== */}

      {cameraOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 sm:p-5">

          <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">

            {/* CAMERA HEADER */}

            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">

              <div>

                <div className="flex items-center gap-2">

                  <Camera
                    size={18}
                    className="text-primary"
                  />

                  <p className="text-sm font-bold text-ink">
                    {activeSlot?.label}
                  </p>

                </div>

                <p className="mt-0.5 text-xs text-muted">
                  Camera is active. Take the photo
                  from the camera only.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  stopCamera
                }
                disabled={capturing}
                className="rounded-lg p-2 text-muted transition hover:bg-bg disabled:opacity-50"
                title="Close camera"
              >
                <X size={20} />
              </button>

            </div>

            {/* CAMERA AREA */}

            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black p-2 sm:p-4">

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="max-h-[65vh] w-full rounded-xl object-contain"
              />

              {/* GPS BADGE */}

              {location && (
                <div className="absolute bottom-5 left-5 flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-2 text-[11px] font-semibold text-white">

                  <MapPin
                    size={13}
                  />

                  <span>
                    GPS{" "}
                    {location.latitude.toFixed(
                      5
                    )}
                    ,{" "}
                    {location.longitude.toFixed(
                      5
                    )}
                  </span>

                </div>
              )}

              {/* CAMERA LOADING */}

              {cameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">

                  <div className="rounded-xl bg-black/75 px-5 py-4 text-center text-white">

                    <Loader2
                      size={28}
                      className="mx-auto animate-spin"
                    />

                    <p className="mt-2 text-sm font-semibold">
                      Opening camera...
                    </p>

                  </div>

                </div>
              )}

            </div>

            {/* CAMERA ERROR */}

            {cameraError && (
              <div className="border-t border-line bg-coral-light px-4 py-3">

                <div className="flex items-start gap-2">

                  <AlertCircle
                    size={17}
                    className="mt-0.5 text-coral"
                  />

                  <p className="text-xs font-semibold text-coral">
                    {cameraError}
                  </p>

                </div>

              </div>
            )}

            {/* CAMERA FOOTER */}

            <div className="flex flex-col gap-3 border-t border-line p-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="text-xs text-muted">

                {location ? (
                  <>
                    <span className="font-semibold text-ink">
                      GPS locked
                    </span>
                    {" • "}
                    Accuracy{" "}
                    {Math.round(
                      location.accuracy ||
                      0
                    )}
                    m
                  </>
                ) : (
                  "GPS not available"
                )}

              </div>

              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={
                    stopCamera
                  }
                  disabled={capturing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg disabled:opacity-50"
                >

                  <X size={16} />

                  Cancel

                </button>

                <button
                  type="button"
                  onClick={
                    capturePhoto
                  }
                  disabled={
                    capturing ||
                    uploading ||
                    !location
                  }
                  className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {capturing ||
                    uploading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      {uploading
                        ? "Uploading..."
                        : "Capturing..."}
                    </>
                  ) : (
                    <>
                      <Camera
                        size={17}
                      />

                      Capture
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          FINAL STATUS
      ===================================================== */}

      <div
        className={`rounded-xl border px-4 py-3 ${capturedCount ===
            totalPhotos
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
          }`}
      >

        <div className="flex items-center gap-2">

          {capturedCount ===
            totalPhotos ? (
            <CheckCircle2
              size={18}
              className="text-green-600"
            />
          ) : (
            <AlertCircle
              size={18}
              className="text-amber-600"
            />
          )}

          <p
            className={`text-sm font-bold ${capturedCount ===
                totalPhotos
                ? "text-green-700"
                : "text-amber-700"
              }`}
          >
            {capturedCount ===
              totalPhotos
              ? "All required photos captured successfully."
              : `${totalPhotos - capturedCount} photo(s) remaining.`}
          </p>

        </div>

        {capturedCount !==
          totalPhotos && (
            <p className="mt-1 text-xs text-amber-700">
              Every photo is required when
              today's status is Present.
            </p>
          )}

      </div>

    </div>
  );
}