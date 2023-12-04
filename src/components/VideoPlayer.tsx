import { useEffect, useRef } from "react"

function VideoPlayer({ peerId, stream }: { peerId: string, stream: MediaStream }) {

  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])
  return (
    <div>
      <video ref={videoRef} autoPlay muted />
      <p>#{peerId}</p>
    </div>
  )
}

/* const VideoPlayer: React.FC<{ stream: MediaStream }> = ({ stream }) => {

  const videoRef = useRef<HTMLVideoElement>()
  useEffect(() => {
    if(videoRef.current) videoRef.current.srcObject = stream
  }, [stream])
  return (
    <video ref={videoRef} />
  )
} */
export default VideoPlayer