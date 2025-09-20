import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../pages/LoginPage';
import { useAuth } from '../../hooks/useAuth';
import { User } from 'safehaven-shared';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock React Router's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => 
    <a href={to}>{children}</a>,
  useNavigate: () => mockNavigate,
}));

describe('LoginPage Component', () => {
  const mockLogin = jest.fn() as jest.MockedFunction<(email: string, password: string) => Promise<boolean>>;
  const mockRegister = jest.fn() as jest.MockedFunction<(userData: {
    email: string;
    password: string;
    profile: {
      firstName: string;
      lastName: string;
      phone?: string;
      organization?: string;
    };
    role: string;
  }) => Promise<boolean>>;
  const mockLogout = jest.fn() as jest.MockedFunction<() => void>;

  const mockAuthHook = {
    user: null as User | null,
    token: null as string | null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
  };

  const renderWithRouter = (component: React.ReactElement) => {
    return render(component);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthHook);
  });

  describe('Component Rendering', () => {
    it('should render login form with all required fields', () => {
      renderWithRouter(<LoginPage />);

      expect(screen.getByRole('heading', { name: /sign in to safehaven connect/i })).toBeDefined();
      expect(screen.getByLabelText(/email/i)).toBeDefined();
      expect(screen.getByLabelText(/password/i)).toBeDefined();
    });

    it('should render login button', () => {
      renderWithRouter(<LoginPage />);

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      expect(loginButton).toBeDefined();
      expect(loginButton.hasAttribute('disabled')).toBe(false);
    });

    it('should render register link', () => {
      renderWithRouter(<LoginPage />);

      const registerLink = screen.getByRole('link', { name: /register here/i });
      expect(registerLink).toBeDefined();
      expect(registerLink.getAttribute('href')).toBe('/register');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields on submit', async () => {
      renderWithRouter(<LoginPage />);

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.getByText(/please enter your email/i)).toBeDefined();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      // Fill password
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeDefined();
      });
    });

    it('should validate password is not empty', async () => {
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter your password/i)).toBeDefined();
      });
    });
  });

  describe('Form Submission', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const fillValidForm = () => {
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: validCredentials.email } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: validCredentials.password } });
    };

    it('should submit form with valid credentials', async () => {
      mockLogin.mockResolvedValue(true);

      renderWithRouter(<LoginPage />);
      fillValidForm();

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(validCredentials.email, validCredentials.password);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle successful login and redirect to dashboard', async () => {
      mockLogin.mockResolvedValue(true);

      renderWithRouter(<LoginPage />);
      fillValidForm();

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle login failure', async () => {
      mockLogin.mockResolvedValue(false);

      renderWithRouter(<LoginPage />);
      fillValidForm();

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeDefined();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle login error with proper error message', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<LoginPage />);
      fillValidForm();

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred during login/i)).toBeDefined();
      });
    });
  });

  describe('Loading States', () => {
    it('should handle auth loading state', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthHook,
        isLoading: true
      });

      renderWithRouter(<LoginPage />);

      expect(screen.getByText(/loading/i)).toBeDefined();
    });

    it('should show submitting state during login', async () => {
      // Mock a slow login process
      let resolveLogin: (value: boolean) => void;
      const loginPromise = new Promise<boolean>(resolve => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValue(loginPromise);

      renderWithRouter(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      // Check for loading state
      await waitFor(() => {
        expect(loginButton.hasAttribute('disabled')).toBe(true);
      });

      // Resolve the login
      resolveLogin!(true);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Redirect Logic', () => {
    it('should redirect authenticated users to dashboard', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthHook,
        isAuthenticated: true,
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'first_responder' as any,
          profile: { firstName: 'John', lastName: 'Doe' },
          isActive: true,
          createdAt: new Date().toISOString()
        } as User
      });

      renderWithRouter(<LoginPage />);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  describe('Input Handling', () => {
    it('should handle email input changes', () => {
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should handle password input changes', () => {
      renderWithRouter(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput.value).toBe('password123');
    });

    it('should trim whitespace from email input', async () => {
      mockLogin.mockResolvedValue(true);

      renderWithRouter(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '  test@example.com  ' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should normalize email to lowercase', async () => {
      mockLogin.mockResolvedValue(true);

      renderWithRouter(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'Test@EXAMPLE.COM' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form accessibility attributes', () => {
      renderWithRouter(<LoginPage />);

      // Test form accessibility
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput.getAttribute('type')).toBe('email');
      expect(emailInput.hasAttribute('required')).toBe(true);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput.getAttribute('type')).toBe('password');
      expect(passwordInput.hasAttribute('required')).toBe(true);

      // Check for proper labeling
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
    });

    it('should have proper heading structure', () => {
      renderWithRouter(<LoginPage />);

      const heading = screen.getByRole('heading', { name: /sign in to safehaven connect/i });
      expect(heading).toBeDefined();
      expect(heading.tagName.toLowerCase()).toBe('h1');
    });
  });

  describe('Security Features', () => {
    it('should use password input type for password field', () => {
      renderWithRouter(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput.getAttribute('type')).toBe('password');
    });

    it('should not display password in DOM', () => {
      renderWithRouter(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'secretpassword' } });

      // The actual value should be hidden from display
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Requirements Compliance', () => {
    it('should meet REQ-FE-001 User Authentication requirements', async () => {
      mockLogin.mockResolvedValue(true);

      renderWithRouter(<LoginPage />);

      // Test secure login form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'coordinator@emergency.gov' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'SecurePassword123!' } });

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('coordinator@emergency.gov', 'SecurePassword123!');
      });

      // Verify navigation to dashboard after successful login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should meet REQ-SEC-001 Secure Authentication requirements', async () => {
      renderWithRouter(<LoginPage />);

      // Test secure input handling
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput.getAttribute('type')).toBe('password');
      expect(passwordInput.hasAttribute('autocomplete')).toBe(true);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput.getAttribute('type')).toBe('email');
      expect(emailInput.hasAttribute('autocomplete')).toBe(true);

      // Test form submission security
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      // Should call secure login function
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
      });
    });

    it('should meet REQ-UI-001 User Interface requirements', () => {
      renderWithRouter(<LoginPage />);

      // Test responsive form design
      expect(screen.getByRole('heading', { name: /sign in to safehaven connect/i })).toBeDefined();
      
      // Test intuitive navigation
      const registerLink = screen.getByRole('link', { name: /register here/i });
      expect(registerLink).toBeDefined();
      expect(registerLink.getAttribute('href')).toBe('/register');

      // Test clear call-to-action
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      expect(loginButton).toBeDefined();

      // Test form accessibility
      expect(screen.getByLabelText(/email/i)).toBeDefined();
      expect(screen.getByLabelText(/password/i)).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockLogin.mockRejectedValue(new Error('Failed to fetch'));

      renderWithRouter(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred during login/i)).toBeDefined();
      });
    });

    it('should handle authentication service errors', async () => {
      mockLogin.mockRejectedValue(new Error('Authentication service unavailable'));

      renderWithRouter(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred during login/i)).toBeDefined();
      });
    });

    it('should clear error messages on successful retry', async () => {
      // First, simulate a failed login
      mockLogin.mockResolvedValueOnce(false);

      renderWithRouter(<LoginPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });

      let loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeDefined();
      });

      // Then simulate a successful login
      mockLogin.mockResolvedValueOnce(true);
      
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correctpassword' } });
      
      loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });

      // Error message should be cleared
      expect(screen.queryByText(/invalid email or password/i)).toBeNull();
    });
  });
});