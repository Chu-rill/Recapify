import * as React from "react";
import { toast as sonnerToast, Toaster } from "sonner";

// Types for toast options
interface ToastOptions {
  id?: string | number;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
  duration?: number;
  dismissible?: boolean;
  onDismiss?: (toast: any) => void;
  onAutoClose?: (toast: any) => void;
  important?: boolean;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
}

// Main toast function that wraps Sonner's API
function toast(message: string | React.ReactNode, options?: ToastOptions) {
  const { title, description, action, cancel, ...restOptions } = options || {};

  // If both title and description are provided, use them
  if (title && description) {
    return sonnerToast(title, {
      description,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
      cancel: cancel
        ? {
            label: cancel.label,
            onClick: cancel.onClick || (() => {}),
          }
        : undefined,
      ...restOptions,
    });
  }

  // If only description is provided, use message as title
  if (description && !title) {
    return sonnerToast(message, {
      description,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
      cancel: cancel
        ? {
            label: cancel.label,
            onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
              cancel.onClick?.(e);
            },
          }
        : undefined,
      ...restOptions,
    });
  }

  // Default case - just show the message
  return sonnerToast(message, {
    action: action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
    cancel: cancel
      ? {
          label: cancel.label,
          onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
            cancel.onClick?.(e);
          },
        }
      : undefined,
    ...restOptions,
  });
}

// Convenience methods for different toast types
toast.success = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast.success(message, options);
};

toast.error = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast.error(message, options);
};

toast.info = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast.info(message, options);
};

toast.warning = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast.warning(message, options);
};

toast.loading = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast.loading(message, options);
};

// Promise-based toast for async operations
toast.promise = <T>(
  promise: Promise<T>,
  options: {
    loading: string | React.ReactNode;
    success: string | React.ReactNode | ((data: T) => string | React.ReactNode);
    error:
      | string
      | React.ReactNode
      | ((error: any) => string | React.ReactNode);
  }
) => {
  return sonnerToast.promise(promise, options);
};

// Custom toast with full control
toast.custom = (
  jsx: (id: string | number) => React.ReactElement,
  options?: ToastOptions
) => {
  return sonnerToast.custom(jsx, options);
};

// Dismiss functions
toast.dismiss = (id?: string | number) => {
  return sonnerToast.dismiss(id);
};

// Hook for accessing toast functionality
function useToast() {
  return {
    toast,
    dismiss: toast.dismiss,
  };
}

// Export the Toaster component that needs to be rendered in your app
export { Toaster, useToast, toast };

// Usage example:
/*
// In your main App component:
import { Toaster } from './toast';

function App() {
  return (
    <div>
      <YourAppContent />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
      />
    </div>
  );
}

// In your components:
import { toast, useToast } from './toast';

function MyComponent() {
  const { toast: toastFn } = useToast();
  
  const handleClick = () => {
    // Basic toast
    toast('Hello World!');
    
    // Success toast
    toast.success('Operation completed!');
    
    // Error toast
    toast.error('Something went wrong!');
    
    // Toast with action
    toast('New message received', {
      action: {
        label: 'View',
        onClick: () => console.log('Action clicked'),
      },
    });
    
    // Promise toast
    toast.promise(
      fetch('/api/data').then(res => res.json()),
      {
        loading: 'Loading...',
        success: 'Data loaded successfully!',
        error: 'Failed to load data',
      }
    );
  };
  
  return <button onClick={handleClick}>Show Toast</button>;
}
*/
