import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, CircularProgress, Box } from '@mui/material';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { auth } from '../firebase';
import { Post as PostType } from '../types/post';

const firestore = getFirestore();

const Post: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        navigate('/');
        return;
      }

      try {
        const postRef = doc(firestore, 'posts', postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
          navigate('/');
          return;
        }

        setPost({
          id: postDoc.id,
          ...postDoc.data()
        } as PostType);
      } catch (error) {
        console.error('Error al cargar el post:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, navigate]);

  useEffect(() => {
    if (post) {
      navigate('/');
    }
  }, [post, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 10 }}>
      {/* Por ahora solo mostramos un contenedor vacío mientras se procesa la redirección */}
    </Container>
  );
};

export default Post; 