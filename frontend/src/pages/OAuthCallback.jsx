import React, { useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export function OAuthCallback() {
  const { oauthLogin } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");

    if (token && refresh) {
      oauthLogin(token, refresh)
        .then(() => {
          navigate("/", { replace: true });
        })
        .catch((err) => {
          console.error("OAuth login callback failed", err);
          navigate("/login?error=Authentication callback failure", { replace: true });
        });
    } else {
      navigate("/login?error=Missing authentication parameters", { replace: true });
    }
  }, [searchParams, oauthLogin, navigate]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#ffe251] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[#e5e2e1] text-sm animate-pulse">Finalizing secure OAuth handshake...</p>
    </div>
  );
}
