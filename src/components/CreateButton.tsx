import { MouseEvent } from "react";
import useRoomContext from "../hooks/useRoomContext"

function CreateRoom() {
  const { ws } = useRoomContext()

  const createRoom = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    ws.emit('create-room');
  }
  return (
    <button onClick={createRoom} className='bg-rose-400 py-2 px-8 rounded-lg text-xl hover:bg-rose-600 text-white'>Start new meeting</button>
  )
}

export default CreateRoom