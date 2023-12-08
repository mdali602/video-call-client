// import Peer from "peerjs";
import { ReactNode, createContext, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from 'uuid'
import socketIOClient from 'socket.io-client'
import Peer from "peerjs";
import RecordRTC from 'recordrtc';
import { peerReducer } from "./peerReducer";
import { addPeerAction, removePeerAction } from "./peerActions";

const PORT = 8080;
const WS = `http://localhost:${PORT}`

const delay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
// type RoomContextType = {
//   ws: Socket
//   me: Peer | null
//   stream: MediaStream | null
//   peers: PeerState
//   screenShareToggle: () => void
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
  const [isMuted, setIsMuted] = useState(true);
  const [isWebcamOn, setIsWebcamOn] = useState(true)

  const ws = useMemo(() => socketIOClient(WS), [])

  const videoRef = useRef(null);
  const [recorder, setRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState('');


  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    // ws.emit('recording-started', { roomId: })
    const recorderInstance = new RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/webm',
    });

    recorderInstance.startRecording();
    setRecorder(recorderInstance);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        const videoURL = URL.createObjectURL(blob);
        setVideoURL(videoURL)
        // ws.emit('recording-stopped', { roomId: })

        // Generate a dynamic filename based on the current date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().replace(/[-:]/g, '').slice(0, -5); // Remove separators and milliseconds
        const fileName = `recording-video_${formattedDate}.webm`;

        // Trigger download of the recorded video
        recorder.save(fileName);
        // You can use the videoURL to display the recorded video or send it to the server.
        console.log('Video URL:', videoURL);

        setIsRecording(false);
      });
    }
  };


  const peer = useMemo(() => {
    const meId = uuidV4()
    const me = new Peer(meId, {
      host: "/localhost", // localhost
      port: PORT,
      path: '/peerjs'
    })
    setMe(me)
    return me;
  }, [])

  peer.on('call', (call) => {
    call.answer(stream)
    call.on('stream', peerStream => {
      console.log('TCL -> peer.on -> peerStream: ##-1', { peerStream })
      dispatch(addPeerAction(call.peer, peerStream))
    })
  })

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

  const switchStream = useCallback((localStream: MediaStream) => {
    console.log('TCL -> switchStream -> stream:', { stream })
    setStream(localStream)
    // setScreenSharingId(me?.id || '')
    setIsShareScreen(prevVal => !prevVal)

    if (peer) {
      console.log('TCL -> switchStream -> peer:', { peer })
      Object.values(peer?.connections).forEach((connection: any) => {
        const videoTrack = localStream?.getTracks().find(track => track.kind === 'video')
        connection[0].peerConnection.getSenders()[1].replaceTrack(videoTrack).catch((err: any) => console.error(err))
      })
    }
  }, [peer, stream])

  const screenShareToggle = useCallback(() => {
    if (isShareScreen) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(switchStream)
    } else {
      navigator.mediaDevices.getDisplayMedia({}).then(switchStream)
    }
  }, [isShareScreen, switchStream])


  const userJoined = useCallback(
    async ({ peerId }: { peerId: string }) => {
      // if (!stream) return
      await delay(500);
      const call = peer.call(peerId, stream as MediaStream)

      call.on('stream', peerStream => {
        console.log('TCL -> peer.on -> peerStream: ##-2', { peerStream })
        dispatch(addPeerAction(peerId, peerStream))
      })

      call.on('error', error => {
        console.error('Call error:', error);
      });
    },
    [peer, stream]
  )


  const toggleWebcam = () => {
    if (stream) {
      if (typeof stream.getVideoTracks === 'function') {
        const videoTracks = stream.getVideoTracks()
        if (Array.isArray(videoTracks) && videoTracks.length > 0) {
          videoTracks.forEach(track => {
            if ('enabled' in track) {
              track.enabled = !isWebcamOn;
            } else {
              console.error('Track does not have an "enabled" property:', track);
            }
          });
          setIsWebcamOn(prevWebcam => !prevWebcam);
        } else {
          console.error('No video tracks found in the stream.');
        }
      } else {
        console.error('getVideoTracks method not available in the stream object.');
      }
    }
  };

  const toggleMute = () => {
    if (stream) {
      if (typeof stream.getAudioTracks === 'function') {
        const audioTracks = stream.getAudioTracks()
        if (Array.isArray(audioTracks) && audioTracks.length > 0) {
          audioTracks.forEach(track => {
            if ('enabled' in track) {
              track.enabled = !isMuted;
            } else {
              console.error('Track does not have an "enabled" property:', track);
            }
          });
          setIsMuted(prevMuted => !prevMuted)
        } else {
          console.error('No audio tracks found in the stream.');
        }
      } else {
        console.error('getAudioTracks method not available in the stream object.');
      }
    }
  };

  useEffect(() => {
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


  useEffect(() => {
    ws.on('user-joined', userJoined)

    return () => {
      ws.off('user-joined', userJoined)
    }
  }, [ws, userJoined])

  useEffect(() => {
    if (stream && stream.getTracks && typeof stream.getTracks === 'function') {
      // Listen for the 'inactive' event on the tracks
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', screenShareToggle);
      });
    }

    return () => {
      // Remove the event listeners when the component unmounts
      if (stream && stream.getTracks && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach(track => {
          track.removeEventListener('ended', screenShareToggle);
        });
      }
    };
  }, [screenShareToggle, stream]);

  return (<RoomContext.Provider value={{ ws, me, stream, peers, screenShareToggle, videoRef, isRecording, startRecording, stopRecording, videoURL, isWebcamOn, isMuted, toggleWebcam, toggleMute }}>{children}</RoomContext.Provider>)
}

export default RoomContextProvider
