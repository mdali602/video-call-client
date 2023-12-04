// import Peer from "peerjs";
import { ReactNode, createContext, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from 'uuid'
import socketIOClient from 'socket.io-client'
import Peer from "peerjs";
import { peerReducer } from "./peerReducer";
import { addPeerAction, removePeerAction } from "./peerActions";

const WS = 'http://localhost:8080'

// type RoomContextType = {
//   ws: Socket
//   me: Peer | null
//   stream: MediaStream | null
//   peers: PeerState
//   shareScreen: () => void
// }

// export const RoomContext = createContext<RoomContextType | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RoomContext = createContext<null | any>(null)

export const RoomContextProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const [me, setMe] = useState<Peer>()
  const [stream, setStream] = useState<MediaStream>()
  const [peers, dispatch] = useReducer(peerReducer, {})
  // const [screenSharingId, setScreenSharingId] = useState("")
  const [isShareScreen, setIsShareScreen] = useState(false)

  const ws = useMemo(() => socketIOClient(WS), [])
  const peer = useMemo(() => {
    const meId = uuidV4()
    const me = new Peer(meId, {
      host: "localhost",
      port: 9000,
      path: '/myapp'
    })
    setMe(me)
    return me;
  }, [])

  const enterRoom = useCallback(({ roomId }: { roomId: string }) => {
    console.log({ roomId })
    navigate(`/room/${roomId}`)
  }, [navigate])

  const getUsers = useCallback(({ participants }: { participants: string[] }) => {
    console.log({ participants })
  }, [])

  const removePeer = useCallback((peerId: string) => {
    console.log('TCL -> removePeer -> peerId:', { peerId })
    removePeerAction(peerId)
  }, [])

  const switchStream = (localStream: MediaStream) => {
    console.log('TCL -> switchStream -> stream:', { stream })
    setStream(localStream)
    // setScreenSharingId(me?.id || '')
    setIsShareScreen(prevVal => !prevVal)

    if (peer) {
      console.log({ connections: peer.connections })
      Object.values(peer?.connections).forEach((connection: any) => {
        const videoTrack = localStream?.getTracks().find(track => track.kind === 'video')
        console.log('TCL -> Object.values -> connection:', { connection, videoTrack, senders: connection[0].peerConnection.getSenders() })
        connection[0].peerConnection.getSenders()[1].replaceTrack(videoTrack).catch((err: any) => console.error(err))
      })
    }

  }
  const shareScreen = () => {
    if (isShareScreen) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(switchStream)
    } else {
      navigator.mediaDevices.getDisplayMedia({}).then(switchStream)
    }
  }


  const userJoined = useCallback(
    ({ peerId }: { peerId: string }) => {
      // if (!stream) return
      console.log('user joined: ', peerId)
      const call = peer.call(peerId, stream as MediaStream)
      call.on('stream', peerStream => {
        console.log('add peer-1')
        dispatch(addPeerAction(peerId, peerStream))
      })

      call.on('error', error => {
        console.error('Call error:', error);
      });
    },
    [peer, stream, dispatch]
  )

  useEffect(() => {
    // setMe(peer)

    try {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        setStream(stream)
      })
    } catch (error) {
      console.error(error)
    }

    ws.on('room-created', enterRoom)
    ws.on('get-users', getUsers)
    ws.on('user-disconnected', removePeer)
    return () => {
      ws.off('room-created', enterRoom)
      ws.off('get-users', getUsers)
      ws.off('user-disconnected', removePeer)
    }
  }, [ws, enterRoom, getUsers, removePeer])


  peer.on('call', (call) => {
    console.log('Answer user call')
    call.answer(stream)
    call.on('stream', peerStream => {
      console.log('add peer-2')
      dispatch(addPeerAction(call.peer, peerStream))
    })
  })

  useEffect(() => {
    // if (!(me && stream)) return
    // if (!me) return
    // if (!stream) return
    ws.on('user-joined', userJoined)


    return () => {
      ws.off('user-joined', userJoined)
    }
  }, [ws, peer, stream, userJoined, dispatch])

  return (<RoomContext.Provider value={{ ws, me, stream, peers, shareScreen }}>{children}</RoomContext.Provider>)
}

export default RoomContextProvider