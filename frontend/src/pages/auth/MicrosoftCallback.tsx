import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { setUser } from '../../store/slices/auth.slice';

export const MicrosoftCallback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Extract tokens from URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userJson = params.get('user');

    if (accessToken && refreshToken && userJson) {
      try {
        const user = JSON.parse(decodeURIComponent(userJson));

        // Store in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Update Redux store
        dispatch(setUser(user));

        // Navigate to dashboard
        navigate('/hub/ap/dashboard');
      } catch (error) {
        console.error('Error parsing auth response:', error);
        navigate('/login?error=invalid_response');
      }
    } else {
      navigate('/login?error=missing_tokens');
    }
  }, [dispatch, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing Microsoft sign-in...</p>
      </div>
    </div>
  );
};
