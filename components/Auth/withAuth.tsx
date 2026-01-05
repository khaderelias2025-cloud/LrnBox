
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// This is a mock authentication check. In a real app, you'd use a library like
// NextAuth.js or your own authentication logic.
const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('isAuthenticated') === 'true';
  }
  return false;
};

const withAuth = (WrappedComponent: React.ComponentType) => {
  return (props: any) => {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
      if (!isAuthenticated()) {
        router.push('/auth');
      } else {
        setIsAuth(true);
      }
    }, []);

    if (!isAuth) {
      return null; // Or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
