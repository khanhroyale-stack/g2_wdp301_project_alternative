"use client";
import {
  Primitive,
  createContextScope,
  require_jsx_runtime,
  useLayoutEffect2
} from "./chunk-BSKR5AF4.js";
import "./chunk-5K7VEWNR.js";
import "./chunk-GYTVARJC.js";
import {
  require_react
} from "./chunk-BHGA32AN.js";
import {
  __toESM
} from "./chunk-G3PMV62Z.js";

// node_modules/@radix-ui/react-avatar/dist/index.mjs
var React2 = __toESM(require_react(), 1);

// node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
var React = __toESM(require_react(), 1);
function useCallbackRef(callback) {
  const callbackRef = React.useRef(callback);
  React.useEffect(() => {
    callbackRef.current = callback;
  });
  return React.useMemo(() => ((...args) => callbackRef.current?.(...args)), []);
}

// node_modules/@radix-ui/react-avatar/dist/index.mjs
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var AVATAR_NAME = "Avatar";
var [createAvatarContext, createAvatarScope] = createContextScope(AVATAR_NAME);
var STATIC_IMAGE_COUNT_STATE = [
  0,
  () => void 0
];
var [AvatarProvider, useAvatarContext] = createAvatarContext(AVATAR_NAME);
var Avatar = React2.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAvatar, ...avatarProps } = props;
    const [imageLoadingStatus, setImageLoadingStatus] = React2.useState("idle");
    const [imageCount, setImageCount] = useImageCount();
    return (0, import_jsx_runtime.jsx)(
      AvatarProvider,
      {
        scope: __scopeAvatar,
        imageLoadingStatus,
        setImageLoadingStatus,
        imageCount,
        setImageCount,
        children: (0, import_jsx_runtime.jsx)(Primitive.span, { ...avatarProps, ref: forwardedRef })
      }
    );
  }
);
Avatar.displayName = AVATAR_NAME;
var IMAGE_NAME = "AvatarImage";
var AvatarImage = React2.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAvatar, src, onLoadingStatusChange, ...imageProps } = props;
    const context = useAvatarContext(IMAGE_NAME, __scopeAvatar);
    useUpdateImageCount(context.setImageCount);
    const imageLoadingStatus = useImageLoadingStatus(src, {
      referrerPolicy: imageProps.referrerPolicy,
      crossOrigin: imageProps.crossOrigin,
      loadingStatus: context.imageLoadingStatus,
      setLoadingStatus: context.setImageLoadingStatus
    });
    const handleLoadingStatusChange = useCallbackRef((status) => {
      onLoadingStatusChange?.(status);
    });
    const loadingStatusRef = React2.useRef(imageLoadingStatus);
    useLayoutEffect2(() => {
      const previousLoadingStatus = loadingStatusRef.current;
      loadingStatusRef.current = imageLoadingStatus;
      if (imageLoadingStatus !== previousLoadingStatus) {
        handleLoadingStatusChange(imageLoadingStatus);
      }
    }, [imageLoadingStatus, handleLoadingStatusChange]);
    return imageLoadingStatus === "loaded" ? (0, import_jsx_runtime.jsx)(Primitive.img, { ...imageProps, ref: forwardedRef, src }) : null;
  }
);
AvatarImage.displayName = IMAGE_NAME;
var FALLBACK_NAME = "AvatarFallback";
var AvatarFallback = React2.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAvatar, delayMs, ...fallbackProps } = props;
    const context = useAvatarContext(FALLBACK_NAME, __scopeAvatar);
    const [canRender, setCanRender] = React2.useState(delayMs === void 0);
    React2.useEffect(() => {
      if (delayMs !== void 0) {
        const timerId = window.setTimeout(() => setCanRender(true), delayMs);
        return () => window.clearTimeout(timerId);
      }
    }, [delayMs]);
    return canRender && context.imageLoadingStatus !== "loaded" ? (0, import_jsx_runtime.jsx)(Primitive.span, { ...fallbackProps, ref: forwardedRef }) : null;
  }
);
AvatarFallback.displayName = FALLBACK_NAME;
function useImageLoadingStatus(src, {
  loadingStatus,
  setLoadingStatus,
  referrerPolicy,
  crossOrigin
}) {
  useLayoutEffect2(() => {
    if (!src) {
      setLoadingStatus("error");
      return;
    }
    const image = new window.Image();
    const handleLoad = (event) => {
      const image2 = event.currentTarget;
      setLoadingStatus(getImageLoadingStatus(image2));
    };
    const handleError = () => setLoadingStatus("error");
    image.addEventListener("load", handleLoad);
    image.addEventListener("error", handleError);
    if (referrerPolicy) {
      image.referrerPolicy = referrerPolicy;
    }
    image.crossOrigin = crossOrigin ?? null;
    image.src = src;
    setLoadingStatus(getImageLoadingStatus(image));
    return () => {
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
      setLoadingStatus("idle");
    };
  }, [src, crossOrigin, referrerPolicy, setLoadingStatus]);
  return loadingStatus;
}
function getImageLoadingStatus(image) {
  return image.complete ? image.naturalWidth > 0 ? "loaded" : "error" : "loading";
}
function useImageCount() {
  let state = STATIC_IMAGE_COUNT_STATE;
  if (true) {
    state = React2.useState(0);
    const [imageCount] = state;
    const hasWarnedRef = React2.useRef(false);
    React2.useEffect(() => {
      if (imageCount > 1 && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        console.warn(
          "Avatar: Only one `Avatar.Image` component should be rendered per `Avatar.Root`, but multiple were detected. This will lead to unexpected behavior."
        );
      }
    }, [imageCount]);
  }
  return state;
}
function useUpdateImageCount(setImageCount) {
  if (true) {
    React2.useEffect(() => {
      setImageCount((imageCount) => imageCount + 1);
      return () => {
        setImageCount((imageCount) => imageCount - 1);
      };
    }, [setImageCount]);
  }
}
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarFallback as Fallback,
  AvatarImage as Image,
  Avatar as Root,
  createAvatarScope
};
//# sourceMappingURL=@radix-ui_react-avatar.js.map
