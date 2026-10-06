import { Navigate, useParams } from "react-router";

/** Old product/need detail URLs now live under /post/:id. */
export const ToPost = () => {
  const { id } = useParams();
  return <Navigate to={`/post/${id}`} replace />;
};
