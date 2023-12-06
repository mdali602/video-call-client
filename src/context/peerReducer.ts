import { ADD_PEER, REMOVE_PEER } from "./peerActions";

export type PeerState = Record<string, { stream: MediaStream }>;

type PeerAction =
  | {
      type: typeof ADD_PEER;
      payload: { peerId: string; stream: MediaStream };
    }
  | {
      type: typeof REMOVE_PEER;
      payload: { peerId: string };
    };

export const peerReducer = (state: PeerState, action: PeerAction) => {
  switch (action.type) {
    case ADD_PEER: {
      const newState = {
        ...state,
        [action.payload.peerId]: {
          stream: action.payload.stream,
        },
      };
      return newState;
    }
    case REMOVE_PEER: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action.payload.peerId]: deleted, ...rest } = state;
      return rest;
    }
    default:
      return { ...state };
  }
};
