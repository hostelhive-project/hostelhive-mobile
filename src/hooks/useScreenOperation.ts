import { useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/** Ignore async completions after blur or a change to the displayed record. */
export function useScreenOperation(scope: string) {
  const state = useMemo(() => ({
    scope,
    active: false,
    generation: 0,
    operations: new Map<string, symbol>(),
  }), [scope]);

  useFocusEffect(useCallback(() => {
    state.active = true;
    return () => {
      state.active = false;
      state.generation += 1;
      state.operations.clear();
    };
  }, [state]));

  return useCallback((name: string) => {
    if (!state.active || state.operations.has(name)) return null;
    const token = Symbol(name);
    const generation = state.generation;
    state.operations.set(name, token);
    return {
      isCurrent: () => state.active
        && generation === state.generation
        && state.operations.get(name) === token,
      finish: () => {
        if (state.operations.get(name) === token) state.operations.delete(name);
      },
    };
  }, [state]);
}
