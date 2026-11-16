import { useEffect, useState } from "react";
import { getCachedAssetUrl } from "../services/imageCache";

interface AssetUrlState {
  url: string | null;
  error: boolean;
  loading: boolean;
}

export function useAssetUrl(sourceUrl: string | undefined): AssetUrlState {
  const [state, setState] = useState<AssetUrlState>({
    url: null,
    error: false,
    loading: Boolean(sourceUrl),
  });

  useEffect(() => {
    let active = true;
    if (!sourceUrl) {
      setState({ url: null, error: false, loading: false });
      return () => {
        active = false;
      };
    }

    setState({ url: null, error: false, loading: true });
    getCachedAssetUrl(sourceUrl)
      .then((url) => {
        if (active) setState({ url, error: false, loading: false });
      })
      .catch(() => {
        if (active) setState({ url: null, error: true, loading: false });
      });

    return () => {
      active = false;
    };
  }, [sourceUrl]);

  return state;
}