import { useEffect } from "react";
import { useRouter } from "next/router";

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, []);

  return null; // Solo redirige, sin mostrar contenido
};

export default Index;