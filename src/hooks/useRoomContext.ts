import { useContext } from "react";
import { RoomContext } from "../context/RoomContext";

function useRoomContext() {
  return useContext(RoomContext);
}

export default useRoomContext;
