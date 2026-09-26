import { useEffect, useState } from "react";

type AsyncState<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
};

export function useAsync<T>(factory: () => Promise<T>, dependencies: readonly unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let isActive = true;

    setState(current => ({
      data: current.data,
      error: null,
      isLoading: true,
    }));

    void factory()
      .then(data => {
        if (!isActive) {
          return;
        }

        setState({
          data,
          error: null,
          isLoading: false,
        });
      })
      .catch(error => {
        if (!isActive) {
          return;
        }

        setState({
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          isLoading: false,
        });
      });

    return () => {
      isActive = false;
    };
  }, dependencies);

  return state;
}
