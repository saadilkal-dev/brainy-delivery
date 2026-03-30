import { useParams, Navigate } from 'react-router-dom';

export default function ProjectRedirect() {
  const { id } = useParams();
  return <Navigate to={`/projects/${id}/dashboard`} replace />;
}
