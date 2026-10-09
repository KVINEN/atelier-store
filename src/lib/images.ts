export type ImageAsset = { src: string; alt: string };

type Focus = { x: number; y: number; zoom: number };

// Builds an Unsplash (imgix) URL. `focus` crops in on a point of the photo,
// which is how product galleries get detail shots from a single photograph.
export function unsplash(id: string, width = 1600, focus?: Focus) {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    w: String(width),
    q: "80",
  });

  if (focus) {
    params.set("ar", "3:4");
    params.set("crop", "focalpoint");
    params.set("fp-x", String(focus.x));
    params.set("fp-y", String(focus.y));
    params.set("fp-z", String(focus.zoom));
  }

  return `https://images.unsplash.com/photo-${id}?${params}`;
}

// Must match `images.remotePatterns` in next.config.ts, or next/image refuses
// to render the URL. Admin forms accept only these.
const ALLOWED_IMAGE_HOSTS = [{ hostname: "images.unsplash.com", pathPrefix: "/photo-" }];

export function isAllowedImageUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    ALLOWED_IMAGE_HOSTS.some(
      (host) => url.hostname === host.hostname && url.pathname.startsWith(host.pathPrefix),
    )
  );
}

export const IMAGE_URL_HINT = "An https://images.unsplash.com/photo-… URL.";
