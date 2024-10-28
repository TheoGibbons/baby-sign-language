export function YouTubeEmbed({url, title}) {
  return url
  return  <iframe
    src={url}
    title={title}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
    className="w-full aspect-video"
  ></iframe>
}