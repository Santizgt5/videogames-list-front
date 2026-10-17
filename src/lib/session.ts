import type { QueryClient } from "@tanstack/react-query";
import type { User } from "../api/types";

/**
 * Cambia el usuario actual y tira los datos cacheados de la cuenta anterior.
 * No usamos qc.clear(): borraría también la consulta ["me"] que App está observando
 * y la pantalla no se enteraría del cambio.
 */
export function switchUser(qc: QueryClient, user: User | null) {
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "me" });
  qc.setQueryData(["me"], user);
}
