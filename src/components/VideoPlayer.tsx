import { useEffect, useRef } from "react"

function VideoPlayer({ peerId, stream, isMuted = false }: { peerId: string, stream: MediaStream, isMuted?: boolean }) {

  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current && stream instanceof MediaStream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream])
  return (
    <div>
      <video ref={videoRef} autoPlay muted={isMuted} />
      <p>#{peerId}</p>
    </div>
  )
}

export default VideoPlayer