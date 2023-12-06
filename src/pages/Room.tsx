import { useParams } from "react-router-dom"
import useRoomContext from "../hooks/useRoomContext"
import { useEffect } from "react"
import VideoPlayer from "../components/VideoPlayer"
import { PeerState } from "../context/peerReducer"
import ShareScreenButton from "../components/ShareScreenButton"

function Room() {
  const { id } = useParams()
  const { ws, me, stream, peers, screenShareToggle, isRecording, startRecording, stopRecording, videoURL } = useRoomContext()
  // const ws = context && context.ws
  // const me = context && context.me
  // const stream = context && context.stream
  // const peers = context && context.peers
  // const screenShareToggle = context && context.screenShareToggle

  // useEffect(() => {
  //   console.log({ stream, peers })
  // }, [stream, peers])

  useEffect(() => {
    if (me) ws.emit('join-room', { roomId: id, peerId: me._id })
  }, [id, me, ws])


  useEffect(() => {
    console.log('TCL -> Room -> peers:', { peers })
  }, [peers])

  return (
    <div style={{ position: 'relative' }}>
      {isRecording && <div style={{ position: 'fixed', top: 0, left: 0 }}>Recording: On</div>}
      <p>Room id: {id}</p><p>Peer id: {me?._id}</p>
      <div className="grid grid-cols-4 gap-4">
        <VideoPlayer stream={stream} peerId="me" />
        {/* {Object.entries(peers as PeerState).map(([peerId, peer]) => (
          <VideoPlayer stream={peer.stream} peerId={peerId} />
        ))} */}

        {Object.values(peers as PeerState).map((peer, index: number) => (
          <VideoPlayer key={`vid-${index + 1}`} stream={peer.stream} peerId={Object.keys(peers)[index]} />
        ))}
        {videoURL && (
          <div>
            <p>Recorded Video:</p>
            <video controls src={videoURL} />
          </div>
        )}
      </div>
      <div className="fixed bottom-0 p-6 w-full flex justify-center border-t-2">
        <ShareScreenButton screenShareToggle={screenShareToggle} />

        {isRecording ? (
          <button onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button onClick={startRecording}>Start Recording</button>
        )}
      </div>

    </div>
  )
}

export default Room