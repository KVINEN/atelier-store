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
