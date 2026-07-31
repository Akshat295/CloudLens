import { useEffect, useState } from "react";
import { getAwsConnection, disconnectAwsAccount } from "../services/awsConnection.service";

// Shared by Navbar and any other component that needs to know whether the
// current user has a connected AWS account — each caller gets its own fetch
// (no global store), which is fine since this is a single cheap GET.
export const useAwsConnection = () => {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getAwsConnection()
      .then((data) => {
        if (!cancelled) setConnection(data);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const disconnect = async () => {
    setDisconnecting(true);

    try {
      await disconnectAwsAccount();
      setConnection(null);
    } catch (error) {
      console.error(error);
    } finally {
      setDisconnecting(false);
    }
  };

  return { connection, loading, disconnecting, disconnect };
};
