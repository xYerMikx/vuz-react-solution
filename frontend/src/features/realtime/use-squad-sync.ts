import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "@app/hooks";
import { routes } from "@app/routes";
import { authApi } from "@features/auth/api";
import { removeSquad, saveSquad, squadApi } from "@features/squad/api";
import type { SquadDetail } from "@features/squad/model";
import { refreshAccess } from "@shared/api/base-api";

import {
  POPULARITY_UPDATED,
  SESSION_ENDED,
  SQUAD_DELETED,
  SQUAD_UPDATED,
} from "./events";
import type { CharacterPopularity, SquadDeleted } from "./model";
import {
  closeSquadSocket,
  connectSquadSocket,
  disconnectSquadSocket,
  squadSocketCanReconnect,
} from "./squad-socket";

export function useSquadSync(): CharacterPopularity[] {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<CharacterPopularity[]>([]);

  useEffect(() => {
    let active = true;
    let connectedBefore = false;
    const socket = connectSquadSocket();

    const onSquad = (squad: SquadDetail) => {
      saveSquad(squad, dispatch);
    };

    const onDeleted = (payload: SquadDeleted) => {
      if (typeof payload?.squadId !== "string") {
        return;
      }

      if (typeof payload.updatedAt !== "string") {
        return;
      }

      removeSquad(payload.squadId, payload.updatedAt, dispatch);
    };

    const onPopularity = (next: CharacterPopularity[]) => {
      if (!active || !Array.isArray(next)) {
        return;
      }

      setCharacters(next);
    };

    const onConnect = () => {
      if (!connectedBefore) {
        connectedBefore = true;

        return;
      }

      dispatch(squadApi.util.invalidateTags(["Squad"]));
    };

    const onConnectError = () => {
      if (!squadSocketCanReconnect()) {
        return;
      }

      void refreshAccess().then((refreshed) => {
        if (!active || !refreshed || !squadSocketCanReconnect()) {
          return;
        }

        socket.connect();
      });
    };

    const onSessionEnded = () => {
      active = false;
      closeSquadSocket();
      dispatch(authApi.util.resetApiState());
      void navigate(routes.login);
    };

    socket.on(SQUAD_UPDATED, onSquad);
    socket.on(SQUAD_DELETED, onDeleted);
    socket.on(POPULARITY_UPDATED, onPopularity);
    socket.on(SESSION_ENDED, onSessionEnded);
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);

    return () => {
      active = false;
      socket.off(SQUAD_UPDATED, onSquad);
      socket.off(SQUAD_DELETED, onDeleted);
      socket.off(POPULARITY_UPDATED, onPopularity);
      socket.off(SESSION_ENDED, onSessionEnded);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      disconnectSquadSocket();
    };
  }, [dispatch, navigate]);

  return characters;
}
