import { useParams } from "react-router-dom"
import useRoomContext from "../hooks/useRoomContext"
import { useEffect } from "react"
import VideoPlayer from "../components/VideoPlayer"
import { PeerState } from "../context/peerReducer"
import ShareScreenButton from "../components/ShareScreenButton"

function Room() {
  const { id } = useParams()
  const { ws, me, stream, peers, shareScreen } = useRoomContext()
  // const ws = context && context.ws
  // const me = context && context.me
  // const stream = context && context.stream
  // const peers = context && context.peers
  // const shareScreen = context && context.shareScreen

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
    <div> <p>Room id: {id}</p><p>Peer id: {me?._id}</p>
      <div className="grid grid-cols-4 gap-4">
        <VideoPlayer stream={stream} peerId="me" />
        {/* {Object.entries(peers as PeerState).map(([peerId, peer]) => (
          <VideoPlayer stream={peer.stream} peerId={peerId} />
        ))} */}

        {Object.values(peers as PeerState).map((peer, index: number) => (
          <VideoPlayer key={`vid-${index + 1}`} stream={peer.stream} peerId={Object.keys(peers)[index]} />
        ))}
      </div>
      <div className="fixed bottom-0 p-6 w-full flex justify-center border-t-2">
        <ShareScreenButton shareScreen={shareScreen} />
      </div>
    </div>
  )
}

export default Room