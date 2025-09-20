import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../../pages/RegisterPage';
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

describe('RegisterPage Component', () => {
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
    it('should render registration form with all required fields', () => {
      renderWithRouter(<RegisterPage />);

      expect(screen.getByRole('heading', { name: /register for safehaven connect/i })).toBeDefined();
      expect(screen.getByLabelText(/email/i)).toBeDefined();
      expect(screen.getByLabelText(/password/i)).toBeDefined();
      expect(screen.getByLabelText(/confirm password/i)).toBeDefined();
      expect(screen.getByLabelText(/first name/i)).toBeDefined();
      expect(screen.getByLabelText(/last name/i)).toBeDefined();
      expect(screen.getByLabelText(/phone number/i)).toBeDefined();
      expect(screen.getByLabelText(/organization/i)).toBeDefined();
      expect(screen.getByLabelText(/role/i)).toBeDefined();
    });

    it('should render role selection with correct options', () => {
      renderWithRouter(<RegisterPage />);

      const roleSelect = screen.getByLabelText(/role/i);
      expect(roleSelect).toBeDefined();

      // Check that the select contains the expected options
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(1);
      
      expect(screen.getByRole('option', { name: /first responder/i })).toBeDefined();
      expect(screen.getByRole('option', { name: /emergency coordinator/i })).toBeDefined();
    });

    it('should render register button', () => {
      renderWithRouter(<RegisterPage />);

      const registerButton = screen.getByRole('button', { name: /register/i });
      expect(registerButton).toBeDefined();
      expect(registerButton.hasAttribute('disabled')).toBe(false);
    });

    it('should render login link', () => {
      renderWithRouter(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /sign in here/i });
      expect(loginLink).toBeDefined();
      expect(loginLink.getAttribute('href')).toBe('/login');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields on submit', async () => {
      renderWithRouter(<RegisterPage />);

      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.getByText(/please fill in all required fields/i)).toBeDefined();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      renderWithRouter(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      // Fill other required fields
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'ValidPassword123!' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPassword123!' } });
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });

      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeDefined();
      });
    });

    it('should validate password strength', async () => {
      renderWithRouter(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });

      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters long/i)).toBeDefined();
      });
    });

    it('should validate password confirmation match', async () => {
      renderWithRouter(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });

      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeDefined();
      });
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      email: 'test@example.com',
      password: 'ValidPassword123!',
      confirmPassword: 'ValidPassword123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      organization: 'Test Organization',
      role: 'FIRST_RESPONDER'
    };

    const fillValidForm = () => {
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: validFormData.email } });
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: validFormData.password } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: validFormData.confirmPassword } });
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: validFormData.firstName } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: validFormData.lastName } });
      fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: validFormData.phone } });
      fireEvent.change(screen.getByLabelText(/organization/i), { target: { value: validFormData.organization } });
      fireEvent.change(screen.getByLabelText(/role/i), { target: { value: validFormData.role } });
    };

    it('should submit form with valid data', async () => {
      mockRegister.mockResolvedValue(true);

      renderWithRouter(<RegisterPage />);
      fillValidForm();

      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: validFormData.email,
          password: validFormData.password,
          profile: {
            firstName: validFormData.firstName,
            lastName: validFormData.lastName,
            phone: validFormData.phone,
            organization: validFormData.organization,
          },
          role: validFormData.role,
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle registration failure', async () => {
      mockRegister.mockResolvedValue(false);

      renderWithRouter(<RegisterPage />);
      fillValidForm();

      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/registration failed/i)).toBeDefined();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should handle auth loading state', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthHook,
        isLoading: true
      });

      renderWithRouter(<RegisterPage />);

      expect(screen.getByText(/loading/i)).toBeDefined();
    });

    it('should show submitting state during registration', async () => {
      // Mock a slow registration process
      let resolveRegister: (value: boolean) => void;
      const registerPromise = new Promise<boolean>(resolve => {
        resolveRegister = resolve;
      });
      mockRegister.mockReturnValue(registerPromise);

      renderWithRouter(<RegisterPage />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'ValidPassword123!' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'ValidPassword123!' } });
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'FIRST_RESPONDER' } });

      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);

      // Check for loading state
      await waitFor(() => {
        expect(registerButton.hasAttribute('disabled')).toBe(true);
      });

      // Resolve the registration
      resolveRegister!(true);
      
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

      renderWithRouter(<RegisterPage />);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  describe('Requirements Compliance', () => {
    it('should meet REQ-FE-002 User Registration requirements', async () => {
      mockRegister.mockResolvedValue(true);

      renderWithRouter(<RegisterPage />);

      // Test secure registration form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'responder@fire.gov' } });
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'SecurePassword123!' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'SecurePassword123!' } });
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Fire' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Fighter' } });
      fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+1234567890' } });
      fireEvent.change(screen.getByLabelText(/organization/i), { target: { value: 'Fire Department' } });
      fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'FIRST_RESPONDER' } });

      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'responder@fire.gov',
          password: 'SecurePassword123!',
          profile: {
            firstName: 'Fire',
            lastName: 'Fighter',
            phone: '+1234567890',
            organization: 'Fire Department',
          },
          role: 'FIRST_RESPONDER',
        });
      });

      // Verify navigation to dashboard after successful registration
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should meet REQ-SEC-002 Access Control requirements', () => {
      renderWithRouter(<RegisterPage />);

      // Test role-based registration
      const roleSelect = screen.getByLabelText(/role/i);
      expect(roleSelect).toBeDefined();

      // Verify role options for self-registration
      expect(screen.getByRole('option', { name: /first responder/i })).toBeDefined();
      expect(screen.getByRole('option', { name: /emergency coordinator/i })).toBeDefined();

      // Verify no admin or high-privilege roles available for self-registration
      expect(screen.queryByRole('option', { name: /admin/i })).toBeNull();
      expect(screen.queryByRole('option', { name: /super/i })).toBeNull();
    });

    it('should meet REQ-UI-001 User Interface requirements', () => {
      renderWithRouter(<RegisterPage />);

      // Test responsive form design
      expect(screen.getByRole('heading', { name: /register for safehaven connect/i })).toBeDefined();
      
      // Test form accessibility
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput.getAttribute('type')).toBe('email');
      expect(emailInput.hasAttribute('required')).toBe(true);

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput.getAttribute('type')).toBe('password');
      expect(passwordInput.hasAttribute('required')).toBe(true);

      // Test proper labeling
      expect(screen.getByLabelText(/first name/i).hasAttribute('required')).toBe(true);
      expect(screen.getByLabelText(/last name/i).hasAttribute('required')).toBe(true);
      expect(screen.getByLabelText(/role/i).hasAttribute('required')).toBe(true);
    });
  });
});